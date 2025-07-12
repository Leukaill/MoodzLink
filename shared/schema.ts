import { pgTable, text, serial, integer, boolean, timestamp, jsonb, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for authentication and profiles
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email"),
  nickname: text("nickname"),
  isAnonymous: boolean("is_anonymous").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  streakCount: integer("streak_count").default(0),
  lastPostDate: timestamp("last_post_date"),
  totalPosts: integer("total_posts").default(0),
  totalReactionsReceived: integer("total_reactions_received").default(0),
});

// Mood posts table
export const moodPosts = pgTable("mood_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  moodEmoji: text("mood_emoji").notNull(),
  text: text("text"),
  mediaUrl: text("media_url"),
  mediaType: text("media_type"), // 'image', 'audio', 'video'
  isAnonymous: boolean("is_anonymous").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  reactionCounts: jsonb("reaction_counts").default({}), // {fire: 0, cry: 0, skull: 0, heart: 0}
});

// Reactions table
export const reactions = pgTable("reactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  postId: uuid("post_id").references(() => moodPosts.id).notNull(),
  emoji: text("emoji").notNull(), // '🔥', '😭', '💀', '🫶'
  createdAt: timestamp("created_at").defaultNow(),
});

// Daily mood photos (BeReal-style)
export const dailyPhotos = pgTable("daily_photos", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  photoUrl: text("photo_url").notNull(),
  moodEmoji: text("mood_emoji").notNull(),
  text: text("text"),
  createdAt: timestamp("created_at").defaultNow(),
  datePosted: text("date_posted").notNull(), // YYYY-MM-DD format
});

// Achievements/Badges
export const achievements = pgTable("achievements", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  badgeType: text("badge_type").notNull(), // 'streak_7', 'popular_post', 'mood_explorer', etc.
  earnedAt: timestamp("earned_at").defaultNow(),
});

// Mood matches for the "find someone who feels like me" feature
export const moodMatches = pgTable("mood_matches", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId1: uuid("user_id_1").references(() => users.id).notNull(),
  userId2: uuid("user_id_2").references(() => users.id).notNull(),
  moodEmoji: text("mood_emoji").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

// Chat messages for mood matches
export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  matchId: uuid("match_id").references(() => moodMatches.id).notNull(),
  senderId: uuid("sender_id").references(() => users.id).notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  streakCount: true,
  totalPosts: true,
  totalReactionsReceived: true,
});

export const insertMoodPostSchema = createInsertSchema(moodPosts).omit({
  id: true,
  createdAt: true,
  reactionCounts: true,
});

export const insertReactionSchema = createInsertSchema(reactions).omit({
  id: true,
  createdAt: true,
});

export const insertDailyPhotoSchema = createInsertSchema(dailyPhotos).omit({
  id: true,
  createdAt: true,
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  earnedAt: true,
});

export const insertMoodMatchSchema = createInsertSchema(moodMatches).omit({
  id: true,
  createdAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type MoodPost = typeof moodPosts.$inferSelect;
export type InsertMoodPost = z.infer<typeof insertMoodPostSchema>;
export type Reaction = typeof reactions.$inferSelect;
export type InsertReaction = z.infer<typeof insertReactionSchema>;
export type DailyPhoto = typeof dailyPhotos.$inferSelect;
export type InsertDailyPhoto = z.infer<typeof insertDailyPhotoSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type MoodMatch = typeof moodMatches.$inferSelect;
export type InsertMoodMatch = z.infer<typeof insertMoodMatchSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

// Mood emojis enum
export const MOOD_EMOJIS = [
  "😶‍🌫️", "💀", "🥲", "😭", "😤", "🫠", "🤯", "😴", "🤗", "😊", "🔥", "💫", "🌈", "✨"
] as const;

export type MoodEmoji = typeof MOOD_EMOJIS[number];

// Reaction emojis
export const REACTION_EMOJIS = ["🔥", "😭", "💀", "🫶"] as const;
export type ReactionEmoji = typeof REACTION_EMOJIS[number];

// Badge types
export const BADGE_TYPES = [
  "streak_7", "streak_30", "popular_post", "mood_explorer", "helper", "early_bird", "night_owl"
] as const;
export type BadgeType = typeof BADGE_TYPES[number];
