import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("admin"), // "admin", "parent", "guardian", "child"
  familyId: varchar("family_id"),
  points: integer("points").default(0),
  streak: integer("streak").default(0),
  age: integer("age"),
  grade: varchar("grade"),
  bio: text("bio"),
  preferences: jsonb("preferences"),
  hasLoggedIn: boolean("has_logged_in").default(false),
  inviteToken: varchar("invite_token"),
  lastActiveDate: date("last_active_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const families = pgTable("families", {
  id: varchar("id").primaryKey().notNull(),
  name: varchar("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  description: text("description"),
  type: varchar("type").notNull(), // "chore", "homework", "event"
  category: varchar("category"), // "cleaning", "math", "science", etc.
  assignedTo: varchar("assigned_to").notNull(),
  assignedBy: varchar("assigned_by"),
  familyId: varchar("family_id").notNull(),
  points: integer("points").default(0),
  dueDate: timestamp("due_date"),
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
  priority: varchar("priority").default("medium"), // "low", "medium", "high"
  recurring: boolean("recurring").default(false),
  recurringPattern: varchar("recurring_pattern"), // "daily", "weekly", "monthly"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  description: text("description"),
  familyId: varchar("family_id").notNull(),
  createdBy: varchar("created_by").notNull(),
  eventDate: timestamp("event_date").notNull(),
  category: varchar("category").default("family"), // "family", "birthday", "movie", "activity"
  color: varchar("color").default("#6366F1"),
  allDay: boolean("all_day").default(false),
  recurring: boolean("recurring").default(false),
  recurringPattern: varchar("recurring_pattern"),
  notificationSent: boolean("notification_sent").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const houseRules = pgTable("house_rules", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  category: varchar("category").notNull(), // "screen_time", "kitchen", "bedtime", etc.
  familyId: varchar("family_id").notNull(),
  createdBy: varchar("created_by").notNull(),
  priority: varchar("priority").default("medium"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  authorId: varchar("author_id").notNull(),
  familyId: varchar("family_id").notNull(),
  contextType: varchar("context_type").notNull(), // "task", "event", "general"
  contextId: varchar("context_id"), // ID of the task/event if applicable
  parentId: integer("parent_id"), // For threaded comments
  createdAt: timestamp("created_at").defaultNow(),
});

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  type: varchar("type").notNull(), // "streak", "tasks_completed", "homework_hero", etc.
  title: varchar("title").notNull(),
  description: text("description"),
  icon: varchar("icon").default("fas fa-trophy"),
  earnedAt: timestamp("earned_at").defaultNow(),
});

export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  filename: varchar("filename").notNull(),
  originalName: varchar("original_name").notNull(),
  mimetype: varchar("mimetype").notNull(),
  size: integer("size").notNull(),
  uploadedBy: varchar("uploaded_by").notNull(),
  familyId: varchar("family_id").notNull(),
  contextType: varchar("context_type"), // "homework", "general"
  contextId: varchar("context_id"), // Task ID if related to homework
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertFamilySchema = createInsertSchema(families).omit({
  createdAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  notificationSent: true,
});

export const insertHouseRuleSchema = createInsertSchema(houseRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  earnedAt: true,
});

export const insertFileSchema = createInsertSchema(files).omit({
  id: true,
  uploadedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertFamily = z.infer<typeof insertFamilySchema>;
export type Family = typeof families.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;
export type InsertHouseRule = z.infer<typeof insertHouseRuleSchema>;
export type HouseRule = typeof houseRules.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;
export type File = typeof files.$inferSelect;
