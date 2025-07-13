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

// Swipes table for Tinder-style matching
export const swipes = pgTable("swipes", {
  id: uuid("id").primaryKey().defaultRandom(),
  swiperId: uuid("swiper_id").references(() => users.id).notNull(),
  swipedId: uuid("swiped_id").references(() => users.id).notNull(),
  postId: uuid("post_id").references(() => moodPosts.id), // Optional: swipe from a specific post
  direction: text("direction").notNull(), // 'left' or 'right'
  moodEmoji: text("mood_emoji").notNull(), // The mood that triggered the match opportunity
  createdAt: timestamp("created_at").defaultNow(),
});

// Matches table - created when both users swipe right
export const matches = pgTable("matches", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId1: uuid("user_id_1").references(() => users.id).notNull(),
  userId2: uuid("user_id_2").references(() => users.id).notNull(),
  moodEmoji: text("mood_emoji").notNull(), // The mood that brought them together
  createdAt: timestamp("created_at").defaultNow(),
  isActive: boolean("is_active").default(true),
  lastMessageAt: timestamp("last_message_at"),
});

// Chat messages for matches with 24h expiration and media support
export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  matchId: uuid("match_id").references(() => matches.id).notNull(),
  senderId: uuid("sender_id").references(() => users.id).notNull(),
  messageType: text("message_type").notNull().default("text"), // 'text', 'image', 'audio', 'video', 'emoji'
  content: text("content").notNull(), // Text content or media URL
  moodEmoji: text("mood_emoji"), // Optional mood emoji with message
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(), // 24 hours from creation
  isRead: boolean("is_read").default(false),
});

// Message reports for safety
export const messageReports = pgTable("message_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  reporterId: uuid("reporter_id").references(() => users.id).notNull(),
  messageId: uuid("message_id").references(() => chatMessages.id).notNull(),
  reason: text("reason").notNull(), // 'inappropriate', 'spam', 'harassment', etc.
  description: text("description"),
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

export const insertSwipeSchema = createInsertSchema(swipes).omit({
  id: true,
  createdAt: true,
});

export const insertMatchSchema = createInsertSchema(matches).omit({
  id: true,
  createdAt: true,
  lastMessageAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
  expiresAt: true,
});

export const insertMessageReportSchema = createInsertSchema(messageReports).omit({
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
export type Swipe = typeof swipes.$inferSelect;
export type InsertSwipe = z.infer<typeof insertSwipeSchema>;
export type Match = typeof matches.$inferSelect;
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type MessageReport = typeof messageReports.$inferSelect;
export type InsertMessageReport = z.infer<typeof insertMessageReportSchema>;

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
