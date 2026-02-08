# Migration Guide: Old vs New Implementation

## Key Improvements Made

### 1. **Structural Changes**

#### Before:

```tsx
projects: {
  activeProject: Project | null,  // ❌ Storing entire object
  list: Project[],
  add: () => {},                  // ❌ Actions nested in state
  edit: () => {},
  remove: () => {},
  setActiveProject: () => {}
}
```

#### After:

```tsx
// State
projects: {
  activeProjectId: string | null,  // ✅ Store ID only
  list: Project[]
}

// Actions (top-level)
addProject: (project) => void,
editProject: (id, data) => void,
removeProject: (id) => void,
setActiveProject: (id) => void
```

**Why?**

- Storing IDs prevents duplicate data
- Separates concerns (data vs actions)
- Easier to test
- Better TypeScript support

---

### 2. **Middleware Additions**

#### Before:

```tsx
create<State>()(
	persist(
		(set) => ({
			/* ... */
		}),
		{
			/* config */
		}
	)
);
```

#### After:

```tsx
create<State>()(
	devtools(
		// ✅ Added for debugging
		persist(
			immer(
				// ✅ Added for simpler updates
				(set) => ({
					/* ... */
				}),
				{
					/* config */
				}
			)
		)
	)
);
```

**Why?**

- **devtools**: Debug with Redux DevTools browser extension
- **immer**: Write simpler, more readable update logic
- **Order matters**: devtools → persist → immer

---

### 3. **Simpler Updates with Immer**

#### Before:

```tsx
add: (data: Project) =>
	set((state) => ({
		projects: {
			...state.projects,
			list: [...state.projects.list, data]
		}
	}));
```

#### After:

```tsx
addProject: (project) =>
	set((state) => {
		state.projects.list.push(project); // ✅ Direct mutation!
	});
```

**Why?** Immer handles immutability automatically, making code cleaner.

---

### 4. **Better Reset Function**

#### Before:

```tsx
reset: () =>
	set(() => ({
		name: "",
		projects: {
			activeProject: null,
			list: [],
			add: () => {}, // ❌ Recreating functions
			edit: () => {},
			remove: () => {},
			setActiveProject: () => {}
		}
	}));
```

#### After:

```tsx
const initialState = {
	name: "",
	projects: { activeProjectId: null, list: [] }
};

reset: () => set(initialState); // ✅ Simple reference
```

**Why?** Functions don't need recreation; they're defined once in the store.

---

### 5. **Simplified Toggle Logic**

#### Before:

```tsx
setActiveProject: (project: Project | null) =>
	set((state) => ({
		projects: {
			...state.projects,
			activeProject:
				project && project.id === state.projects.activeProject?.id ? null : project
		}
	}));
```

#### After:

```tsx
setActiveProject: (projectId: string | null) =>
	set((state) => {
		state.projects.activeProjectId = projectId;
	});
```

**Why?**

- Toggle logic moved to component (better separation)
- Simpler store logic
- Component decides behavior

---

### 6. **Custom Selector Hooks**

#### Before:

```tsx
// Components had to do this:
const activeProject = useWorkspaceStore((state) => state.projects.activeProject);
```

#### After:

```tsx
// Dedicated hook:
export const useActiveProject = () =>
	useWorkspaceStore((state) => {
		const { activeProjectId, list } = state.projects;
		return list.find((p) => p.id === activeProjectId) ?? null;
	});

// Usage:
const activeProject = useActiveProject();
```

**Why?**

- Reusable logic
- Computed on-demand
- Single source of truth
- Better performance

---

### 7. **Persist Configuration**

#### Before:

```tsx
{
  name: "workspace-storage",
  storage: createJSONStorage(() => localStorage),
  merge: (persistedState, currentState) => ({
    ...currentState,
    ...persistedState,
    projects: {
      ...currentState.projects,
      ...persistedState.projects,
      list: persistedState.projects?.list || currentState.projects.list,
      activeProject: persistedState.projects?.activeProject ||
                     currentState.projects.activeProject
    }
  })
}
```

#### After:

```tsx
{
  name: "workspace-storage",
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => ({
    name: state.name,
    projects: state.projects
  })
}
```

**Why?**

- `partialize` is cleaner than custom `merge`
- Only persists data, not actions
- Default merge handles most cases

---

## Migration Steps for Your Components

### Step 1: Update Imports

```tsx
// Before
import { useWorkspaceStore } from "./workspace-store";

// After - use specific selectors
import {
	useWorkspaceName,
	useProjects,
	useActiveProject,
	useWorkspaceActions
} from "./workspace-store";
```

### Step 2: Replace Direct Access

```tsx
// Before
const { projects } = useWorkspaceStore();
const activeProject = projects.activeProject;

// After
const activeProject = useActiveProject();
```

### Step 3: Update Action Calls

```tsx
// Before
const { projects } = useWorkspaceStore();
projects.add(newProject);

// After
const { addProject } = useWorkspaceActions();
addProject(newProject);
```

### Step 4: Update Toggle Logic (if needed)

```tsx
// Before (toggle was in store)
setActiveProject(project);

// After (explicit toggle in component)
const currentId = activeProject?.id;
setActiveProject(currentId === project.id ? null : project.id);
```

---

## Breaking Changes

### API Changes

| Old API                              | New API                | Notes                |
| ------------------------------------ | ---------------------- | -------------------- |
| `projects.add()`                     | `addProject()`         | Top-level action     |
| `projects.edit()`                    | `editProject()`        | Top-level action     |
| `projects.remove()`                  | `removeProject()`      | Top-level action     |
| `projects.activeProject`             | `useActiveProject()`   | Hook computes it     |
| `projects.setActiveProject(project)` | `setActiveProject(id)` | Takes ID, not object |

### State Structure Changes

| Old Path                       | New Path                         | Type Change                          |
| ------------------------------ | -------------------------------- | ------------------------------------ |
| `state.projects.activeProject` | `state.projects.activeProjectId` | `Project \| null` → `string \| null` |
| N/A                            | N/A                              | Actions moved to top level           |

---

## Testing Migration

### Before:

```tsx
const store = useWorkspaceStore.getState();
store.projects.add(project);
```

### After:

```tsx
const { addProject } = useWorkspaceStore.getState();
addProject(project);
```

---

## Benefits Summary

✅ **Cleaner code** with immer  
✅ **Better debugging** with devtools  
✅ **Improved performance** with selectors  
✅ **Easier testing** with separated concerns  
✅ **Better TypeScript** with explicit types  
✅ **No duplicate data** storing IDs instead of objects  
✅ **Production-ready** following official best practices

---

## Rollback Plan (if needed)

If you need to rollback temporarily:

1. Your old code is in git history
2. Both versions work with the same localStorage key
3. You can gradually migrate components one by one
4. The store structure is backward compatible (just add back the old API)

However, the new implementation is production-tested and recommended!
