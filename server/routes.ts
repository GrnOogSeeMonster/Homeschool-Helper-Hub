import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import multer from "multer";
import path from "path";
import { 
  insertTaskSchema, 
  insertEventSchema, 
  insertHouseRuleSchema, 
  insertCommentSchema,
  insertFamilySchema 
} from "@shared/schema";
import { z } from "zod";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, JPG, PNG, and GIF files are allowed.'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Family routes
  app.post('/api/families', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const familyData = insertFamilySchema.parse(req.body);
      
      const family = await storage.createFamily(familyData);
      
      // Update user to be part of this family and set as parent
      const user = await storage.getUser(userId);
      if (user) {
        await storage.upsertUser({
          ...user,
          familyId: family.id,
          role: 'parent'
        });
      }
      
      res.json(family);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid family data", errors: error.errors });
      }
      console.error("Error creating family:", error);
      res.status(500).json({ message: "Failed to create family" });
    }
  });

  app.get('/api/families/current', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const family = await storage.getFamilyByUserId(userId);
      if (!family) {
        return res.status(404).json({ message: "Family not found" });
      }
      res.json(family);
    } catch (error) {
      console.error("Error fetching family:", error);
      res.status(500).json({ message: "Failed to fetch family" });
    }
  });

  app.get('/api/families/:id/members', isAuthenticated, async (req: any, res) => {
    try {
      const familyId = req.params.id;
      const members = await storage.getUsersByFamily(familyId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching family members:", error);
      res.status(500).json({ message: "Failed to fetch family members" });
    }
  });

  // Task routes
  app.post('/api/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.familyId) {
        return res.status(400).json({ message: "User must be part of a family" });
      }

      const taskData = insertTaskSchema.parse({
        ...req.body,
        assignedBy: userId,
        familyId: user.familyId
      });
      
      const task = await storage.createTask(taskData);
      res.json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid task data", errors: error.errors });
      }
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.get('/api/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.familyId) {
        return res.status(400).json({ message: "User must be part of a family" });
      }

      const filters: any = {};
      if (req.query.assignedTo) filters.assignedTo = req.query.assignedTo as string;
      if (req.query.type) filters.type = req.query.type as string;
      if (req.query.completed !== undefined) filters.completed = req.query.completed === 'true';

      const tasks = await storage.getTasks(user.familyId, filters);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.patch('/api/tasks/:id/complete', isAuthenticated, async (req: any, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      const task = await storage.completeTask(taskId, userId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.json(task);
    } catch (error) {
      console.error("Error completing task:", error);
      res.status(500).json({ message: "Failed to complete task" });
    }
  });

  app.patch('/api/tasks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const updates = req.body;
      
      const task = await storage.updateTask(taskId, updates);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.json(task);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete('/api/tasks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const deleted = await storage.deleteTask(taskId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.json({ message: "Task deleted successfully" });
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Event routes
  app.post('/api/events', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.familyId) {
        return res.status(400).json({ message: "User must be part of a family" });
      }

      const eventData = insertEventSchema.parse({
        ...req.body,
        createdBy: userId,
        familyId: user.familyId
      });
      
      const event = await storage.createEvent(eventData);
      res.json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid event data", errors: error.errors });
      }
      console.error("Error creating event:", error);
      res.status(500).json({ message: "Failed to create event" });
    }
  });

  app.get('/api/events', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.familyId) {
        return res.status(400).json({ message: "User must be part of a family" });
      }

      let startDate, endDate;
      if (req.query.startDate) startDate = new Date(req.query.startDate as string);
      if (req.query.endDate) endDate = new Date(req.query.endDate as string);

      const events = await storage.getEvents(user.familyId, startDate, endDate);
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.patch('/api/events/:id', isAuthenticated, async (req: any, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const updates = req.body;
      
      const event = await storage.updateEvent(eventId, updates);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json(event);
    } catch (error) {
      console.error("Error updating event:", error);
      res.status(500).json({ message: "Failed to update event" });
    }
  });

  app.delete('/api/events/:id', isAuthenticated, async (req: any, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const deleted = await storage.deleteEvent(eventId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json({ message: "Event deleted successfully" });
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({ message: "Failed to delete event" });
    }
  });

  // House Rules routes
  app.post('/api/house-rules', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.familyId) {
        return res.status(400).json({ message: "User must be part of a family" });
      }

      const ruleData = insertHouseRuleSchema.parse({
        ...req.body,
        createdBy: userId,
        familyId: user.familyId
      });
      
      const rule = await storage.createHouseRule(ruleData);
      res.json(rule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid rule data", errors: error.errors });
      }
      console.error("Error creating house rule:", error);
      res.status(500).json({ message: "Failed to create house rule" });
    }
  });

  app.get('/api/house-rules', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.familyId) {
        return res.status(400).json({ message: "User must be part of a family" });
      }

      const filters: any = {};
      if (req.query.category) filters.category = req.query.category as string;
      if (req.query.search) filters.search = req.query.search as string;

      const rules = await storage.getHouseRules(user.familyId, filters);
      res.json(rules);
    } catch (error) {
      console.error("Error fetching house rules:", error);
      res.status(500).json({ message: "Failed to fetch house rules" });
    }
  });

  app.patch('/api/house-rules/:id', isAuthenticated, async (req: any, res) => {
    try {
      const ruleId = parseInt(req.params.id);
      const updates = req.body;
      
      const rule = await storage.updateHouseRule(ruleId, updates);
      if (!rule) {
        return res.status(404).json({ message: "House rule not found" });
      }
      
      res.json(rule);
    } catch (error) {
      console.error("Error updating house rule:", error);
      res.status(500).json({ message: "Failed to update house rule" });
    }
  });

  app.delete('/api/house-rules/:id', isAuthenticated, async (req: any, res) => {
    try {
      const ruleId = parseInt(req.params.id);
      const deleted = await storage.deleteHouseRule(ruleId);
      
      if (!deleted) {
        return res.status(404).json({ message: "House rule not found" });
      }
      
      res.json({ message: "House rule deleted successfully" });
    } catch (error) {
      console.error("Error deleting house rule:", error);
      res.status(500).json({ message: "Failed to delete house rule" });
    }
  });

  // Comment routes
  app.post('/api/comments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.familyId) {
        return res.status(400).json({ message: "User must be part of a family" });
      }

      const commentData = insertCommentSchema.parse({
        ...req.body,
        authorId: userId,
        familyId: user.familyId
      });
      
      const comment = await storage.createComment(commentData);
      res.json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid comment data", errors: error.errors });
      }
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  app.get('/api/comments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.familyId) {
        return res.status(400).json({ message: "User must be part of a family" });
      }

      const filters: any = {};
      if (req.query.contextType) filters.contextType = req.query.contextType as string;
      if (req.query.contextId) filters.contextId = req.query.contextId as string;

      const comments = await storage.getComments(user.familyId, filters);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // File upload routes
  app.post('/api/files/upload', isAuthenticated, upload.array('files', 5), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.familyId) {
        return res.status(400).json({ message: "User must be part of a family" });
      }

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const uploadedFiles = [];
      for (const file of files) {
        const fileData = {
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          uploadedBy: userId,
          familyId: user.familyId,
          contextType: req.body.contextType || null,
          contextId: req.body.contextId || null,
        };

        const savedFile = await storage.createFile(fileData);
        uploadedFiles.push(savedFile);
      }

      res.json(uploadedFiles);
    } catch (error) {
      console.error("Error uploading files:", error);
      res.status(500).json({ message: "Failed to upload files" });
    }
  });

  app.get('/api/files', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.familyId) {
        return res.status(400).json({ message: "User must be part of a family" });
      }

      const filters: any = {};
      if (req.query.contextType) filters.contextType = req.query.contextType as string;
      if (req.query.contextId) filters.contextId = req.query.contextId as string;

      const files = await storage.getFiles(user.familyId, filters);
      res.json(files);
    } catch (error) {
      console.error("Error fetching files:", error);
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

  // Achievement routes
  app.get('/api/achievements/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.params.userId;
      const achievements = await storage.getUserAchievements(userId);
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.familyId) {
        return res.status(400).json({ message: "User must be part of a family" });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      // Get today's tasks
      const todayTasks = await storage.getTasks(user.familyId, { assignedTo: userId });
      const todayTasksFiltered = todayTasks.filter(task => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        return dueDate >= today && dueDate < tomorrow;
      });

      // Get week's tasks
      const weekTasks = todayTasks.filter(task => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        return dueDate >= weekStart && dueDate < weekEnd;
      });

      // Get achievements
      const achievements = await storage.getUserAchievements(userId);

      // Get upcoming events
      const upcomingEvents = await storage.getEvents(user.familyId, today);

      // Calculate family rank (simplified)
      const familyMembers = await storage.getUsersByFamily(user.familyId);
      const sortedMembers = familyMembers.sort((a, b) => (b.points || 0) - (a.points || 0));
      const userRank = sortedMembers.findIndex(m => m.id === userId) + 1;

      const stats = {
        todayTasks: {
          completed: todayTasksFiltered.filter(t => t.completed).length,
          total: todayTasksFiltered.length
        },
        weekTasks: {
          completed: weekTasks.filter(t => t.completed).length,
          total: weekTasks.length
        },
        achievements: achievements.length,
        familyRank: userRank,
        upcomingEvents: upcomingEvents.slice(0, 3),
        recentAchievements: achievements.slice(0, 3)
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Profile routes
  app.get('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.patch('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const updatedUser = await storage.upsertUser({
        ...existingUser,
        ...req.body,
        id: userId,
      });
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.get('/api/profile/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const familyId = user.familyId;
      if (!familyId) {
        return res.json({
          totalPoints: user.points || 0,
          completedTasks: 0,
          currentStreak: user.streak || 0,
          upcomingTasks: 0,
          achievements: 0,
        });
      }

      const tasks = await storage.getTasks(familyId, { assignedTo: userId });
      const completedTasks = tasks.filter(task => task.completed).length;
      const upcomingTasks = tasks.filter(task => !task.completed).length;
      const achievements = await storage.getUserAchievements(userId);

      res.json({
        totalPoints: user.points || 0,
        completedTasks,
        currentStreak: user.streak || 0,
        upcomingTasks,
        achievements: achievements.length,
      });
    } catch (error) {
      console.error("Error fetching profile stats:", error);
      res.status(500).json({ message: "Failed to fetch profile stats" });
    }
  });

  // Family Management routes
  app.get('/api/family/members', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user || !user.familyId) {
        return res.json([]);
      }

      const familyMembers = await storage.getUsersByFamily(user.familyId);
      res.json(familyMembers);
    } catch (error) {
      console.error("Error fetching family members:", error);
      res.status(500).json({ message: "Failed to fetch family members" });
    }
  });

  app.get('/api/family/info', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user || !user.familyId) {
        return res.json({ name: "Your Family" });
      }

      const family = await storage.getFamily(user.familyId);
      res.json(family || { name: "Your Family" });
    } catch (error) {
      console.error("Error fetching family info:", error);
      res.status(500).json({ message: "Failed to fetch family info" });
    }
  });

  app.post('/api/family/members', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user || !['admin', 'parent'].includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const familyId = user.familyId;
      if (!familyId) {
        return res.status(400).json({ message: "User not in a family" });
      }

      // Create a new family member with a unique ID
      const memberId = `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newMember = await storage.upsertUser({
        id: memberId,
        ...req.body,
        familyId,
        hasLoggedIn: false,
      });

      res.json(newMember);
    } catch (error) {
      console.error("Error creating family member:", error);
      res.status(500).json({ message: "Failed to create family member" });
    }
  });

  app.patch('/api/family/members/:memberId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user || !['admin', 'parent'].includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { memberId } = req.params;
      const existingMember = await storage.getUser(memberId);
      if (!existingMember || existingMember.familyId !== user.familyId) {
        return res.status(404).json({ message: "Family member not found" });
      }

      const updatedMember = await storage.upsertUser({
        ...existingMember,
        ...req.body,
        id: memberId,
      });

      res.json(updatedMember);
    } catch (error) {
      console.error("Error updating family member:", error);
      res.status(500).json({ message: "Failed to update family member" });
    }
  });

  app.delete('/api/family/members/:memberId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user || !['admin', 'parent'].includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { memberId } = req.params;
      const member = await storage.getUser(memberId);
      if (!member || member.familyId !== user.familyId) {
        return res.status(404).json({ message: "Family member not found" });
      }

      res.json({ message: "Family member removed successfully" });
    } catch (error) {
      console.error("Error removing family member:", error);
      res.status(500).json({ message: "Failed to remove family member" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
