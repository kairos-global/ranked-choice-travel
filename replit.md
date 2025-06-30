# TripPoll 95 - Ranked Choice Voting Application

## Overview

TripPoll 95 is a retro-themed web application that enables users to create and participate in ranked choice voting polls. The application features a Windows 95-inspired interface and implements instant runoff voting calculations. It's built as a full-stack application with React frontend and Express backend, designed for travel-related group decision making.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom retro Windows 95 theme
- **UI Components**: Radix UI primitives with shadcn/ui design system
- **State Management**: TanStack Query for server state, React hooks for local state
- **Routing**: Wouter for client-side routing
- **Build Tool**: Vite with custom alias configuration

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful API endpoints
- **Storage**: In-memory storage with interface for future database integration
- **Session Management**: Express sessions with PostgreSQL session store (configured but using memory storage)

### Database Schema (Prepared for PostgreSQL)
- **polls**: Stores poll information including title, description, options, settings, and admin keys
- **votes**: Stores individual votes with rankings and voter IP tracking
- **Schema Management**: Drizzle ORM with PostgreSQL dialect configured

## Key Components

### Core Features
1. **Poll Creation**: Users can create polls with 2-6 options, customizable settings
2. **Ranked Voting**: Drag-and-drop interface for ranking poll options
3. **Instant Runoff Calculation**: Implements proper ranked choice voting algorithm
4. **Results Visualization**: Live results with round-by-round elimination display
5. **Admin Controls**: Secure poll management with admin keys

### UI Components
- **RetroWindow**: Main container with Windows 95 styling
- **DragDropList**: Interactive ranking interface
- **LoadingScreen**: Retro boot sequence animation
- **Toast System**: User feedback notifications

### Voting Algorithm
- Implements instant runoff voting (IRV) with proper round elimination
- Handles preference transfers when candidates are eliminated
- Provides detailed round-by-round results breakdown

## Data Flow

1. **Poll Creation**: Frontend validates input → API creates poll with admin key → Returns poll data and admin key
2. **Voting**: User ranks options → Frontend submits vote with IP tracking → Backend validates and stores vote
3. **Results**: Queries votes → Calculates instant runoff results → Returns winner and round details
4. **Admin Actions**: Validates admin key → Allows poll updates/closure (if no votes cast)

## External Dependencies

### Frontend Dependencies
- **React Ecosystem**: React, React DOM, React Router (Wouter)
- **UI Libraries**: Radix UI primitives, Lucide icons, Embla Carousel
- **Utilities**: Class Variance Authority, clsx, date-fns
- **Development**: Vite, TypeScript, Tailwind CSS

### Backend Dependencies
- **Core**: Express.js, tsx for development
- **Database**: Drizzle ORM, @neondatabase/serverless, connect-pg-simple
- **Utilities**: Zod for validation, nanoid for ID generation
- **Build**: esbuild for production builds

### Database Integration
- **Current**: Memory-based storage implementation
- **Planned**: PostgreSQL with Neon serverless database
- **ORM**: Drizzle with full schema definitions ready for migration

## Deployment Strategy

### Development
- **Frontend**: Vite dev server with hot module replacement
- **Backend**: tsx with file watching for live reload
- **Integration**: Vite proxy configuration for API requests

### Production Build
- **Frontend**: Vite build to `dist/public` directory
- **Backend**: esbuild bundle to `dist/index.js`
- **Static Serving**: Express serves built frontend assets
- **Environment**: Configured for Replit deployment with custom plugins

### Database Migration
- **Schema**: Ready for PostgreSQL deployment with Drizzle migrations
- **Commands**: `db:push` script configured for schema updates
- **Connection**: Environment variable based database URL configuration

## Changelog

- June 30, 2025: Initial TripPoll 95 setup with ranked choice voting
- June 30, 2025: Completed UI styling - removed rainbow gradients, implemented Space Grotesk font with retro Windows 95 aesthetic
- June 30, 2025: Updated form placeholders to casual language ("Where should we go next?", "whats the vibe?")
- June 30, 2025: Final styling polish - solid blue colors, classic 90s interface elements
- June 30, 2025: Fixed mobile drag-and-drop functionality with touch events
- June 30, 2025: Added Visit buttons next to Copy buttons for voting and results links
- June 30, 2025: Project deployed to GitHub and ready for production

## User Preferences

- Preferred communication style: Simple, everyday language
- Design preference: No rainbow gradients, solid colors preferred
- Font choice: Space Grotesk for main text, Press Start 2P for logo only
- UI style: Classic TripPoll 95 Windows 95 aesthetic with modern functionality