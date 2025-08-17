import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table (for LINE integration)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lineUserId: varchar("line_user_id").unique(),
  liffSub: varchar("liff_sub"),
  username: text("username"),
  role: varchar("role").default("user"), // user, staff, admin, verifier
  bindAt: timestamp("bind_at"), // LINE binding timestamp
  createdAt: timestamp("created_at").defaultNow(),
});

// Cities table
export const cities = pgTable("cities", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  nameEn: text("name_en"),
  nameTh: text("name_th"),
});

// Stores table
export const stores = pgTable("stores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cityId: integer("city_id").references(() => cities.id),
  name: text("name").notNull(),
  address: text("address").notNull(),
  lat: decimal("lat", { precision: 10, scale: 7 }).notNull(),
  lng: decimal("lng", { precision: 10, scale: 7 }).notNull(),
  placeId: text("place_id"),
  contact: text("contact"),
  phone: text("phone"),
  openHours: jsonb("open_hours"), // {"mon":["09:00-18:00"], ...}
  enabled: boolean("enabled").default(true),
  cityCode: varchar("city_code", { length: 16 }),
  weight: integer("weight").default(0), // 定位失败时的默认排序权重
  status: varchar("status").default("active"), // active, inactive
  createdAt: timestamp("created_at").defaultNow(),
});

// Store staff relations
export const storeStaff = pgTable("store_staff", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storeId: varchar("store_id").references(() => stores.id),
  userId: varchar("user_id").references(() => users.id),
  canVerify: boolean("can_verify").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Activities table (统一底座)
export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  titleTh: text("title_th"), // Thai title
  type: varchar("type").notNull().default("coupon"), // coupon, group, presale, franchise
  coverUrl: text("cover_url").notNull(), // 主图（向后兼容）
  coverUrls: jsonb("cover_urls"), // 多图轮播数组: ["url1", "url2", "url3", "url4", "url5"]
  stockTotal: integer("stock_total").notNull().default(0), // 总库存
  quantity: integer("quantity").notNull().default(0), // 数量(兼容字段)
  perUserLimit: integer("per_user_limit").notNull().default(1), // 每人限购
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  listPrice: decimal("list_price", { precision: 10, scale: 2 }),
  discount: decimal("discount", { precision: 5, scale: 2 }), // Backend calculated discount (e.g., 7.5 for 7.5折)
  startAt: timestamp("start_at").notNull(),
  endAt: timestamp("end_at").notNull(),
  rules: text("rules"),
  rulesTh: text("rules_th"), // Thai rules
  status: varchar("status").default("draft"), // draft, published, ended, disabled
  
  // 活动扩展字段（根据类型使用）
  extraConfig: jsonb("extra_config"), // 存储各类型特有配置
  
  // 活动门店配置
  appliesAllStores: boolean("applies_all_stores").default(true), // 是否适用所有门店
  cityIds: jsonb("city_ids"), // 活动城市ID数组 [1, 2, 3]
  includeStoreIds: jsonb("include_store_ids"), // 指定活动门店ID数组
  excludeStoreIds: jsonb("exclude_store_ids"), // 排除门店ID数组
  couponValidUntil: timestamp("coupon_valid_until"), // 优惠券有效期
  
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Activity i18n table (多语言支持)
export const activityI18n = pgTable("activity_i18n", {
  activityId: varchar("activity_id").references(() => activities.id, { onDelete: "cascade" }),
  lang: varchar("lang", { length: 8 }).notNull(),
  title: text("title"),
  subtitle: text("subtitle"),
  ruleBrief: text("rule_brief"),
  ruleFull: text("rule_full"),
}, (table) => ({
  pk: sql`PRIMARY KEY (${table.activityId}, ${table.lang})`,
}));

// Activity-Store mapping (活动门店)
export const activityStore = pgTable("activity_store", {
  activityId: varchar("activity_id").references(() => activities.id, { onDelete: "cascade" }),
  storeId: varchar("store_id").references(() => stores.id, { onDelete: "cascade" }),
}, (table) => ({
  pk: sql`PRIMARY KEY (${table.activityId}, ${table.storeId})`,
}));





// Coupons table
export const coupons = pgTable("coupons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  activityId: varchar("activity_id").references(() => activities.id),
  userId: varchar("user_id").references(() => users.id),
  code: varchar("code").unique().notNull(),
  status: varchar("status").default("active"), // active, used, expired
  claimedAt: timestamp("claimed_at").defaultNow(),
  usedAt: timestamp("used_at"),
  expiresAt: timestamp("expires_at"),
  isRead: boolean("is_read").default(false), // 用户是否已查看此卡券
  lastViewedAt: timestamp("last_viewed_at"), // 最后查看时间
});

// Redeems table
export const redeems = pgTable("redeems", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  activityId: varchar("activity_id").references(() => activities.id),
  storeId: varchar("store_id").references(() => stores.id),
  staffId: varchar("staff_id").references(() => users.id),
  couponId: varchar("coupon_id").references(() => coupons.id),
  code: varchar("code").notNull(),
  status: varchar("status").default("verified"), // verified, canceled
  redemptionType: varchar("redemption_type").default("manual"), // qr_scan, manual - 核销方式：扫码(常态)或手动(兜底)
  verifiedAt: timestamp("verified_at").defaultNow(),
  cancelReason: text("cancel_reason"),
});

// Payment orders table (for future payment integration)
export const paymentOrders = pgTable("payment_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  activityId: varchar("activity_id").references(() => activities.id),
  userId: varchar("user_id").references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  provider: varchar("provider"), // mock, omise, linepay, stripe, square, wechatpay, alipay
  providerOrderId: varchar("provider_order_id"), // Third-party payment order ID
  webhookData: jsonb("webhook_data"), // Store webhook response data for audit trail
  status: varchar("status").default("pending"), // pending, paid, failed, canceled
  paymentUrl: text("payment_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === 团购业务模块 ===
// 团购活动配置
export const groupActivity = pgTable("group_activity", {
  activityId: varchar("activity_id").primaryKey().references(() => activities.id, { onDelete: "cascade" }),
  nRequired: integer("n_required").notNull(), // 成团人数
  timeLimitHours: integer("time_limit_hours").notNull(), // 成团时限
  useValidHours: integer("use_valid_hours").notNull(), // 成功发券后 X 小时内到店
  allowCrossStore: boolean("allow_cross_store").default(true), // 是否允许跨门店使用
});

// 团购实例
export const groupInstance = pgTable("group_instance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  activityId: varchar("activity_id").references(() => activities.id, { onDelete: "cascade" }),
  leaderUser: varchar("leader_user").notNull(), // 团长用户ID
  startAt: timestamp("start_at").defaultNow(),
  expireAt: timestamp("expire_at").notNull(),
  status: varchar("status").notNull().default("pending"), // pending, success, failed
});

// 团购成员
export const groupMember = pgTable("group_member", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  instanceId: varchar("instance_id").references(() => groupInstance.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
  status: varchar("status").notNull().default("reserved"), // reserved, coupon_issued, redeemed
});

// === 预售业务模块 ===
// 预售活动配置
export const presaleActivity = pgTable("presale_activity", {
  activityId: varchar("activity_id").primaryKey().references(() => activities.id, { onDelete: "cascade" }),
  pickupStart: timestamp("pickup_start").notNull(), // 提货开始时间
  pickupEnd: timestamp("pickup_end").notNull(), // 提货结束时间
  arrivalNotice: boolean("arrival_notice").default(true), // 到货提醒
});

// 预售预约记录
export const presaleReservation = pgTable("presale_reservation", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  activityId: varchar("activity_id").references(() => activities.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull(),
  qty: integer("qty").notNull().default(1),
  status: varchar("status").notNull().default("reserved"), // reserved, notified, redeemed, cancelled, expired
  createdAt: timestamp("created_at").defaultNow(),
  expireAt: timestamp("expire_at"),
});

// === 招商业务模块 ===
// 招商表单定义
export const franchiseForm = pgTable("franchise_form", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  fields: jsonb("fields").notNull(), // 字段定义：label(多语)/type/required/options
  enabled: boolean("enabled").default(true),
});

// 招商线索
export const franchiseLead = pgTable("franchise_lead", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  formId: varchar("form_id").references(() => franchiseForm.id),
  name: text("name"),
  mobile: text("mobile"),
  city: text("city"),
  budget: text("budget"),
  intent: text("intent"),
  source: text("source"),
  owner: varchar("owner").references(() => users.id),
  stage: varchar("stage").default("new"), // new, contacted, intent, visit, negotiation, signed, dropped
  createdAt: timestamp("created_at").defaultNow(),
});

// 招商跟进记录
export const franchiseFollowup = pgTable("franchise_followup", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").references(() => franchiseLead.id, { onDelete: "cascade" }),
  at: timestamp("at").notNull(),
  method: varchar("method"), // call, visit, online
  content: text("content"),
  nextAt: timestamp("next_at"),
  owner: varchar("owner").references(() => users.id),
});

// === 事件与审计 ===
// 事件埋点表
export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  event: varchar("event", { length: 64 }).notNull(), // 页面曝光/按钮点击/开团成功/核销成功...
  userId: varchar("user_id"),
  storeId: varchar("store_id"),
  activityId: varchar("activity_id"),
  lang: varchar("lang", { length: 8 }),
  channel: varchar("channel", { length: 32 }),
  ts: timestamp("ts").defaultNow(),
  extra: jsonb("extra"),
});

// 审计日志
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  actor: varchar("actor").references(() => users.id),
  action: varchar("action", { length: 64 }),
  target: varchar("target", { length: 64 }),
  targetId: varchar("target_id"),
  ts: timestamp("ts").defaultNow(),
  ip: text("ip"),
  ua: text("ua"),
  detail: jsonb("detail"),
});

// Store merchants table (for future merchant portal expansion)
export const storeMerchants = pgTable("store_merchants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storeId: varchar("store_id").references(() => stores.id),
  merchantUserId: varchar("merchant_user_id").references(() => users.id),
  role: varchar("role").default("manager"), // manager, owner
  inviteCode: varchar("invite_code").unique(),
  inviteCodeUsed: boolean("invite_code_used").default(false),
  permissions: jsonb("permissions").$type<string[]>(), // Future permission system
  createdAt: timestamp("created_at").defaultNow(),
});

// === Relations ===
export const activityI18nRelations = relations(activityI18n, ({ one }) => ({
  activity: one(activities, { fields: [activityI18n.activityId], references: [activities.id] }),
}));

export const activityStoreRelations = relations(activityStore, ({ one }) => ({
  activity: one(activities, { fields: [activityStore.activityId], references: [activities.id] }),
  store: one(stores, { fields: [activityStore.storeId], references: [stores.id] }),
}));

export const groupActivityRelations = relations(groupActivity, ({ one, many }) => ({
  activity: one(activities, { fields: [groupActivity.activityId], references: [activities.id] }),
  instances: many(groupInstance),
}));

export const groupInstanceRelations = relations(groupInstance, ({ one, many }) => ({
  activity: one(activities, { fields: [groupInstance.activityId], references: [activities.id] }),
  members: many(groupMember),
}));

export const groupMemberRelations = relations(groupMember, ({ one }) => ({
  instance: one(groupInstance, { fields: [groupMember.instanceId], references: [groupInstance.id] }),
}));

export const presaleActivityRelations = relations(presaleActivity, ({ one, many }) => ({
  activity: one(activities, { fields: [presaleActivity.activityId], references: [activities.id] }),
  reservations: many(presaleReservation),
}));

export const presaleReservationRelations = relations(presaleReservation, ({ one }) => ({
  activity: one(activities, { fields: [presaleReservation.activityId], references: [activities.id] }),
}));

// LINE binding tokens table
export const bindTokens = pgTable("bind_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").references(() => users.id), // Nullable - created after binding
  storeId: varchar("store_id").references(() => stores.id).notNull(), // Store for this binding
  token: varchar("token", { length: 64 }).unique().notNull(),
  code: varchar("code", { length: 10 }).unique(), // 6-digit binding code (optional for QR-only binding)
  expireAt: timestamp("expire_at").notNull(),
  usedAt: timestamp("used_at"),
  attempts: integer("attempts").default(0),
  noteName: varchar("note_name", { length: 64 }), // Employee name (optional)
  mobile: varchar("mobile", { length: 32 }), // Contact phone (optional)
  createdAt: timestamp("created_at").defaultNow(),
});

// I18n translations table
export const i18nTranslations = pgTable("i18n_translations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lang: varchar("lang").notNull(), // zh, th
  key: text("key").notNull(),
  value: text("value").notNull(),
  role: varchar("role").notNull(), // ui, content
  isOverride: boolean("is_override").default(false),
  needsReview: boolean("needs_review").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  storeStaff: many(storeStaff),
  coupons: many(coupons),
  redeems: many(redeems),
}));

export const citiesRelations = relations(cities, ({ many }) => ({
  stores: many(stores),
}));

export const storesRelations = relations(stores, ({ one, many }) => ({
  city: one(cities, { fields: [stores.cityId], references: [cities.id] }),
  staff: many(storeStaff),
  redeems: many(redeems),
  activities: many(activityStore),
}));

export const storeStaffRelations = relations(storeStaff, ({ one }) => ({
  store: one(stores, { fields: [storeStaff.storeId], references: [stores.id] }),
  user: one(users, { fields: [storeStaff.userId], references: [users.id] }),
}));

// 统一的 activities relations (包含新业务模块)
export const activitiesRelations = relations(activities, ({ many, one }) => ({
  // 原有关系
  coupons: many(coupons),
  redeems: many(redeems),
  paymentOrders: many(paymentOrders),
  // 新增业务模块关系
  i18n: many(activityI18n),
  stores: many(activityStore),
  groupActivity: one(groupActivity),
  presaleActivity: one(presaleActivity),
  createdBy: one(users, { fields: [activities.createdBy], references: [users.id] }),
}));

export const couponsRelations = relations(coupons, ({ one, many }) => ({
  activity: one(activities, { fields: [coupons.activityId], references: [activities.id] }),
  user: one(users, { fields: [coupons.userId], references: [users.id] }),
  redeems: many(redeems),
}));

export const redeemsRelations = relations(redeems, ({ one }) => ({
  activity: one(activities, { fields: [redeems.activityId], references: [activities.id] }),
  store: one(stores, { fields: [redeems.storeId], references: [stores.id] }),
  staff: one(users, { fields: [redeems.staffId], references: [users.id] }),
  coupon: one(coupons, { fields: [redeems.couponId], references: [coupons.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertCitySchema = createInsertSchema(cities);
export const insertStoreSchema = createInsertSchema(stores).omit({ id: true, createdAt: true });
export const insertStoreStaffSchema = createInsertSchema(storeStaff).omit({ id: true, createdAt: true });
export const insertActivitySchema = createInsertSchema(activities).omit({ id: true, createdAt: true, updatedAt: true }).extend({
  price: z.string(),
  listPrice: z.string().optional(),
  startAt: z.date(),
  endAt: z.date(),
});
export const insertCouponSchema = createInsertSchema(coupons).omit({ id: true, claimedAt: true });
export const insertRedeemSchema = createInsertSchema(redeems).omit({ id: true, verifiedAt: true });
export const insertPaymentOrderSchema = createInsertSchema(paymentOrders).omit({ id: true, createdAt: true });
export const insertI18nTranslationSchema = createInsertSchema(i18nTranslations).omit({ id: true, createdAt: true });
export const insertBindTokenSchema = createInsertSchema(bindTokens).omit({ id: true, createdAt: true });

// 新增业务模块 Insert schemas
export const insertActivityI18nSchema = createInsertSchema(activityI18n);
export const insertActivityStoreSchema = createInsertSchema(activityStore);
export const insertGroupActivitySchema = createInsertSchema(groupActivity);
export const insertGroupInstanceSchema = createInsertSchema(groupInstance).omit({ id: true, startAt: true });
export const insertGroupMemberSchema = createInsertSchema(groupMember).omit({ id: true, joinedAt: true });
export const insertPresaleActivitySchema = createInsertSchema(presaleActivity);
export const insertPresaleReservationSchema = createInsertSchema(presaleReservation).omit({ id: true, createdAt: true });
export const insertFranchiseFormSchema = createInsertSchema(franchiseForm).omit({ id: true });
export const insertFranchiseLeadSchema = createInsertSchema(franchiseLead).omit({ id: true, createdAt: true });
export const insertFranchiseFollowupSchema = createInsertSchema(franchiseFollowup).omit({ id: true });
export const insertEventSchema = createInsertSchema(events).omit({ id: true, ts: true });
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, ts: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type City = typeof cities.$inferSelect;
export type InsertCity = z.infer<typeof insertCitySchema>;
export type Store = typeof stores.$inferSelect;
export type InsertStore = z.infer<typeof insertStoreSchema>;
export type StoreStaff = typeof storeStaff.$inferSelect;
export type InsertStoreStaff = z.infer<typeof insertStoreStaffSchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = z.infer<typeof insertCouponSchema>;
export type Redeem = typeof redeems.$inferSelect;
export type InsertRedeem = z.infer<typeof insertRedeemSchema>;
export type PaymentOrder = typeof paymentOrders.$inferSelect;
export type InsertPaymentOrder = z.infer<typeof insertPaymentOrderSchema>;
export type I18nTranslation = typeof i18nTranslations.$inferSelect;
export type InsertI18nTranslation = z.infer<typeof insertI18nTranslationSchema>;
export type BindToken = typeof bindTokens.$inferSelect;
export type InsertBindToken = z.infer<typeof insertBindTokenSchema>;

// 新增业务模块类型
export type ActivityI18n = typeof activityI18n.$inferSelect;
export type InsertActivityI18n = z.infer<typeof insertActivityI18nSchema>;
export type ActivityStore = typeof activityStore.$inferSelect;
export type InsertActivityStore = z.infer<typeof insertActivityStoreSchema>;
export type GroupActivity = typeof groupActivity.$inferSelect;
export type InsertGroupActivity = z.infer<typeof insertGroupActivitySchema>;
export type GroupInstance = typeof groupInstance.$inferSelect;
export type InsertGroupInstance = z.infer<typeof insertGroupInstanceSchema>;
export type GroupMember = typeof groupMember.$inferSelect;
export type InsertGroupMember = z.infer<typeof insertGroupMemberSchema>;
export type PresaleActivity = typeof presaleActivity.$inferSelect;
export type InsertPresaleActivity = z.infer<typeof insertPresaleActivitySchema>;
export type PresaleReservation = typeof presaleReservation.$inferSelect;
export type InsertPresaleReservation = z.infer<typeof insertPresaleReservationSchema>;
export type FranchiseForm = typeof franchiseForm.$inferSelect;
export type InsertFranchiseForm = z.infer<typeof insertFranchiseFormSchema>;
export type FranchiseLead = typeof franchiseLead.$inferSelect;
export type InsertFranchiseLead = z.infer<typeof insertFranchiseLeadSchema>;
export type FranchiseFollowup = typeof franchiseFollowup.$inferSelect;
export type InsertFranchiseFollowup = z.infer<typeof insertFranchiseFollowupSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
