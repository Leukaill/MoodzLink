import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Since we're using Supabase as the backend, this server will mainly serve the frontend
  // All database operations will be handled client-side through Supabase
  
  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", message: "MoodzLink API is running" });
  });

  // Placeholder endpoints for development
  // In production, these would be replaced by Supabase Edge Functions
  
  app.get("/api/mood-posts", async (req, res) => {
    res.json({ message: "This endpoint is handled by Supabase", posts: [] });
  });

  app.post("/api/mood-posts", async (req, res) => {
    res.json({ message: "This endpoint is handled by Supabase", success: true });
  });

  app.post("/api/reactions", async (req, res) => {
    res.json({ message: "This endpoint is handled by Supabase", success: true });
  });

  app.get("/api/user/profile", async (req, res) => {
    res.json({ message: "This endpoint is handled by Supabase", user: null });
  });

  app.get("/api/user/achievements", async (req, res) => {
    res.json({ message: "This endpoint is handled by Supabase", achievements: [] });
  });

  app.post("/api/mood-matches/find", async (req, res) => {
    res.json({ message: "This endpoint is handled by Supabase", match: null });
  });

  app.get("/api/mood-matches", async (req, res) => {
    res.json({ message: "This endpoint is handled by Supabase", matches: [] });
  });

  app.post("/api/daily-photos", async (req, res) => {
    res.json({ message: "This endpoint is handled by Supabase", success: true });
  });

  app.get("/api/daily-photos/:date", async (req, res) => {
    res.json({ message: "This endpoint is handled by Supabase", photo: null });
  });

  const httpServer = createServer(app);

  return httpServer;
}
