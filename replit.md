# MoodLink - Mood Sharing App for Teenagers

## Overview

MoodLink is a modern web application designed for teenagers to share their moods and connect with others. The app allows users to post text, images, audio, or short videos alongside mood emojis, interact through reactions, and discover mood matches. The application emphasizes anonymity and safe social interaction with gamification elements to encourage engagement.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React Query (TanStack Query) for server state and React Context for local state
- **Animations**: Framer Motion for smooth micro-interactions and transitions

### Backend Architecture
- **Database**: Supabase (PostgreSQL) for real-time data and authentication
- **Authentication**: Supabase Auth with anonymous and Google OAuth options
- **Media Storage**: Cloudinary for image, audio, and video uploads
- **Server**: Express.js serving the React app with minimal API endpoints (mainly delegated to Supabase)
- **Real-time Features**: Supabase real-time subscriptions for live updates

### Database Design
The application uses a PostgreSQL schema with the following main tables:
- `users`: User profiles and statistics (streaks, post counts)
- `mood_posts`: User mood posts with media and metadata
- `reactions`: Emoji reactions to posts
- `daily_photos`: BeReal-style daily photo feature

## Key Components

### Authentication System
- Anonymous sign-in by default for privacy
- Optional Google OAuth for persistent accounts
- User nicknames for personalization while maintaining anonymity
- Supabase handles session management and security

### Mood Posting System
- Text posts (max 300 characters)
- Media uploads (images, audio, video) via Cloudinary
- Mood emoji selection from predefined set
- Anonymous vs. identified posting options
- Real-time feed updates

### Social Features
- Emoji reactions (🔥, 😭, 💀, 🫶)
- Mood-based matching system
- Daily photo challenges (BeReal-style)
- Real-time notifications and updates

### Gamification Elements
- Daily posting streaks
- Achievement badges (streak milestones, popular posts, etc.)
- User statistics and progress tracking

### Media Handling
- Cloudinary integration for optimized media delivery
- Automatic image optimization and responsive sizing
- Video thumbnail generation
- Audio playback controls

## Data Flow

1. **User Authentication**: Supabase handles anonymous/OAuth sign-in
2. **Content Creation**: React forms → Cloudinary upload → Supabase database
3. **Feed Display**: React Query fetches from Supabase → Real-time updates via subscriptions
4. **Interactions**: User actions → Supabase mutations → Real-time propagation
5. **Media Delivery**: Cloudinary CDN serves optimized media based on device/context

## External Dependencies

### Core Services
- **Supabase**: Database, authentication, real-time subscriptions
- **Cloudinary**: Media upload, optimization, and delivery
- **Vercel/Replit**: Hosting and deployment

### Key Libraries
- **UI**: Radix UI, Tailwind CSS, Framer Motion
- **Forms**: React Hook Form with Zod validation
- **Data Fetching**: TanStack React Query
- **Date Handling**: date-fns
- **Development**: Vite, TypeScript, ESLint

### Environment Variables Required
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key
- `VITE_CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name
- `VITE_CLOUDINARY_UPLOAD_PRESET`: Cloudinary upload preset

## Deployment Strategy

### Development
- Local development with Vite dev server
- Hot module replacement for fast iteration
- TypeScript checking and ESLint for code quality

### Production
- Static site generation via Vite build
- Express server serves built React app
- Environment-specific configuration
- Optimized bundles with code splitting

### Hosting Options
- **Replit**: Integrated development and hosting
- **Vercel**: Serverless deployment with automatic scaling
- CDN integration via Cloudinary for media assets

The architecture prioritizes real-time user experience, content safety, and scalability while maintaining a clean, maintainable codebase suitable for a teenage audience's social interaction patterns.