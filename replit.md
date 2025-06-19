# Homeschool Helper Hub

## Overview

The Homeschool Helper Hub is a comprehensive family task management application designed to help homeschooling families organize chores, homework, schedules, and family activities. Built with React and Express, it provides a modern, user-friendly interface for managing daily tasks and tracking progress with a point-based reward system.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack React Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js 20 with Express.js
- **Language**: TypeScript with ES modules
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL storage
- **File Handling**: Multer for file uploads

### Database Layer
- **Database**: PostgreSQL 16
- **ORM**: Drizzle ORM with type-safe queries
- **Migrations**: Drizzle Kit for schema management
- **Connection**: Neon serverless database connection

## Key Components

### Authentication System
- **Provider**: Replit Auth integration
- **Session Storage**: PostgreSQL-backed sessions with 7-day TTL
- **Role-based Access**: Parent/child role distinction
- **User Management**: Automatic user creation and profile management

### Core Features
1. **Task Management**: Chores and homework tracking with completion status
2. **Family Events**: Calendar-based event scheduling
3. **House Rules**: Family rule documentation and management with search functionality
4. **Rewards System**: Point-based achievement tracking with customizable rewards
5. **File Management**: Document upload and sharing capabilities
6. **Comments**: Contextual communication system
7. **Parent Administrator Dashboard**: Comprehensive parent oversight and management tools
8. **Enhanced Schedule Management**: Calendar with quick task and event creation
9. **Notification System**: SMS/Email reminder configuration (ready for integration)

### Database Schema
- **Users**: Profile information, roles, points, and streaks
- **Families**: Family grouping and management
- **Tasks**: Chores and homework with assignments and due dates
- **Events**: Calendar events with categories and recurrence
- **House Rules**: Family rules with priority and categorization
- **Comments**: Contextual messaging system
- **Files**: Document storage with metadata

## Data Flow

1. **Authentication Flow**: User authenticates via Replit Auth → Session created → User profile retrieved/created
2. **Task Management**: Parents create tasks → Children view assigned tasks → Completion updates points and streaks
3. **Family Interaction**: All family members can view shared content → Comments and files provide collaboration
4. **Progress Tracking**: Completed tasks update user points → Achievements calculated → Leaderboards updated

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **drizzle-orm**: Type-safe database queries
- **passport**: Authentication middleware
- **openid-client**: OpenID Connect implementation
- **@tanstack/react-query**: Server state management
- **@radix-ui**: Headless UI components
- **tailwindcss**: Utility-first CSS framework

### Development Tools
- **tsx**: TypeScript execution for development
- **esbuild**: Fast JavaScript bundler for production
- **vite**: Frontend build tool with HMR
- **@replit/vite-plugin-***: Replit-specific development plugins

## Deployment Strategy

### Development Environment
- **Command**: `npm run dev` - Runs both frontend and backend with hot reload
- **Port**: 5000 (mapped to external port 80)
- **Database**: PostgreSQL provisioned via Replit

### Production Build
- **Frontend**: Vite builds to `dist/public`
- **Backend**: esbuild bundles server to `dist/index.js`
- **Deployment**: Replit autoscale deployment target
- **Environment**: Production environment variables required

### Configuration Requirements
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key
- `REPLIT_DOMAINS`: Allowed domains for auth
- `ISSUER_URL`: OpenID Connect issuer (defaults to Replit)

## Changelog

```
Changelog:
- June 19, 2025. Initial setup
- June 19, 2025. Enhanced app with comprehensive parent admin features:
  * Added Parent Administrator dashboard with child analytics and progress tracking
  * Enhanced Schedule page with quick task and event creation functionality
  * Implemented customizable reward system with point-based achievements
  * Added notification/reminder system configuration interface
  * Integrated house rules management within admin interface
  * Fixed authentication issues for incognito browser sessions
  * Updated sidebar navigation with role-based parent admin section
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```