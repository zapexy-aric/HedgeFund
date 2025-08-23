# Overview

This is a modern full-stack investment platform called "HedgeFund" that allows users to invest in various plans and manage their portfolios. The application is built with a React frontend and Express.js backend, featuring user authentication through Replit Auth, investment plan management, deposit/withdrawal functionality, and real-time portfolio tracking.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system variables
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Authentication**: Replit Auth with OpenID Connect integration
- **Session Management**: Express sessions stored in PostgreSQL
- **API Design**: RESTful endpoints with structured error handling
- **Middleware**: Custom logging, JSON parsing, and authentication guards

## Database Layer
- **ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured for Neon serverless)
- **Schema Management**: Drizzle Kit for migrations and schema updates
- **Connection**: Neon serverless driver with WebSocket support

## Data Models
The application manages several core entities:
- **Users**: Authentication data, balances, and profile information
- **Investment Plans**: Available investment options with returns and duration
- **User Investments**: Active user positions in various plans
- **Transactions**: Financial activity history (deposits, withdrawals, returns)
- **Partners**: Official partner logos for credibility
- **Announcements**: Platform communications and updates
- **Admin Settings**: System configuration and QR codes

## Authentication & Authorization
- **Provider**: Replit Auth with OIDC flow
- **Session Storage**: PostgreSQL-backed sessions with configurable TTL
- **Route Protection**: Middleware-based authentication guards
- **User Management**: Automatic user creation and profile updates

## External Dependencies

- **Database**: Neon PostgreSQL serverless database
- **Authentication**: Replit Auth service for user authentication
- **UI Components**: Radix UI primitives for accessible components
- **Development**: Replit-specific plugins for development environment
- **Build Tools**: Vite for frontend bundling, esbuild for backend compilation
- **Fonts**: Google Fonts integration for typography