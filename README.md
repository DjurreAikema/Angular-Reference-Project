# QuickLists - Angular Architecture Reference

A modern Angular application demonstrating production-ready architectural patterns and reactive programming practices. This project serves as a reference implementation of industry best practices, heavily inspired by [Joshua Morony's](https://www.joshuamorony.com/) signal-based reactive patterns.

## Core Architectural Principles

This application is built around three fundamental concepts:

### 1. Smart and Dumb (Presentational) Components

Following the **single-responsibility principle**, components are divided into two categories:

**Smart Components** ([example: `home.component.ts`](src/app/home/home.component.ts))
- Handle application logic and orchestration
- Inject dependencies and services
- Manage state and side effects
- Typically route-level components

**Dumb Components** ([example: `checklist-list.component.ts`](src/app/home/ui/checklist-list.component.ts))
- Receive data through `@Input()`
- Communicate via `@Output()` events
- No service dependencies (generally)
- Purely presentational, unaware of broader application context

This separation ensures components are maintainable, testable, and reusable.

### 2. Reactive & Declarative Programming

The application embraces **declarative** code where every piece of data is defined by its declaration, not imperatively modified throughout the codebase.

**Key principle**: "What **is** this data?" should be answerable by looking at its declaration.

**Observable-based patterns** handle asynchronous reactivity (HTTP requests, events), while **Signals** handle synchronous reactivity (state derivations).

Example pattern:
```typescript
// Declarative: what articles ARE, not how to get them
articlesForPage$ = this.currentPage$.pipe(
  switchMap(page => this.api.getArticles(page))
);
```

See the [state management implementation](src/app/shared/data-access/checklist.service.ts) for real-world examples.

### 3. State Management with RxJS and Signals

State management follows the **sources → reducers → state → selectors** pattern:

**Flow**:
1. **Sources**: Observables/Subjects that bring data into the application ([example](src/app/shared/data-access/checklist.service.ts#L28-L33))
2. **Reducers**: Subscribe to sources and update the state signal ([example](src/app/shared/data-access/checklist.service.ts#L64-L101))
3. **State**: A single signal holding the state object ([example](src/app/shared/data-access/checklist.service.ts#L20-L24))
4. **Selectors**: Computed signals derived from state ([example](src/app/shared/data-access/checklist.service.ts#L26-L29))

This approach uses [ngxtension's `connect`](https://ngxtension.netlify.app/utilities/connect/) utility to bridge RxJS observables with Angular signals, providing a clean separation between asynchronous operations and synchronous state updates.

## Project Structure

The application follows a feature-based folder structure with consistent subdirectories:

```
src/app/
├── home/                    # Feature: Home page
│   └── ui/                  # Dumb/presentational components
├── checklist/               # Feature: Checklist detail page
│   ├── ui/                  # Dumb components
│   └── data-access/         # Feature-specific services
└── shared/                  # Shared across features
    ├── interfaces/          # TypeScript interfaces and DTOs
    ├── data-access/         # Shared services
    ├── ui/                  # Shared dumb components
    └── operators/           # Custom RxJS operators
```

Each feature folder can contain:
- `ui/` - Presentational components
- `data-access/` - Services and state management
- `utils/` - Helper functions and utilities

Shared code lives in `shared/` with the same structure.

## Additional Patterns

**DTO Validation**: DTOs use `any` types to create honest trust boundaries. External API data enters as untrusted `any`, gets validated through [mappers](src/app/shared/interfaces/checklist.ts#L22-L37), then becomes strongly-typed domain models.

**Custom Operators**: Reusable RxJS operators like [`catchErrorWithMessage`](src/app/shared/operators/catch-error-with-message.operator.ts) eliminate code duplication and standardize error handling across the application.

## Credits

This architecture is based on principles taught by **[Joshua Morony](https://www.joshuamorony.com/)** in his Angular courses, particularly his approach to reactive programming with signals and observables.

## Getting Started

**Prerequisites**: Node.js and Angular CLI (`npm install -g @angular/cli`)

```bash
# Install dependencies
npm install

# Start development server
ng serve

# Navigate to http://localhost:4200
```

The app connects to a backend API at `http://localhost:5000` (configurable in [`environment.ts`](src/environments/environment.development.ts)).
