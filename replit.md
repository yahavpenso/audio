# Audio Editor - Professional Audio Editing Platform

## Overview

A web-based audio editing application that runs entirely in the browser using the Web Audio API. This is a client-side focused application that allows users to import audio files, apply real-time panning effects, perform precise audio cutting and trimming, and export in multiple formats (WAV and MP3). The application emphasizes professional tool aesthetics with Material Design principles adapted for audio editing workflows.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript
- Single-page application using Wouter for client-side routing
- Component-based architecture with shadcn/ui (Radix UI primitives)
- Material Design system with custom audio-specific patterns
- Inter font family for professional typography

**State Management**:
- React hooks for local component state
- TanStack Query (React Query) for server state management (minimal usage)
- No global state management needed - primarily local audio processing state

**Audio Processing**:
- Web Audio API for all audio manipulation (client-side only)
- Real-time audio playback with panning effects
- Offline audio rendering for export functionality
- Canvas-based waveform visualization

**Key Design Decisions**:
- **Client-side processing**: All audio editing happens in the browser to avoid server costs and enable instant feedback
- **No backend audio routes**: Server routes are intentionally empty as audio processing is handled client-side
- **Memory storage only**: No persistent storage - users work with imported files and export results

### Component Structure

**Main Editor Components**:
- `WaveformVisualization`: Canvas-based audio waveform display with selection support
- `PlaybackControls`: Audio playback with Web Audio API integration, volume control, and seeking
- `TimelineEditor`: Horizontal timeline with zoom controls and effect visualization
- `PanningEffectPanel`: UI for adding and configuring stereo panning effects
- `CuttingTools`: Selection-based audio trimming and cutting
- `ExportModal`: Format selection (WAV/MP3) with quality settings

**Layout Pattern**:
- Top navigation bar (fixed height, 64px)
- Central workspace with waveform (240px height)
- Bottom timeline (fixed height, scrollable)
- Right sidebar for effect controls (320px width)

### Styling System

**Tailwind CSS Configuration**:
- Custom color system with HSL variables for light/dark mode support
- Spacing primitives: 2, 4, 6, 8 units
- Border radius: sm (3px), md (6px), lg (9px)
- Design tokens for elevation, borders, and interactive states

**Component Library**: shadcn/ui (New York style)
- Radix UI primitives for accessibility
- Custom variants for audio-specific controls
- Consistent spacing and visual hierarchy

### Audio Processing Architecture

**Web Audio API Integration**:
- `AudioContext` for global audio state management
- `AudioBuffer` for loaded audio data
- `AudioBufferSourceNode` for playback
- `StereoPannerNode` for panning effects
- `OfflineAudioContext` for rendering exports

**Effect System**:
- Effects stored as metadata with start time, duration, and intensity
- Real-time application during playback via scheduled automation
- Offline rendering for export with effects baked in

**Export Pipeline**:
- WAV export: Direct AudioBuffer to WAV encoding
- MP3 export: Uses lamejs library for browser-based MP3 encoding
- Quality settings: Sample rate, bit depth (WAV), bitrate (MP3)

### Data Models

**Core Schemas** (defined in `shared/schema.ts`):
- `AudioFile`: File metadata (id, name, duration, sample rate, channels)
- `PanningEffect`: Effect instance (id, startTime, duration, intensity 0-100)
- `AudioSelection`: Time range for cutting (startTime, endTime)
- `ExportSettings`: Union type for WAV and MP3 export configurations

**Validation**: Zod schemas for runtime type checking

### Backend Architecture

**Server Stack**:
- Express.js server (minimal configuration)
- Vite middleware for development
- Static file serving for production build

**Database**: 
- Drizzle ORM configured with PostgreSQL (via Neon)
- Database schema defined but not actively used (future enhancement)
- Connection configuration via `DATABASE_URL` environment variable

**Key Decision**: Backend is essentially a static file server. All audio processing, effect application, and file handling occurs client-side for:
- Zero latency for audio operations
- No server costs for processing
- Better user privacy (files never uploaded)
- Offline capability potential

### Build & Development

**Build Tools**:
- Vite for frontend bundling and development server
- esbuild for backend production builds
- TypeScript with strict mode enabled

**Module Resolution**:
- Path aliases: `@/` for client source, `@shared/` for shared code
- ESM modules throughout (type: "module" in package.json)

**Development Workflow**:
- `npm run dev`: Development mode with HMR
- `npm run build`: Production build (frontend + backend)
- `npm run check`: TypeScript type checking

## External Dependencies

### Audio Processing
- **Web Audio API**: Native browser API for all audio manipulation
- **lamejs**: Browser-based MP3 encoding library for export functionality

### UI Framework
- **React 18**: Component rendering and state management
- **Wouter**: Lightweight client-side routing
- **shadcn/ui**: Component library built on Radix UI primitives
- **Tailwind CSS**: Utility-first styling framework
- **Lucide React**: Icon system

### Backend Services
- **Neon PostgreSQL**: Serverless PostgreSQL database (configured but not actively used)
- **Drizzle ORM**: TypeScript ORM for database operations

### Development Tools
- **Vite**: Build tool and dev server
- **TypeScript**: Type safety and developer experience
- **TanStack Query**: Server state management (minimal usage in current implementation)

### Replit-Specific
- `@replit/vite-plugin-runtime-error-modal`: Development error overlay
- `@replit/vite-plugin-cartographer`: Development tooling
- `@replit/vite-plugin-dev-banner`: Development banner