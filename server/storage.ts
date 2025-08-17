import { 
  users, stores, cities, activities, coupons, redeems, storeStaff, paymentOrders, i18nTranslations, bindTokens,
  groupActivity, groupInstance, groupMember, presaleActivity, presaleReservation, franchiseForm, franchiseLead,
  type User, type InsertUser, type Store, type InsertStore, type City, type InsertCity,
  type Activity, type InsertActivity, type Coupon, type InsertCoupon, type Redeem, type InsertRedeem,
  type StoreStaff, type InsertStoreStaff, type PaymentOrder, type InsertPaymentOrder,
  type I18nTranslation, type InsertI18nTranslation, type BindToken, type InsertBindToken,
  type GroupActivity, type InsertGroupActivity, type GroupInstance, type InsertGroupInstance,
  type GroupMember, type InsertGroupMember, type PresaleActivity, type InsertPresaleActivity,
  type PresaleReservation, type InsertPresaleReservation, type FranchiseForm, type InsertFranchiseForm,
  type FranchiseLead, type InsertFranchiseLead
} from "@shared/schema";
// Standalone database connection - no migration system dependencies
import { standaloneDb } from "./db-standalone";

// Use standalone connection for all environments to avoid migration issues
const db = standaloneDb;
import { eq, and, or, desc, asc, like, inArray, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByLineId(lineUserId: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;

  // Cities
  getCities(): Promise<City[]>;
  createCity(city: InsertCity): Promise<City>;

  // Stores
  getStores(filters?: { cityId?: number; search?: string }): Promise<Store[]>;
  getStore(id: string): Promise<Store | undefined>;
  createStore(store: InsertStore): Promise<Store>;
  updateStore(id: string, store: Partial<InsertStore>): Promise<Store | undefined>;
  getStoreStaff(storeId: string): Promise<(StoreStaff & { user: User })[]>;
  addStoreStaff(storeStaff: InsertStoreStaff): Promise<StoreStaff>;
  removeStoreStaff(storeId: string, userId: string): Promise<boolean>;

  // Activities
  getActivities(filters?: { 
    type?: string; 
    status?: string; 
    search?: string; 
    cityId?: number;
    cursor?: string;
    pageSize?: number;
  }): Promise<Activity[]>;
  getActivity(id: string): Promise<Activity | undefined>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  updateActivity(id: string, activity: Partial<InsertActivity>): Promise<Activity | undefined>;
  deleteActivity(id: string): Promise<boolean>;

  // Store coverage for activities
  getActivityStores(activityId: string, lat?: number, lng?: number, limit?: number): Promise<(Store & { distanceKm?: number; mapsUrl?: string })[]>;
  getStoresByActivityId(activityId: string): Promise<Store[]>;

  // Coupons
  getCoupons(filters?: { activityId?: string; userId?: string; status?: string }): Promise<Coupon[]>;
  getCoupon(id: string): Promise<Coupon | undefined>;
  getCouponByCode(code: string): Promise<Coupon | undefined>;
  createCoupon(coupon: InsertCoupon): Promise<Coupon>;
  updateCouponStatus(id: string, status: string): Promise<boolean>;
  markUserCouponsAsRead(userId: string): Promise<number>; // Returns number of updated coupons

  // Redeems
  getRedeems(filters?: { 
    storeId?: string; 
    staffId?: string; 
    activityId?: string;
    status?: string;
    from?: Date;
    to?: Date;
  }): Promise<(Redeem & { activity: Activity; store: Store; staff: User; coupon: Coupon })[]>;
  createRedeem(redeem: InsertRedeem): Promise<Redeem>;
  cancelRedeem(id: string, reason: string): Promise<boolean>;

  // Payment Orders
  createPaymentOrder(order: InsertPaymentOrder): Promise<PaymentOrder>;
  updatePaymentOrderStatus(id: string, status: string): Promise<boolean>;

  // Staff Management - 员工权限管理模块
  getStaff(filters?: { storeId?: string; search?: string }): Promise<(StoreStaff & { user: User; store: Store })[]>;
  createStaff(staff: InsertStoreStaff): Promise<StoreStaff>;
  updateStaffAuthorization(staffId: string, storeId: string, canVerify: boolean): Promise<boolean>;

  // Statistics & Analytics - 数据统计和分析模块
  getOverviewStats(filters?: { startDate?: string; endDate?: string }): Promise<{
    totalActivities: number;
    totalStores: number;
    totalRedeems: number;
    totalRevenue: number;
    avgRedemptionRate: number;
  }>;
  getRedemptionStats(filters?: {
    startDate?: string;
    endDate?: string;
    storeId?: string;
    activityId?: string;
    staffId?: string;
  }): Promise<any>;

  // Activity Analytics - 活动数据统计
  getActivityAnalytics(): Promise<{
    activityId: string;
    activityTitle: string;
    totalClaimed: number;
    totalRedeemed: number;
    storeStats: {
      storeId: string;
      storeName: string;
      redemptionCount: number;
    }[];
  }[]>;
  
  // Export activity commission data
  exportActivityCommissionData(activityId: string): Promise<{
    activityTitle: string;
    activityTitleTh?: string;
    exportData: {
      cityName: string;
      storeName: string;
      totalRedemptions: number;
      staffDetails: {
        staffName: string;
        lineId: string;
        redemptionCount: number;
      }[];
    }[];
  }>;

  // Module-specific configurations - 专门模块配置
  createGroupActivity(groupActivity: InsertGroupActivity): Promise<GroupActivity>;
  getGroupActivity(activityId: string): Promise<GroupActivity | undefined>;
  createPresaleActivity(presaleActivity: InsertPresaleActivity): Promise<PresaleActivity>;  
  createFranchiseForm(franchiseForm: InsertFranchiseForm): Promise<FranchiseForm>;
  
  // Group buying module - 团购模块
  createGroupInstance(groupInstance: InsertGroupInstance): Promise<GroupInstance>;
  joinGroup(groupMember: InsertGroupMember): Promise<GroupMember>;
  getGroupStatus(instanceId: string): Promise<GroupInstance | undefined>;
  getGroupInstancesByActivity(activityId: string): Promise<GroupInstance[]>;
  
  // Presale module - 预售模块
  createPresaleReservation(reservation: InsertPresaleReservation): Promise<PresaleReservation>;
  
  // Franchise module - 招商模块
  createFranchiseLead(lead: InsertFranchiseLead): Promise<FranchiseLead>;

  // I18n
  getTranslations(lang: string): Promise<I18nTranslation[]>;
  getTranslation(lang: string, key: string): Promise<I18nTranslation | undefined>;
  upsertTranslation(translation: InsertI18nTranslation): Promise<I18nTranslation>;
  getMissingKeys(days?: number): Promise<{ key: string; count: number }[]>;

  // LINE Binding - LINE绑定管理
  createBindToken(bindToken: InsertBindToken): Promise<BindToken>;
  getBindToken(token?: string, code?: string): Promise<BindToken | undefined>;
  updateBindTokenAttempts(id: string): Promise<boolean>;
  markBindTokenUsed(id: string): Promise<boolean>;
  updateBindTokenUsage(id: string, used: boolean): Promise<boolean>;
  updateUserLineBinding(userId: string, lineUserId?: string, liffSub?: string, role?: string): Promise<boolean>;
  isStaffAuthorizedForStore(userId: string, storeId: string): Promise<boolean>;
  removeStaff(staffId: string, storeId: string): Promise<boolean>;
  getStaffDetails(staffId: string, storeId: string): Promise<{
    user: User;
    store: Store;
    redemptionStats: {
      totalRedemptions: number;
      thisMonthRedemptions: number;
      avgPerDay: number;
    };
  } | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByLineId(lineUserId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.lineUserId, lineUserId));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(user)
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
  }

  // Cities
  async getCities(): Promise<City[]> {
    return await db.select().from(cities).orderBy(asc(cities.name));
  }

  async createCity(city: InsertCity): Promise<City> {
    const [newCity] = await db.insert(cities).values(city).returning();
    return newCity;
  }

  // Stores
  async getStores(filters?: { cityId?: number; search?: string }): Promise<Store[]> {
    const conditions = [];
    
    if (filters?.cityId) {
      conditions.push(eq(stores.cityId, filters.cityId));
    }
    
    if (filters?.search) {
      conditions.push(
        or(
          like(stores.name, `%${filters.search}%`),
          like(stores.address, `%${filters.search}%`)
        )
      );
    }

    if (conditions.length > 0) {
      return await db.select().from(stores).where(and(...conditions)).orderBy(asc(stores.name));
    }
    
    return await db.select().from(stores).orderBy(asc(stores.name));
  }

  async getStore(id: string): Promise<Store | undefined> {
    const [store] = await db.select().from(stores).where(eq(stores.id, id));
    return store || undefined;
  }

  async createStore(store: InsertStore): Promise<Store> {
    const [newStore] = await db.insert(stores).values(store).returning();
    return newStore;
  }

  async updateStore(id: string, store: Partial<InsertStore>): Promise<Store | undefined> {
    const [updatedStore] = await db
      .update(stores)
      .set(store)
      .where(eq(stores.id, id))
      .returning();
    return updatedStore || undefined;
  }

  async getStoreStaff(storeId: string): Promise<(StoreStaff & { user: User })[]> {
    return await db
      .select({
        id: storeStaff.id,
        storeId: storeStaff.storeId,
        userId: storeStaff.userId,
        canVerify: storeStaff.canVerify,
        createdAt: storeStaff.createdAt,
        user: users,
      })
      .from(storeStaff)
      .innerJoin(users, eq(storeStaff.userId, users.id))
      .where(eq(storeStaff.storeId, storeId));
  }

  async addStoreStaff(staff: InsertStoreStaff): Promise<StoreStaff> {
    const [newStaff] = await db.insert(storeStaff).values(staff).returning();
    return newStaff;
  }

  async removeStoreStaff(storeId: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(storeStaff)
      .where(and(eq(storeStaff.storeId, storeId), eq(storeStaff.userId, userId)));
    return (result.rowCount || 0) > 0;
  }

  // Activities
  async getActivities(filters?: { 
    type?: string; 
    status?: string; 
    search?: string; 
    cityId?: number;
    cursor?: string;
    pageSize?: number;
  }): Promise<Activity[]> {
    const conditions = [];

    if (filters?.type && filters.type !== 'all') {
      conditions.push(eq(activities.type, filters.type));
    }

    if (filters?.status) {
      conditions.push(eq(activities.status, filters.status));
    }

    if (filters?.search) {
      conditions.push(like(activities.title, `%${filters.search}%`));
    }

    const pageSize = filters?.pageSize || 20;

    if (conditions.length > 0) {
      return await db.select().from(activities).where(and(...conditions)).orderBy(desc(activities.createdAt)).limit(pageSize);
    }

    return await db.select().from(activities).orderBy(desc(activities.createdAt)).limit(pageSize);
  }

  async getActivity(id: string): Promise<Activity | undefined> {
    const [activity] = await db.select().from(activities).where(eq(activities.id, id));
    return activity || undefined;
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db.insert(activities).values(activity).returning();
    return newActivity;
  }

  async updateActivity(id: string, activity: Partial<InsertActivity>): Promise<Activity | undefined> {
    const [updatedActivity] = await db
      .update(activities)
      .set({ ...activity, updatedAt: new Date() } as any)
      .where(eq(activities.id, id))
      .returning();
    return updatedActivity || undefined;
  }

  async deleteActivity(id: string): Promise<boolean> {
    const result = await db.delete(activities).where(eq(activities.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Store coverage for activities - New unified architecture using activity_store mapping
  async getActivityStores(activityId: string, lat?: number, lng?: number, limit: number = 3): Promise<(Store & { distanceKm?: number; mapsUrl?: string })[]> {
    // Get stores mapped to this activity from activity_store table
    const allStores = await db
      .select({
        id: stores.id,
        cityId: stores.cityId,
        name: stores.name,
        address: stores.address,
        lat: stores.lat,
        lng: stores.lng,
        placeId: stores.placeId,
        contact: stores.contact,
        phone: stores.phone,
        openHours: stores.openHours,
        enabled: stores.enabled,
        cityCode: stores.cityCode,
        weight: stores.weight,
        status: stores.status,
        createdAt: stores.createdAt,
      })
      .from(stores)
      .innerJoin(sql`activity_store`, sql`activity_store.store_id = ${stores.id}`)
      .where(and(
        sql`activity_store.activity_id = ${activityId}`,
        eq(stores.status, 'active'),
        eq(stores.enabled, true)
      ));

    // Calculate distances if coordinates provided
    if (lat && lng) {
      const storesWithDistance = allStores.map(store => {
        const distanceKm = this.calculateDistance(
          lat, lng, 
          parseFloat(store.lat || '0'), parseFloat(store.lng || '0')
        );
        
        const mapsUrl = store.placeId 
          ? `https://www.google.com/maps/dir/?api=1&destination_place_id=${store.placeId}`
          : `https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}`;

        return { ...store, distanceKm, mapsUrl };
      });

      // Sort by distance and limit results
      return storesWithDistance
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .slice(0, limit);
    }

    return allStores.slice(0, limit).map(store => ({
      ...store,
      mapsUrl: store.placeId 
        ? `https://www.google.com/maps/dir/?api=1&destination_place_id=${store.placeId}`
        : `https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}`
    }));
  }

  // Get stores by activity ID (for internal use)
  async getStoresByActivityId(activityId: string): Promise<Store[]> {
    return await db
      .select({
        id: stores.id,
        cityId: stores.cityId,
        name: stores.name,
        address: stores.address,
        lat: stores.lat,
        lng: stores.lng,
        placeId: stores.placeId,
        contact: stores.contact,
        phone: stores.phone,
        openHours: stores.openHours,
        enabled: stores.enabled,
        cityCode: stores.cityCode,
        weight: stores.weight,
        status: stores.status,
        createdAt: stores.createdAt,
      })
      .from(stores)
      .innerJoin(sql`activity_store`, sql`activity_store.store_id = ${stores.id}`)
      .where(and(
        sql`activity_store.activity_id = ${activityId}`,
        eq(stores.enabled, true)
      ));
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLng = this.deg2rad(lng2 - lng1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  // Coupons
  async getCoupons(filters?: { activityId?: string; userId?: string; status?: string }): Promise<(Coupon & { activity: Activity })[]> {
    let query = db
      .select({
        id: coupons.id,
        activityId: coupons.activityId,
        userId: coupons.userId,
        code: coupons.code,
        status: coupons.status,
        claimedAt: coupons.claimedAt,
        usedAt: coupons.usedAt,
        expiresAt: coupons.expiresAt,
        isRead: coupons.isRead,
        lastViewedAt: coupons.lastViewedAt,

        activity: activities,
      })
      .from(coupons)
      .innerJoin(activities, eq(coupons.activityId, activities.id));

    const conditions = [];

    if (filters?.activityId) {
      conditions.push(eq(coupons.activityId, filters.activityId));
    }

    if (filters?.userId) {
      conditions.push(eq(coupons.userId, filters.userId));
    }

    if (filters?.status) {
      conditions.push(eq(coupons.status, filters.status));
    }

    if (conditions.length > 0) {
      return await query.where(and(...conditions)).orderBy(desc(coupons.claimedAt));
    }

    return await query.orderBy(desc(coupons.claimedAt));
  }

  async getCoupon(id: string): Promise<Coupon | undefined> {
    const [coupon] = await db.select().from(coupons).where(eq(coupons.id, id));
    return coupon || undefined;
  }

  async getCouponByCode(code: string): Promise<Coupon | undefined> {
    const [coupon] = await db.select().from(coupons).where(eq(coupons.code, code));
    return coupon || undefined;
  }

  async createCoupon(coupon: InsertCoupon): Promise<Coupon> {
    // Generate unique coupon code
    const code = this.generateCouponCode();
    const [newCoupon] = await db.insert(coupons).values({ ...coupon, code }).returning();
    return newCoupon;
  }

  async updateCouponStatus(id: string, status: string): Promise<boolean> {
    const result = await db
      .update(coupons)
      .set({ status, ...(status === 'used' ? { usedAt: new Date() } : {}) })
      .where(eq(coupons.id, id));
    return (result.rowCount || 0) > 0;
  }

  async markUserCouponsAsRead(userId: string): Promise<number> {
    const result = await db
      .update(coupons)
      .set({ 
        isRead: true, 
        lastViewedAt: new Date() 
      })
      .where(eq(coupons.userId, userId));
    return result.rowCount || 0;
  }

  private generateCouponCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Redeems
  async getRedeems(filters?: { 
    storeId?: string; 
    staffId?: string; 
    activityId?: string;
    status?: string;
    from?: Date;
    to?: Date;
  }): Promise<(Redeem & { activity: Activity; store: Store; staff: User; coupon: Coupon })[]> {
    let query = db
      .select({
        id: redeems.id,
        activityId: redeems.activityId,
        storeId: redeems.storeId,
        staffId: redeems.staffId,
        couponId: redeems.couponId,
        code: redeems.code,
        status: redeems.status,
        redemptionType: redeems.redemptionType,
        verifiedAt: redeems.verifiedAt,
        cancelReason: redeems.cancelReason,
        activity: activities,
        store: stores,
        staff: users,
        coupon: coupons,
      })
      .from(redeems)
      .innerJoin(activities, eq(redeems.activityId, activities.id))
      .innerJoin(stores, eq(redeems.storeId, stores.id))
      .innerJoin(users, eq(redeems.staffId, users.id))
      .innerJoin(coupons, eq(redeems.couponId, coupons.id));

    const conditions = [];

    if (filters?.storeId) {
      conditions.push(eq(redeems.storeId, filters.storeId));
    }

    if (filters?.staffId) {
      conditions.push(eq(redeems.staffId, filters.staffId));
    }

    if (filters?.activityId) {
      conditions.push(eq(redeems.activityId, filters.activityId));
    }

    if (filters?.status) {
      conditions.push(eq(redeems.status, filters.status));
    }

    if (filters?.from) {
      conditions.push(sql`${redeems.verifiedAt} >= ${filters.from}`);
    }

    if (filters?.to) {
      conditions.push(sql`${redeems.verifiedAt} <= ${filters.to}`);
    }

    if (conditions.length > 0) {
      return await query.where(and(...conditions)).orderBy(desc(redeems.verifiedAt));
    }

    return await query.orderBy(desc(redeems.verifiedAt));
  }

  async getUserRedeems(userId: string): Promise<(Redeem & { activity: Activity; coupon: Coupon })[]> {
    return await db
      .select({
        id: redeems.id,
        activityId: redeems.activityId,
        storeId: redeems.storeId,
        staffId: redeems.staffId,
        couponId: redeems.couponId,
        code: redeems.code,
        status: redeems.status,
        redemptionType: redeems.redemptionType,
        verifiedAt: redeems.verifiedAt,
        cancelReason: redeems.cancelReason,
        activity: activities,
        coupon: coupons,
      })
      .from(redeems)
      .innerJoin(activities, eq(redeems.activityId, activities.id))
      .innerJoin(coupons, eq(redeems.couponId, coupons.id))
      .innerJoin(users, eq(coupons.userId, users.id))
      .where(eq(users.id, userId))
      .orderBy(desc(redeems.verifiedAt));
  }

  async createRedeem(redeem: InsertRedeem): Promise<Redeem> {
    const [newRedeem] = await db.insert(redeems).values(redeem).returning();
    return newRedeem;
  }

  async cancelRedeem(id: string, reason: string): Promise<boolean> {
    const result = await db
      .update(redeems)
      .set({ status: 'canceled', cancelReason: reason })
      .where(eq(redeems.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Get redemption statistics for admin dashboard - 数据归集功能
  async getRedemptionStats(filters?: {
    startDate?: string;
    endDate?: string;
    activityId?: string;
    storeId?: string;
    staffId?: string;
  }) {
    const conditions = [];
    
    if (filters?.startDate) {
      conditions.push(sql`${redeems.verifiedAt} >= ${filters.startDate}`);
    }
    
    if (filters?.endDate) {
      conditions.push(sql`${redeems.verifiedAt} <= ${filters.endDate}`);
    }
    
    if (filters?.activityId) {
      conditions.push(eq(redeems.activityId, filters.activityId));
    }
    
    if (filters?.storeId) {
      conditions.push(eq(redeems.storeId, filters.storeId));
    }
    
    if (filters?.staffId) {
      conditions.push(eq(redeems.staffId, filters.staffId));
    }

    // Get detailed redemption records
    const redemptionRecords = await db
      .select({
        id: redeems.id,
        activityId: redeems.activityId,
        storeId: redeems.storeId,
        staffId: redeems.staffId,
        code: redeems.code,
        status: redeems.status,
        verifiedAt: redeems.verifiedAt,
        activityTitle: activities.title,
        storeName: stores.name,
        staffName: users.username,
      })
      .from(redeems)
      .innerJoin(activities, eq(redeems.activityId, activities.id))
      .innerJoin(stores, eq(redeems.storeId, stores.id))
      .innerJoin(users, eq(redeems.staffId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(redeems.verifiedAt));

    // Get aggregated statistics
    const stats = await db
      .select({
        totalRedemptions: sql<number>`count(*)`,
        uniqueActivities: sql<number>`count(distinct ${redeems.activityId})`,
        uniqueStores: sql<number>`count(distinct ${redeems.storeId})`,
        uniqueStaff: sql<number>`count(distinct ${redeems.staffId})`,
      })
      .from(redeems)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    // Get redemptions by store (门店维度)
    const byStore = await db
      .select({
        storeId: redeems.storeId,
        storeName: stores.name,
        storeAddress: stores.address,
        count: sql<number>`count(*)`,
      })
      .from(redeems)
      .innerJoin(stores, eq(redeems.storeId, stores.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(redeems.storeId, stores.name, stores.address)
      .orderBy(sql`count(*) desc`);

    // Get redemptions by activity (活动维度)
    const byActivity = await db
      .select({
        activityId: redeems.activityId,
        activityTitle: activities.title,
        activityType: activities.type,
        count: sql<number>`count(*)`,
      })
      .from(redeems)
      .innerJoin(activities, eq(redeems.activityId, activities.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(redeems.activityId, activities.title, activities.type)
      .orderBy(sql`count(*) desc`);

    // Get redemptions by staff (员工维度)
    const byStaff = await db
      .select({
        staffId: redeems.staffId,
        staffName: users.username,
        storeId: redeems.storeId,
        storeName: stores.name,
        count: sql<number>`count(*)`,
      })
      .from(redeems)
      .innerJoin(users, eq(redeems.staffId, users.id))
      .innerJoin(stores, eq(redeems.storeId, stores.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(redeems.staffId, users.username, redeems.storeId, stores.name)
      .orderBy(sql`count(*) desc`);

    return {
      summary: stats[0],
      records: redemptionRecords,
      byStore,
      byActivity,
      byStaff,
    };
  }

  // Payment Orders
  async createPaymentOrder(order: InsertPaymentOrder): Promise<PaymentOrder> {
    const [newOrder] = await db.insert(paymentOrders).values(order).returning();
    return newOrder;
  }

  async updatePaymentOrderStatus(id: string, status: string): Promise<boolean> {
    const result = await db
      .update(paymentOrders)
      .set({ status })
      .where(eq(paymentOrders.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Staff Management (员工管理系统)
  async getStaff(filters?: { storeId?: string; search?: string }): Promise<any[]> {
    const conditions = [];
    
    if (filters?.storeId) {
      conditions.push(eq(storeStaff.storeId, filters.storeId));
    }
    
    if (filters?.search) {
      conditions.push(or(
        like(users.username, `%${filters.search}%`),
        like(users.lineUserId, `%${filters.search}%`)
      ));
    }

    // Get staff with redemption counts
    const staffWithStats = await db
      .select({
        id: users.id,
        name: users.username,
        lineId: users.lineUserId,
        storeId: storeStaff.storeId,
        storeName: stores.name,
        canVerify: storeStaff.canVerify,
        createdAt: storeStaff.createdAt,
        totalRedemptions: sql<number>`count(${redeems.id})`.as('totalRedemptions'),
        recentRedemptions: sql<number>`count(case when ${redeems.verifiedAt} > now() - interval '7 days' then 1 end)`.as('recentRedemptions'),
      })
      .from(users)
      .innerJoin(storeStaff, eq(users.id, storeStaff.userId))
      .innerJoin(stores, eq(storeStaff.storeId, stores.id))
      .leftJoin(redeems, and(
        eq(redeems.staffId, users.id),
        eq(redeems.status, 'verified')
      ))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(users.id, users.username, users.lineUserId, storeStaff.storeId, stores.name, storeStaff.canVerify, storeStaff.createdAt)
      .orderBy(asc(users.username));

    return staffWithStats;
  }

  async createStaff(staffData: any): Promise<any> {
    // Check if staff already exists in this store
    const existingStaff = await db
      .select()
      .from(storeStaff)
      .innerJoin(users, eq(users.id, storeStaff.userId))
      .where(and(
        eq(users.lineUserId, staffData.lineId),
        eq(storeStaff.storeId, staffData.storeId)
      ));

    if (existingStaff.length > 0) {
      throw new Error('该LINE用户已在此门店注册为员工');
    }

    // First create user if not exists
    let user = await this.getUserByLineId(staffData.lineId);
    if (!user) {
      user = await this.createUser({
        lineUserId: staffData.lineId,
        username: staffData.name,
        role: 'staff',
      });
    } else {
      // Update username if it differs
      if (user.username !== staffData.name) {
        await db
          .update(users)
          .set({ username: staffData.name })
          .where(eq(users.id, user.id));
      }
    }

    // Then create store staff relationship
    const [staff] = await db
      .insert(storeStaff)
      .values({
        storeId: staffData.storeId,
        userId: user.id,
        canVerify: staffData.canVerify || false,
      })
      .returning();

    return staff;
  }

  async updateStaffAuthorization(staffId: string, storeId: string, canVerify: boolean): Promise<boolean> {
    const result = await db
      .update(storeStaff)
      .set({ canVerify })
      .where(and(eq(storeStaff.userId, staffId), eq(storeStaff.storeId, storeId)));
    return (result.rowCount || 0) > 0;
  }

  // Remove staff from store (删除员工)
  async removeStaff(staffId: string, storeId: string): Promise<boolean> {
    const result = await db
      .delete(storeStaff)
      .where(and(eq(storeStaff.userId, staffId), eq(storeStaff.storeId, storeId)));
    return (result.rowCount || 0) > 0;
  }

  // Get staff details including performance metrics
  async getStaffDetails(staffId: string, storeId: string): Promise<any> {
    const [staffInfo] = await db
      .select({
        id: users.id,
        name: users.username,
        lineId: users.lineUserId,
        storeId: storeStaff.storeId,
        storeName: stores.name,
        canVerify: storeStaff.canVerify,
        createdAt: storeStaff.createdAt,
        role: users.role,
      })
      .from(users)
      .innerJoin(storeStaff, eq(users.id, storeStaff.userId))
      .innerJoin(stores, eq(storeStaff.storeId, stores.id))
      .where(and(eq(users.id, staffId), eq(storeStaff.storeId, storeId)));

    if (!staffInfo) {
      return null;
    }

    // Get performance stats
    const performanceStats = await db
      .select({
        totalRedemptions: sql<number>`count(*)`,
        thisMonthRedemptions: sql<number>`count(case when ${redeems.verifiedAt} >= date_trunc('month', current_date) then 1 end)`,
        lastWeekRedemptions: sql<number>`count(case when ${redeems.verifiedAt} >= current_date - interval '7 days' then 1 end)`,
        averageDailyRedemptions: sql<number>`round(count(*) / extract(day from current_date - ${storeStaff.createdAt}), 2)`,
      })
      .from(redeems)
      .where(and(
        eq(redeems.staffId, staffId),
        eq(redeems.storeId, storeId),
        eq(redeems.status, 'verified')
      ));

    return {
      ...staffInfo,
      performance: performanceStats[0] || {
        totalRedemptions: 0,
        thisMonthRedemptions: 0,
        lastWeekRedemptions: 0,
        averageDailyRedemptions: 0,
      }
    };
  }

  // Overview Statistics (概览统计)
  async getOverviewStats(filters?: { startDate?: string; endDate?: string }): Promise<any> {
    const conditions = [];
    
    if (filters?.startDate) {
      conditions.push(sql`${redeems.verifiedAt} >= ${filters.startDate}`);
    }
    
    if (filters?.endDate) {
      conditions.push(sql`${redeems.verifiedAt} <= ${filters.endDate}`);
    }

    // Basic counts
    const [totals] = await db
      .select({
        totalActivities: sql<number>`count(distinct ${activities.id})`,
        totalStores: sql<number>`count(distinct ${stores.id})`,
        totalRedemptions: sql<number>`count(distinct ${redeems.id})`,
        totalUsers: sql<number>`count(distinct ${users.id})`,
      })
      .from(activities)
      .leftJoin(stores, sql`true`)
      .leftJoin(redeems, conditions.length > 0 ? and(...conditions) : sql`true`)
      .leftJoin(users, eq(users.role, 'user'));

    // Recent redemptions trend
    const redemptionTrend = await db
      .select({
        date: sql<string>`date(${redeems.verifiedAt})`,
        count: sql<number>`count(*)`,
      })
      .from(redeems)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(sql`date(${redeems.verifiedAt})`)
      .orderBy(sql`date(${redeems.verifiedAt}) desc`)
      .limit(7);

    return {
      totals,
      redemptionTrend,
    };
  }

  // I18n
  async getTranslations(lang: string): Promise<I18nTranslation[]> {
    return await db
      .select()
      .from(i18nTranslations)
      .where(eq(i18nTranslations.lang, lang))
      .orderBy(asc(i18nTranslations.key));
  }

  async getTranslation(lang: string, key: string): Promise<I18nTranslation | undefined> {
    const [translation] = await db
      .select()
      .from(i18nTranslations)
      .where(and(eq(i18nTranslations.lang, lang), eq(i18nTranslations.key, key)));
    return translation || undefined;
  }

  async upsertTranslation(translation: InsertI18nTranslation): Promise<I18nTranslation> {
    const existing = await this.getTranslation(translation.lang, translation.key);
    
    if (existing) {
      const [updated] = await db
        .update(i18nTranslations)
        .set(translation)
        .where(eq(i18nTranslations.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(i18nTranslations).values(translation).returning();
      return created;
    }
  }

  async getMissingKeys(days: number = 7): Promise<{ key: string; count: number }[]> {
    // This would track missing translation keys in a real implementation
    // For now, return empty array
    return [];
  }

  // Check if staff is authorized for a specific store
  async isStaffAuthorizedForStore(staffId: string, storeId: string): Promise<boolean> {
    const [assignment] = await db
      .select()
      .from(storeStaff)
      .where(and(
        eq(storeStaff.userId, staffId),
        eq(storeStaff.storeId, storeId)
      ));
    
    return !!assignment;
  }

  // LINE Binding Token Management
  async createBindToken(tokenData: InsertBindToken): Promise<BindToken> {
    const [token] = await db.insert(bindTokens).values(tokenData).returning();
    return token;
  }

  async getBindToken(token?: string, code?: string): Promise<BindToken | undefined> {
    if (!token && !code) {
      return undefined;
    }

    const conditions = [];
    if (token) {
      conditions.push(eq(bindTokens.token, token));
    }
    if (code) {
      conditions.push(eq(bindTokens.code, code));
    }

    const [bindToken] = await db
      .select()
      .from(bindTokens)
      .where(conditions.length === 1 ? conditions[0] : or(...conditions));
    
    return bindToken || undefined;
  }

  async updateBindTokenUsage(tokenId: string, isUsed: boolean = true): Promise<boolean> {
    const updateData: any = { usedAt: isUsed ? new Date() : null };
    
    const result = await db
      .update(bindTokens)
      .set(updateData)
      .where(eq(bindTokens.id, tokenId));
    
    return (result.rowCount || 0) > 0;
  }

  async updateBindTokenAttempts(tokenId: string): Promise<boolean> {
    const result = await db
      .update(bindTokens)
      .set({ 
        attempts: sql`${bindTokens.attempts} + 1`
      })
      .where(eq(bindTokens.id, tokenId));
    
    return (result.rowCount || 0) > 0;
  }

  async markBindTokenUsed(tokenId: string): Promise<boolean> {
    const result = await db
      .update(bindTokens)
      .set({ usedAt: new Date() })
      .where(eq(bindTokens.id, tokenId));
    
    return (result.rowCount || 0) > 0;
  }

  // Activity Analytics - 活动数据统计（重新设计用于提成核算）
  async getActivityAnalytics(): Promise<{
    activityId: string;
    activityTitle: string;
    totalClaimed: number;
    totalRedeemed: number;
    storeStats: {
      storeId: string;
      storeName: string;
      redemptionCount: number;
      staffStats: {
        staffId: string;
        staffName: string;
        redemptionCount: number;
      }[];
    }[];
  }[]> {
    // 获取所有已发布的活动
    const activeActivities = await db
      .select({
        id: activities.id,
        title: activities.title,
        titleTh: activities.titleTh,
      })
      .from(activities)
      .where(eq(activities.status, 'published'))
      .orderBy(desc(activities.createdAt));

    const result = [];

    for (const activity of activeActivities) {
      // 统计该活动的领取数量（从coupons表）
      const [claimedStats] = await db
        .select({
          totalClaimed: sql<number>`count(*)`,
        })
        .from(coupons)
        .where(eq(coupons.activityId, activity.id));

      // 统计该活动的核销数量（从redeems表）
      const [redeemedStats] = await db
        .select({
          totalRedeemed: sql<number>`count(*)`,
        })
        .from(redeems)
        .where(and(
          eq(redeems.activityId, activity.id),
          eq(redeems.status, 'verified')
        ));

      // 获取该活动相关的所有门店（通过activity_store映射表）
      let participatingStores = await db
        .select({
          id: stores.id,
          name: stores.name,
        })
        .from(stores)
        .innerJoin(sql`activity_store`, sql`activity_store.store_id = ${stores.id}`)
        .where(sql`activity_store.activity_id = ${activity.id}`);


      // 为每个门店获取核销统计和导购统计
      const storeStatsPromises = participatingStores.map(async (store) => {
        // 门店总核销数
        const [storeRedemptions] = await db
          .select({
            redemptionCount: sql<number>`count(*)`,
          })
          .from(redeems)
          .where(and(
            eq(redeems.activityId, activity.id),
            eq(redeems.storeId, store.id),
            eq(redeems.status, 'verified')
          ));

        // 该门店各导购的核销统计
        const staffStats = await db
          .select({
            staffId: redeems.staffId,
            staffName: users.username,
            redemptionCount: sql<number>`count(*)`,
          })
          .from(redeems)
          .innerJoin(users, eq(redeems.staffId, users.id))
          .where(and(
            eq(redeems.activityId, activity.id),
            eq(redeems.storeId, store.id),
            eq(redeems.status, 'verified')
          ))
          .groupBy(redeems.staffId, users.username)
          .orderBy(sql`count(*) desc`);

        // 获取该门店的所有导购（即使没有核销记录）
        const allStaff = await db
          .select({
            staffId: storeStaff.userId,
            staffName: users.username,
          })
          .from(storeStaff)
          .innerJoin(users, eq(storeStaff.userId, users.id))
          .where(eq(storeStaff.storeId, store.id));

        // 合并导购数据，确保所有导购都显示（没有核销的显示0）
        const completeStaffStats = allStaff.map(staff => {
          const existingStat = staffStats.find(s => s.staffId === staff.staffId);
          return {
            staffId: staff.staffId!,
            staffName: staff.staffName!,
            redemptionCount: existingStat?.redemptionCount || 0,
          };
        });

        return {
          storeId: store.id,
          storeName: store.name,
          redemptionCount: storeRedemptions?.redemptionCount || 0,
          staffStats: completeStaffStats,
        };
      });

      const storeStats = await Promise.all(storeStatsPromises);

      result.push({
        activityId: activity.id,
        activityTitle: activity.title,
        totalClaimed: claimedStats?.totalClaimed || 0,
        totalRedeemed: redeemedStats?.totalRedeemed || 0,
        storeStats: storeStats,
      });
    }

    return result;
  }

  // Export activity commission data - 导出活动提成数据
  async exportActivityCommissionData(activityId: string): Promise<{
    activityTitle: string;
    activityTitleTh?: string;
    exportData: {
      cityName: string;
      storeName: string;
      totalRedemptions: number;
      staffDetails: {
        staffName: string;
        lineId: string;
        redemptionCount: number;
      }[];
    }[];
  }> {
    // 获取活动信息
    const activity = await this.getActivity(activityId);
    if (!activity) {
      throw new Error('Activity not found');
    }

    // 获取参与门店信息 (使用新的activity_store映射表)
    const participatingStores = await db
      .select({
        storeId: stores.id,
        storeName: stores.name,
        cityId: stores.cityId,
      })
      .from(stores)
      .innerJoin(sql`activity_store`, sql`activity_store.store_id = ${stores.id}`)
      .where(and(
        sql`activity_store.activity_id = ${activityId}`,
        eq(stores.status, 'active')
      ))
      .orderBy(stores.name);

    // 获取城市信息
    const cityData = await db.select().from(cities);
    const cityMap = cityData.reduce((acc, city) => {
      acc[city.id] = city.name;
      return acc;
    }, {} as Record<number, string>);

    // 构建导出数据
    const exportData = [];

    for (const store of participatingStores) {
      // 获取该门店的导购员
      const storeStaffList = await db
        .select({
          staffId: storeStaff.userId,
          staffName: users.username,
          lineId: users.lineUserId,
        })
        .from(storeStaff)
        .innerJoin(users, eq(users.id, storeStaff.userId))
        .where(eq(storeStaff.storeId, store.storeId));

      // 获取该门店的核销统计
      const storeRedemptions = await db
        .select({
          staffId: redeems.staffId,
          redemptionCount: sql<number>`count(*)`.as('redemptionCount'),
        })
        .from(redeems)
        .where(and(
          eq(redeems.activityId, activityId),
          eq(redeems.storeId, store.storeId),
          eq(redeems.status, 'verified')
        ))
        .groupBy(redeems.staffId);

      const redemptionMap = storeRedemptions.reduce((acc, redemption) => {
        if (redemption.staffId) {
          acc[redemption.staffId] = redemption.redemptionCount;
        }
        return acc;
      }, {} as Record<string, number>);

      // 计算门店总核销数
      const totalRedemptions = storeRedemptions.reduce((sum, r) => sum + r.redemptionCount, 0);

      // 构建导购详情（包括0核销的导购）
      const staffDetails = storeStaffList.map(staff => ({
        staffName: staff.staffName || '未知',
        lineId: staff.lineId || '无LINE ID',
        redemptionCount: staff.staffId ? (redemptionMap[staff.staffId] || 0) : 0,
      }));

      exportData.push({
        cityName: store.cityId ? (cityMap[store.cityId] || '未知城市') : '未知城市',
        storeName: store.storeName,
        totalRedemptions,
        staffDetails,
      });
    }

    return {
      activityTitle: activity.title,
      activityTitleTh: activity.titleTh || undefined,
      exportData,
    };
  }

  async updateUserLineBinding(userId: string, lineUserId?: string, liffSub?: string, role?: string): Promise<boolean> {
    const updateData: Partial<User> = {};
    
    if (lineUserId) updateData.lineUserId = lineUserId;
    if (liffSub) updateData.liffSub = liffSub;
    if (role) updateData.role = role;
    updateData.bindAt = new Date();

    const result = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId));
    return (result.rowCount || 0) > 0;
  }

  // Module-specific configurations implementation - 专门模块配置实现
  async createGroupActivity(groupActivityData: InsertGroupActivity): Promise<GroupActivity> {
    const [newGroupActivity] = await db.insert(groupActivity).values(groupActivityData).returning();
    return newGroupActivity;
  }

  async getGroupActivity(activityId: string): Promise<GroupActivity | undefined> {
    const [result] = await db.select().from(groupActivity).where(eq(groupActivity.activityId, activityId));
    return result || undefined;
  }

  async createPresaleActivity(presaleActivityData: InsertPresaleActivity): Promise<PresaleActivity> {
    const [newPresaleActivity] = await db.insert(presaleActivity).values(presaleActivityData).returning();
    return newPresaleActivity;
  }

  async createFranchiseForm(franchiseFormData: InsertFranchiseForm): Promise<FranchiseForm> {
    const [newFranchiseForm] = await db.insert(franchiseForm).values(franchiseFormData).returning();
    return newFranchiseForm;
  }

  // Group buying module implementation - 团购模块实现
  async createGroupInstance(groupInstanceData: InsertGroupInstance): Promise<GroupInstance> {
    const [newGroupInstance] = await db.insert(groupInstance).values(groupInstanceData).returning();
    return newGroupInstance;
  }

  async joinGroup(groupMemberData: InsertGroupMember): Promise<GroupMember> {
    const [newGroupMember] = await db.insert(groupMember).values(groupMemberData).returning();
    return newGroupMember;
  }

  async getGroupStatus(instanceId: string): Promise<GroupInstance | undefined> {
    const [instance] = await db.select().from(groupInstance).where(eq(groupInstance.id, instanceId));
    return instance || undefined;
  }

  async getGroupInstancesByActivity(activityId: string): Promise<any[]> {
    // 获取团购实例并计算成员数量
    const instances = await db
      .select({
        id: groupInstance.id,
        activityId: groupInstance.activityId,
        leaderUser: groupInstance.leaderUser,
        startAt: groupInstance.startAt,
        expireAt: groupInstance.expireAt,
        status: groupInstance.status,
        memberCount: sql<number>`COALESCE(COUNT(${groupMember.id}), 0)`,
      })
      .from(groupInstance)
      .leftJoin(groupMember, eq(groupInstance.id, groupMember.instanceId))
      .where(eq(groupInstance.activityId, activityId))
      .groupBy(
        groupInstance.id, 
        groupInstance.activityId,
        groupInstance.leaderUser,
        groupInstance.startAt,
        groupInstance.expireAt,
        groupInstance.status
      );

    // 计算时间相关状态
    const now = new Date();
    return instances.map(instance => {
      const timeLeft = Math.max(0, new Date(instance.expireAt).getTime() - now.getTime()) / 1000;
      
      return {
        ...instance,
        timeLeft,
        // 根据实际情况判断状态
        actualStatus: instance.status === 'success' ? 'success' :
                     timeLeft <= 0 ? 'failed' :
                     'pending'
      };
    });
  }

  // Presale module implementation - 预售模块实现
  async createPresaleReservation(reservationData: InsertPresaleReservation): Promise<PresaleReservation> {
    const [newReservation] = await db.insert(presaleReservation).values(reservationData).returning();
    return newReservation;
  }

  // Franchise module implementation - 招商模块实现
  async createFranchiseLead(leadData: InsertFranchiseLead): Promise<FranchiseLead> {
    const [newLead] = await db.insert(franchiseLead).values(leadData).returning();
    return newLead;
  }
}

export const storage = new DatabaseStorage();
