import { Storage, File } from "@google-cloud/storage";
import { Response } from "express";
import { randomUUID } from "crypto";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

// Object storage client
export const objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token",
      },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

export class ObjectStorageService {
  constructor() {}

  // Get public object search paths
  getPublicObjectSearchPaths(): Array<string> {
    const pathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "";
    const paths = Array.from(
      new Set(
        pathsStr
          .split(",")
          .map((path) => path.trim())
          .filter((path) => path.length > 0)
      )
    );
    if (paths.length === 0) {
      throw new Error(
        "PUBLIC_OBJECT_SEARCH_PATHS not set. Create a bucket in 'Object Storage' " +
          "tool and set PUBLIC_OBJECT_SEARCH_PATHS env var (comma-separated paths)."
      );
    }
    return paths;
  }

  // Get private object directory
  getPrivateObjectDir(): string {
    const dir = process.env.PRIVATE_OBJECT_DIR || "";
    if (!dir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' " +
          "tool and set PRIVATE_OBJECT_DIR env var."
      );
    }
    return dir;
  }

  // Search for a public object from the search paths
  async searchPublicObject(filePath: string): Promise<File | null> {
    console.log('Searching for file:', filePath);
    
    // Get search paths like: ['/replit-objstore-xxx/public']
    for (const searchPath of this.getPublicObjectSearchPaths()) {
      // Build full object path: '/bucket/public/activities/filename'
      const fullPath = `${searchPath}/${filePath}`;
      console.log('Checking full path:', fullPath);
      
      const { bucketName, objectName } = parseObjectPath(fullPath);
      console.log('Parsed - bucket:', bucketName, 'objectName:', objectName);
      
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);

      try {
        const [exists] = await file.exists();
        console.log('File exists check:', exists, 'for object:', objectName);
        if (exists) {
          console.log('✅ File found at:', objectName);
          return file;
        }
      } catch (error) {
        console.error('Error checking file existence:', error);
      }
    }
    
    // Debug: List all files in bucket to see what's actually there
    try {
      const buckets = this.getPublicObjectSearchPaths();
      for (const bucket of buckets) {
        const { bucketName } = parseObjectPath(bucket);
        console.log('📂 Listing files in bucket:', bucketName);
        const [files] = await objectStorageClient.bucket(bucketName).getFiles({ prefix: 'public/' });
        files.slice(0, 5).forEach(file => console.log('  📄 Found file:', file.name));
      }
    } catch (error) {
      console.error('Error listing bucket files:', error);
    }
    
    console.log('❌ File not found in any search path for:', filePath);
    return null;
  }

  // Download an object to the response
  async downloadObject(file: File, res: Response, cacheTtlSec: number = 3600) {
    try {
      const [metadata] = await file.getMetadata();
      
      res.set({
        "Content-Type": metadata.contentType || "application/octet-stream",
        "Content-Length": metadata.size,
        "Cache-Control": `public, max-age=${cacheTtlSec}`,
      });

      const stream = file.createReadStream();
      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });

      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }

  // Get upload URL for public objects
  async getPublicUploadURL(fileName: string): Promise<string> {
    const publicSearchPaths = this.getPublicObjectSearchPaths();
    if (publicSearchPaths.length === 0) {
      throw new Error("No public search paths configured");
    }

    // Use the first public search path for uploads
    // fileName already contains the path like "activities/timestamp_xxx.jpg"
    const uploadPath = `${publicSearchPaths[0]}/${fileName}`;
    const { bucketName, objectName } = parseObjectPath(uploadPath);

    console.log(`Generating upload URL for: ${uploadPath}`, { bucketName, objectName });

    return signObjectURL({
      bucketName,
      objectName,
      method: "PUT",
      ttlSec: 900, // 15 minutes
    });
  }

  // Get public URL for an uploaded object
  getPublicObjectURL(objectPath: string): string {
    return `/public-objects${objectPath.startsWith('/') ? objectPath : '/' + objectPath}`;
  }
}

function parseObjectPath(path: string): {
  bucketName: string;
  objectName: string;
} {
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  const pathParts = path.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }

  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join("/");

  return { bucketName, objectName };
}

async function signObjectURL({
  bucketName,
  objectName,
  method,
  ttlSec,
}: {
  bucketName: string;
  objectName: string;
  method: "GET" | "PUT" | "DELETE" | "HEAD";
  ttlSec: number;
}): Promise<string> {
  const request = {
    bucket_name: bucketName,
    object_name: objectName,
    method,
    expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
  };
  
  const response = await fetch(
    `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    }
  );
  
  if (!response.ok) {
    throw new Error(
      `Failed to sign object URL, errorcode: ${response.status}, ` +
        `make sure you're running on Replit`
    );
  }

  const responseData: any = await response.json();
  const { signed_url: signedURL } = responseData;
  return signedURL;
}

export const objectStorageService = new ObjectStorageService();