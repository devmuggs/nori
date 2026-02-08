# Zustand Best Practices Guide

## Table of Contents

1. [Component Usage Patterns](#component-usage-patterns)
2. [Performance Optimization](#performance-optimization)
3. [Middleware Stack](#middleware-stack)
4. [Testing](#testing)
5. [Common Pitfalls](#common-pitfalls)
6. [Advanced Patterns](#advanced-patterns)

## Component Usage Patterns

### ✅ GOOD: Use Specific Selectors

```tsx
// Only re-renders when name changes
function WorkspaceTitle() {
	const name = useWorkspaceName();
	return <h1>{name}</h1>;
}

// Only re-renders when projects list changes
function ProjectList() {
	const projects = useProjects();
	const { addProject, removeProject } = useWorkspaceActions();

	return (
		<div>
			{projects.map((project) => (
				<div key={project.id}>
					{project.name}
					<button onClick={() => removeProject(project.id)}>Delete</button>
				</div>
			))}
		</div>
	);
}
```

### ❌ BAD: Select Entire Store

```tsx
// Re-renders on ANY state change!
function MyComponent() {
	const store = useWorkspaceStore(); // Don't do this
	return <div>{store.name}</div>;
}
```

### ✅ GOOD: Select Multiple Values Efficiently

```tsx
import { shallow } from "zustand/shallow";

function WorkspaceHeader() {
	// Only re-renders when name OR activeProject changes
	const { name, activeProject } = useWorkspaceStore(
		(state) => ({
			name: state.name,
			activeProject: state.projects.list.find((p) => p.id === state.projects.activeProjectId)
		}),
		shallow // Compare by shallow equality
	);

	return (
		<header>
			<h1>{name}</h1>
			{activeProject && <span>Active: {activeProject.name}</span>}
		</header>
	);
}
```

## Performance Optimization

### 1. Selector Memoization

```tsx
// ❌ BAD: Creates new array every render
function FilteredProjects({ filter }: { filter: string }) {
	const filtered = useProjects().filter((p) => p.name.includes(filter));
	return <div>{filtered.length} projects</div>;
}

// ✅ GOOD: Memoize the selector
function FilteredProjects({ filter }: { filter: string }) {
	const filtered = useWorkspaceStore(
		useCallback(
			(state) =>
				state.projects.list.filter((p) =>
					p.name.toLowerCase().includes(filter.toLowerCase())
				),
			[filter]
		)
	);
	return <div>{filtered.length} projects</div>;
}
```

### 2. Transient Updates (No Re-renders)

```tsx
// For high-frequency updates (e.g., mouse position, scroll)
function Canvas() {
	const storeRef = useRef(useWorkspaceStore.getState());

	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			// Update store without triggering re-renders
			useWorkspaceStore.setState({ mouseX: e.clientX, mouseY: e.clientY }, true);
		};

		window.addEventListener("mousemove", handleMouseMove);
		return () => window.removeEventListener("mousemove", handleMouseMove);
	}, []);
}
```

## Middleware Stack

### Order Matters!

```tsx
// ✅ CORRECT ORDER (outside to inside):
// 1. devtools (outermost - wraps everything)
// 2. persist (middle - persists immer state)
// 3. immer (innermost - simplifies updates)

create<State>()(
	devtools(
		persist(
			immer((set) => ({
				// ...
			})),
			{ name: "storage-key" }
		),
		{ name: "DevTools Name" }
	)
);
```

### DevTools Options

```tsx
devtools(
	// ... store
	{
		name: "WorkspaceStore", // Shows in Redux DevTools
		enabled: process.env.NODE_ENV !== "production", // Disable in prod
		anonymousActionType: "workspace-action" // Default action name
	}
);
```

### Persist Options

```tsx
persist(
	// ... store
	{
		name: "workspace-storage",
		storage: createJSONStorage(() => localStorage),

		// Only persist specific fields
		partialize: (state) => ({
			name: state.name,
			projects: state.projects
		}),

		// Version for migrations
		version: 1,
		migrate: (persistedState: any, version: number) => {
			if (version === 0) {
				// Migrate from v0 to v1
				persistedState.newField = "default";
			}
			return persistedState;
		},

		// Handle rehydration
		onRehydrateStorage: () => (state) => {
			console.log("Hydration finished", state);
		}
	}
);
```

## Testing

### Setup Test Utilities

```tsx
// utils/test-utils.tsx
import { ReactNode } from "react";
import { useWorkspaceStore } from "../workspace-store";

export function resetStores() {
	useWorkspaceStore.getState().reset();
}

// Create isolated store instance for testing
export function createMockStore(initialState: Partial<WorkspaceState>) {
	const store = useWorkspaceStore;
	store.setState(initialState, true);
	return store;
}
```

### Component Tests

```tsx
// workspace-store.test.tsx
import { renderHook, act } from "@testing-library/react";
import { useWorkspaceStore, useProjects } from "./workspace-store";

describe("WorkspaceStore", () => {
	beforeEach(() => {
		useWorkspaceStore.getState().reset();
	});

	it("adds project correctly", () => {
		const { result } = renderHook(() => ({
			projects: useProjects(),
			actions: useWorkspaceActions()
		}));

		act(() => {
			result.current.actions.addProject({
				id: "1",
				name: "Test Project",
				createdAt: Date.now()
			});
		});

		expect(result.current.projects).toHaveLength(1);
		expect(result.current.projects[0].name).toBe("Test Project");
	});

	it("removes project and clears active if needed", () => {
		const { result } = renderHook(() => useWorkspaceStore());

		act(() => {
			result.current.addProject({ id: "1", name: "Project 1" });
			result.current.setActiveProject("1");
			result.current.removeProject("1");
		});

		expect(result.current.projects.list).toHaveLength(0);
		expect(result.current.projects.activeProjectId).toBeNull();
	});
});
```

### Integration Tests

```tsx
// MyComponent.test.tsx
import { render, screen } from "@testing-library/react";
import { useWorkspaceStore } from "./workspace-store";
import { ProjectList } from "./ProjectList";

describe("ProjectList", () => {
	beforeEach(() => {
		useWorkspaceStore.getState().reset();
	});

	it("displays projects from store", () => {
		useWorkspaceStore.getState().addProject({
			id: "1",
			name: "Test Project"
		});

		render(<ProjectList />);
		expect(screen.getByText("Test Project")).toBeInTheDocument();
	});
});
```

## Common Pitfalls

### ❌ Pitfall 1: Storing Derived State

```tsx
// BAD: Storing computed values
interface BadState {
	projects: Project[];
	projectCount: number; // ❌ This is derived!
	activeProject: Project | null; // ❌ Can be computed!
}

// GOOD: Compute on demand
interface GoodState {
	projects: {
		list: Project[];
		activeProjectId: string | null;
	};
}

// Use selectors
const useProjectCount = () => useProjects().length;
const useActiveProject = () => {
	const { activeProjectId, list } = useWorkspaceStore((s) => s.projects);
	return list.find((p) => p.id === activeProjectId) ?? null;
};
```

### ❌ Pitfall 2: Mutating State Without Immer

```tsx
// Without immer middleware:
set((state) => {
	state.projects.list.push(newProject); // ❌ Direct mutation!
	return state;
});

// Correct without immer:
set((state) => ({
	...state,
	projects: {
		...state.projects,
		list: [...state.projects.list, newProject]
	}
}));

// With immer middleware (as in our store):
set((state) => {
	state.projects.list.push(newProject); // ✅ Immer handles immutability
});
```

### ❌ Pitfall 3: Async Actions Without Error Handling

```tsx
// BAD: No error handling
const fetchProjects = async () => {
	set({ loading: true });
	const projects = await api.getProjects();
	set({ projects, loading: false });
};

// GOOD: Proper error handling
const fetchProjects = async () => {
	set({ loading: true, error: null });
	try {
		const projects = await api.getProjects();
		set({ projects, loading: false });
	} catch (error) {
		set({
			error: error instanceof Error ? error.message : "Unknown error",
			loading: false
		});
	}
};
```

## Advanced Patterns

### 1. Store Slicing (Multiple Stores)

```tsx
// user-store.ts - Separate concern
export const useUserStore = create<UserState>()(
	persist(
		(set) => ({
			user: null,
			setUser: (user) => set({ user }),
			logout: () => set({ user: null })
		}),
		{ name: "user-storage" }
	)
);

// In components, use both:
function Dashboard() {
	const userName = useUserStore((s) => s.user?.name);
	const projectCount = useProjects().length;

	return (
		<div>
			{userName} has {projectCount} projects
		</div>
	);
}
```

### 2. Subscriptions for Side Effects

```tsx
// Subscribe to store changes outside React
useWorkspaceStore.subscribe(
	(state) => state.projects.list,
	(projects) => {
		// Runs when projects change
		console.log("Projects updated:", projects);
		analytics.track("projects-changed", { count: projects.length });
	}
);
```

### 3. Computed Selectors with Dependencies

```tsx
// Create a memoized selector
export const useProjectsByStatus = (status: string) =>
	useWorkspaceStore(
		useCallback((state) => state.projects.list.filter((p) => p.status === status), [status])
	);
```

### 4. Optimistic Updates

```tsx
const updateProject = async (id: string, data: Partial<Project>) => {
	const { editProject, projects } = useWorkspaceStore.getState();
	const originalProject = projects.list.find((p) => p.id === id);

	// Optimistic update
	editProject(id, data);

	try {
		await api.updateProject(id, data);
	} catch (error) {
		// Rollback on error
		if (originalProject) {
			editProject(id, originalProject);
		}
		throw error;
	}
};
```

### 5. Middleware Composition

```tsx
// Create custom middleware
const logger = (config) => (set, get, api) =>
	config(
		(...args) => {
			console.log("Before:", get());
			set(...args);
			console.log("After:", get());
		},
		get,
		api
	);

// Use it
export const useStore = create(
	logger(
		devtools(
			persist(
				immer((set) => ({
					/* ... */
				})),
				{ name: "storage" }
			)
		)
	)
);
```

## Production Checklist

- [ ] Use devtools middleware (disabled in production)
- [ ] Use immer middleware for complex state
- [ ] Use persist middleware with partialize
- [ ] Separate state interface from actions
- [ ] Create selector hooks for common queries
- [ ] Use shallow equality for multi-value selectors
- [ ] Don't store derived state
- [ ] Handle async actions with loading/error states
- [ ] Write tests for all actions
- [ ] Set up proper TypeScript types
- [ ] Document store structure and usage

## Key Takeaways

1. **Small Selectors**: Select only what you need
2. **Immer for Simplicity**: Write "mutable" code safely
3. **Middleware Order**: devtools → persist → immer
4. **Test Everything**: Zustand stores are easy to test
5. **Keep It Simple**: Don't over-engineer
6. **Performance**: Use shallow comparison and memoization
7. **TypeScript**: Strong types prevent bugs
8. **Store Slicing**: Multiple stores for separation of concerns

---

**Pro Tip**: Use Redux DevTools to debug Zustand stores - it's incredibly powerful for understanding state changes in production!
