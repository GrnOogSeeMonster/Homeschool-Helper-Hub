import type { Express, RequestHandler } from "express";
import session from "express-session";
import memorystore from "memorystore";
import { storage } from "./storage";
import { nanoid } from "nanoid";

const MemoryStore = memorystore(session);

export function getSession() {
  const sessionTtlMs = 7 * 24 * 60 * 60 * 1000; // 1 week
  return session({
    secret: "homeschool-helper-hub-secret", // built-in secret for self-contained deploys
    store: new MemoryStore({ checkPeriod: 24 * 60 * 60 * 1000 }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      // Use non-secure cookies to work by default on http://localhost
      // If deploying behind TLS/HTTPS, this can be toggled to true.
      secure: false,
      sameSite: "lax",
      maxAge: sessionTtlMs,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  // Simple local login that provisions an initial family and admin user if needed
  // Local login always creates a fresh session user id based on invite-linked resolution if provided
  app.get("/api/login", async (req: any, res) => {
    try {
      if (!req.session.userId) {
        const userId = `user_${nanoid(12)}`;
        const familyId = `family_${nanoid(12)}`;
        await storage.createFamily({ id: familyId, name: "Your Family" });
        await storage.upsertUser({ id: userId, role: "admin", familyId, hasLoggedIn: true, firstName: "Parent", lastName: "Admin" });
        req.session.userId = userId;
      }

      req.session.save((err: any) => {
        if (err) {
          return res.status(500).send("Failed to establish session");
        }
        return res.redirect("/");
      });
    } catch (e) {
      return res.status(500).send("Login failed");
    }
  });

  app.get("/api/logout", (req: any, res) => {
    req.session.destroy(() => {
      res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = (req: any, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};


