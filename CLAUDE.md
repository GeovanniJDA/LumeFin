# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FinFolk is a personal finance management application built with React, TypeScript, and Vite. It uses Supabase as the backend database and follows a modern component architecture with Zustand for state management.

## Key Technologies & Architecture

- **Frontend**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Backend**: Supabase (PostgreSQL + Authentication)
- **State Management**: Zustand
- **UI Components**: Custom component library with shadcn-inspired styling
- **Routing**: React Router v7
- **Forms**: React Hook Form with Zod validation
- **Styling**: Tailwind CSS with custom glassmorphism effects

## Project Structure

```
src/
├── components/         # Shared UI components
│   ├── shared/         # Layout and common components
│   └── ui/            # Base UI components (buttons, forms, etc.)
├── hooks/              # Custom React hooks for data fetching
├── lib/                # Utilities, Supabase client, helper functions
├── pages/              # Page components for each route
├── store/              # Zustand stores for global state management
├── types/              # TypeScript interfaces and types
└── App.tsx             # Main application component
```

## Common Development Tasks

### Running the Application
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Working with Data
- All data is stored in Supabase PostgreSQL
- Use the existing hooks (`useBills`, `useCreditCards`, etc.) for data fetching
- Zustand stores handle client-side state synchronization
- Forms use React Hook Form with Zod schema validation

### Adding New Features
1. Create new components in `src/components/`
2. Add new pages in `src/pages/`
3. Extend types in `src/types/index.ts`
4. Create new hooks in `src/hooks/` if needed
5. Add new stores in `src/store/` for complex state management

## Code Patterns & Conventions

### Component Structure
- Components follow a consistent pattern with proper TypeScript typing
- Use functional components with hooks
- Separate UI logic from business logic
- Follow the existing styling conventions (glassmorphism effects)

### Data Management
- Use existing hook patterns for Supabase integration
- Leverage Zustand stores for global state
- Implement proper loading and error states
- Use the existing utility functions in `src/lib/utils.ts`

### Styling
- Use Tailwind CSS classes consistently
- Follow the existing color scheme and design system
- Implement responsive design with mobile-first approach
- Use the glassmorphism effects (`glass`, `glass-strong` classes)

## Testing & Quality Assurance

- Type checking is enforced with TypeScript
- ESLint configurations ensure code quality
- Manual testing through the development server
- End-to-end testing should be implemented separately

## Deployment

- The application is designed to be deployed as a static site
- Supabase handles backend services
- Environment variables must be configured for production