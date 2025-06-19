import {
  users,
  families,
  tasks,
  events,
  houseRules,
  comments,
  achievements,
  files,
  type User,
  type UpsertUser,
  type Family,
  type InsertFamily,
  type Task,
  type InsertTask,
  type Event,
  type InsertEvent,
  type HouseRule,
  type InsertHouseRule,
  type Comment,
  type InsertComment,
  type Achievement,
  type InsertAchievement,
  type File,
  type InsertFile,
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUsersByFamily(familyId: string): Promise<User[]>;
  updateUserPoints(userId: string, points: number): Promise<void>;
  updateUserStreak(userId: string, streak: number): Promise<void>;

  // Family operations
  createFamily(family: InsertFamily): Promise<Family>;
  getFamily(id: string): Promise<Family | undefined>;
  getFamilyByUserId(userId: string): Promise<Family | undefined>;

  // Task operations
  createTask(task: InsertTask): Promise<Task>;
  getTasks(familyId: string, filters?: { assignedTo?: string; type?: string; completed?: boolean }): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  updateTask(id: number, updates: Partial<Task>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  completeTask(id: number, userId: string): Promise<Task | undefined>;

  // Event operations
  createEvent(event: InsertEvent): Promise<Event>;
  getEvents(familyId: string, startDate?: Date, endDate?: Date): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  updateEvent(id: number, updates: Partial<Event>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;

  // House Rules operations
  createHouseRule(rule: InsertHouseRule): Promise<HouseRule>;
  getHouseRules(familyId: string, filters?: { category?: string; search?: string }): Promise<HouseRule[]>;
  getHouseRule(id: number): Promise<HouseRule | undefined>;
  updateHouseRule(id: number, updates: Partial<HouseRule>): Promise<HouseRule | undefined>;
  deleteHouseRule(id: number): Promise<boolean>;

  // Comment operations
  createComment(comment: InsertComment): Promise<Comment>;
  getComments(familyId: string, filters?: { contextType?: string; contextId?: string }): Promise<Comment[]>;
  deleteComment(id: number): Promise<boolean>;

  // Achievement operations
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  getUserAchievements(userId: string): Promise<Achievement[]>;

  // File operations
  createFile(file: InsertFile): Promise<File>;
  getFiles(familyId: string, filters?: { contextType?: string; contextId?: string }): Promise<File[]>;
  getFile(id: number): Promise<File | undefined>;
  deleteFile(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private families: Map<string, Family> = new Map();
  private tasks: Map<number, Task> = new Map();
  private events: Map<number, Event> = new Map();
  private houseRules: Map<number, HouseRule> = new Map();
  private comments: Map<number, Comment> = new Map();
  private achievements: Map<number, Achievement> = new Map();
  private files: Map<number, File> = new Map();
  
  private currentTaskId = 1;
  private currentEventId = 1;
  private currentRuleId = 1;
  private currentCommentId = 1;
  private currentAchievementId = 1;
  private currentFileId = 1;

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = this.users.get(userData.id);
    const user: User = {
      id: userData.id,
      email: userData.email ?? null,
      firstName: userData.firstName ?? null,
      lastName: userData.lastName ?? null,
      profileImageUrl: userData.profileImageUrl ?? null,
      role: userData.role ?? "admin",
      familyId: userData.familyId ?? null,
      points: existingUser?.points ?? userData.points ?? 0,
      streak: existingUser?.streak ?? userData.streak ?? 0,
      age: userData.age ?? null,
      grade: userData.grade ?? null,
      bio: userData.bio ?? null,
      preferences: userData.preferences ?? null,
      hasLoggedIn: userData.hasLoggedIn ?? false,
      inviteToken: userData.inviteToken ?? null,
      lastActiveDate: existingUser?.lastActiveDate ?? userData.lastActiveDate ?? null,
      createdAt: existingUser?.createdAt ?? new Date(),
      updatedAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async getUsersByFamily(familyId: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.familyId === familyId);
  }

  async updateUserPoints(userId: string, points: number): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.points = (user.points || 0) + points;
      user.updatedAt = new Date();
      this.users.set(userId, user);
    }
  }

  async updateUserStreak(userId: string, streak: number): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.streak = streak;
      user.lastActiveDate = new Date().toISOString().split('T')[0];
      user.updatedAt = new Date();
      this.users.set(userId, user);
    }
  }

  // Family operations
  async createFamily(familyData: InsertFamily): Promise<Family> {
    const family: Family = {
      ...familyData,
      createdAt: new Date(),
    };
    this.families.set(family.id, family);
    return family;
  }

  async getFamily(id: string): Promise<Family | undefined> {
    return this.families.get(id);
  }

  async getFamilyByUserId(userId: string): Promise<Family | undefined> {
    const user = this.users.get(userId);
    if (user?.familyId) {
      return this.families.get(user.familyId);
    }
    return undefined;
  }

  // Task operations
  async createTask(taskData: InsertTask): Promise<Task> {
    const id = this.currentTaskId++;
    const task: Task = {
      id,
      ...taskData,
      completed: false,
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.tasks.set(id, task);
    return task;
  }

  async getTasks(familyId: string, filters?: { assignedTo?: string; type?: string; completed?: boolean }): Promise<Task[]> {
    let results = Array.from(this.tasks.values()).filter(task => task.familyId === familyId);
    
    if (filters?.assignedTo) {
      results = results.filter(task => task.assignedTo === filters.assignedTo);
    }
    if (filters?.type) {
      results = results.filter(task => task.type === filters.type);
    }
    if (filters?.completed !== undefined) {
      results = results.filter(task => task.completed === filters.completed);
    }
    
    return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async updateTask(id: number, updates: Partial<Task>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    
    const updatedTask = { ...task, ...updates, updatedAt: new Date() };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }

  async completeTask(id: number, userId: string): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    
    const updatedTask = {
      ...task,
      completed: true,
      completedAt: new Date(),
      updatedAt: new Date(),
    };
    this.tasks.set(id, updatedTask);
    
    // Award points to user
    if (task.points && task.points > 0) {
      await this.updateUserPoints(userId, task.points);
    }
    
    return updatedTask;
  }

  // Event operations
  async createEvent(eventData: InsertEvent): Promise<Event> {
    const id = this.currentEventId++;
    const event: Event = {
      id,
      ...eventData,
      notificationSent: false,
      createdAt: new Date(),
    };
    this.events.set(id, event);
    return event;
  }

  async getEvents(familyId: string, startDate?: Date, endDate?: Date): Promise<Event[]> {
    let results = Array.from(this.events.values()).filter(event => event.familyId === familyId);
    
    if (startDate || endDate) {
      results = results.filter(event => {
        const eventDate = new Date(event.eventDate);
        if (startDate && eventDate < startDate) return false;
        if (endDate && eventDate > endDate) return false;
        return true;
      });
    }
    
    return results.sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
  }

  async getEvent(id: number): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async updateEvent(id: number, updates: Partial<Event>): Promise<Event | undefined> {
    const event = this.events.get(id);
    if (!event) return undefined;
    
    const updatedEvent = { ...event, ...updates };
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }

  async deleteEvent(id: number): Promise<boolean> {
    return this.events.delete(id);
  }

  // House Rules operations
  async createHouseRule(ruleData: InsertHouseRule): Promise<HouseRule> {
    const id = this.currentRuleId++;
    const rule: HouseRule = {
      id,
      ...ruleData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.houseRules.set(id, rule);
    return rule;
  }

  async getHouseRules(familyId: string, filters?: { category?: string; search?: string }): Promise<HouseRule[]> {
    let results = Array.from(this.houseRules.values()).filter(rule => rule.familyId === familyId);
    
    if (filters?.category) {
      results = results.filter(rule => rule.category === filters.category);
    }
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      results = results.filter(rule => 
        rule.title.toLowerCase().includes(searchLower) ||
        rule.description.toLowerCase().includes(searchLower) ||
        rule.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }
    
    return results.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async getHouseRule(id: number): Promise<HouseRule | undefined> {
    return this.houseRules.get(id);
  }

  async updateHouseRule(id: number, updates: Partial<HouseRule>): Promise<HouseRule | undefined> {
    const rule = this.houseRules.get(id);
    if (!rule) return undefined;
    
    const updatedRule = { ...rule, ...updates, updatedAt: new Date() };
    this.houseRules.set(id, updatedRule);
    return updatedRule;
  }

  async deleteHouseRule(id: number): Promise<boolean> {
    return this.houseRules.delete(id);
  }

  // Comment operations
  async createComment(commentData: InsertComment): Promise<Comment> {
    const id = this.currentCommentId++;
    const comment: Comment = {
      id,
      ...commentData,
      createdAt: new Date(),
    };
    this.comments.set(id, comment);
    return comment;
  }

  async getComments(familyId: string, filters?: { contextType?: string; contextId?: string }): Promise<Comment[]> {
    let results = Array.from(this.comments.values()).filter(comment => comment.familyId === familyId);
    
    if (filters?.contextType) {
      results = results.filter(comment => comment.contextType === filters.contextType);
    }
    if (filters?.contextId) {
      results = results.filter(comment => comment.contextId === filters.contextId);
    }
    
    return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async deleteComment(id: number): Promise<boolean> {
    return this.comments.delete(id);
  }

  // Achievement operations
  async createAchievement(achievementData: InsertAchievement): Promise<Achievement> {
    const id = this.currentAchievementId++;
    const achievement: Achievement = {
      id,
      ...achievementData,
      earnedAt: new Date(),
    };
    this.achievements.set(id, achievement);
    return achievement;
  }

  async getUserAchievements(userId: string): Promise<Achievement[]> {
    return Array.from(this.achievements.values())
      .filter(achievement => achievement.userId === userId)
      .sort((a, b) => b.earnedAt.getTime() - a.earnedAt.getTime());
  }

  // File operations
  async createFile(fileData: InsertFile): Promise<File> {
    const id = this.currentFileId++;
    const file: File = {
      id,
      ...fileData,
      uploadedAt: new Date(),
    };
    this.files.set(id, file);
    return file;
  }

  async getFiles(familyId: string, filters?: { contextType?: string; contextId?: string }): Promise<File[]> {
    let results = Array.from(this.files.values()).filter(file => file.familyId === familyId);
    
    if (filters?.contextType) {
      results = results.filter(file => file.contextType === filters.contextType);
    }
    if (filters?.contextId) {
      results = results.filter(file => file.contextId === filters.contextId);
    }
    
    return results.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
  }

  async getFile(id: number): Promise<File | undefined> {
    return this.files.get(id);
  }

  async deleteFile(id: number): Promise<boolean> {
    return this.files.delete(id);
  }
}

export const storage = new MemStorage();
