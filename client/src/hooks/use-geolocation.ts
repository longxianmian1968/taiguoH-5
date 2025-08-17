import { useState, useEffect, useCallback } from 'react';

export interface GeolocationPosition {
  lat: number;
  lng: number;
  accuracy?: number;
}

export interface GeolocationError {
  code: number;
  message: string;
}

export interface UseGeolocationResult {
  position: GeolocationPosition | null;
  error: GeolocationError | null;
  loading: boolean;
  requestLocation: () => void;
  isSupported: boolean;
}

export function useGeolocation(): UseGeolocationResult {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<GeolocationError | null>(null);
  const [loading, setLoading] = useState(false);

  const isSupported = typeof navigator !== 'undefined' && 'geolocation' in navigator;

  const requestLocation = useCallback(() => {
    if (!isSupported) {
      setError({
        code: 0,
        message: '您的设备不支持定位功能',
      });
      return;
    }

    setLoading(true);
    setError(null);

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000, // 10 seconds
      maximumAge: 300000, // 5 minutes
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setLoading(false);
        setError(null);
      },
      (err) => {
        let message = '无法获取定位，请在设置中开启定位或稍后重试';
        
        switch (err.code) {
          case err.PERMISSION_DENIED:
            message = '定位权限被拒绝，请在设置中开启定位权限';
            break;
          case err.POSITION_UNAVAILABLE:
            message = '定位信息不可用，请检查网络连接';
            break;
          case err.TIMEOUT:
            message = '定位请求超时，请稍后重试';
            break;
        }

        setError({
          code: err.code,
          message,
        });
        setLoading(false);
      },
      options
    );
  }, [isSupported]);

  // Auto-request location on mount if user has previously granted permission
  useEffect(() => {
    if (isSupported) {
      // Check if we can get cached position first
      navigator.permissions?.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted') {
          requestLocation();
        }
      }).catch(() => {
        // Permissions API not supported, skip auto-request
      });
    }
  }, [isSupported, requestLocation]);

  return {
    position,
    error,
    loading,
    requestLocation,
    isSupported,
  };
}

// Hook for watching position changes (for live tracking)
export function useGeolocationWatcher(): UseGeolocationResult & { stopWatching: () => void } {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<GeolocationError | null>(null);
  const [loading, setLoading] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);

  const isSupported = typeof navigator !== 'undefined' && 'geolocation' in navigator;

  const requestLocation = useCallback(() => {
    if (!isSupported) {
      setError({
        code: 0,
        message: '您的设备不支持定位功能',
      });
      return;
    }

    setLoading(true);
    setError(null);

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000, // 1 minute for watching
    };

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setLoading(false);
        setError(null);
      },
      (err) => {
        let message = '无法获取定位，请在设置中开启定位或稍后重试';
        
        switch (err.code) {
          case err.PERMISSION_DENIED:
            message = '定位权限被拒绝，请在设置中开启定位权限';
            break;
          case err.POSITION_UNAVAILABLE:
            message = '定位信息不可用，请检查网络连接';
            break;
          case err.TIMEOUT:
            message = '定位请求超时，请稍后重试';
            break;
        }

        setError({
          code: err.code,
          message,
        });
        setLoading(false);
      },
      options
    );

    setWatchId(id);
  }, [isSupported]);

  const stopWatching = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setLoading(false);
    }
  }, [watchId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  return {
    position,
    error,
    loading,
    requestLocation,
    stopWatching,
    isSupported,
  };
}

// Utility function to calculate distance between two points
export function calculateDistance(
  pos1: GeolocationPosition,
  pos2: GeolocationPosition
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = deg2rad(pos2.lat - pos1.lat);
  const dLng = deg2rad(pos2.lng - pos1.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(pos1.lat)) * Math.cos(deg2rad(pos2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}
