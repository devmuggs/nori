# Zustand Quick Reference Cheat Sheet

## 📦 Installation

```bash
pnpm add zustand immer
```

## 🎯 Basic Store Creation

```tsx
import { create } from "zustand";

interface Store {
	count: number;
	increment: () => void;
}

export const useStore = create<Store>((set) => ({
	count: 0,
	increment: () => set((state) => ({ count: state.count + 1 }))
}));
```

## 🎣 Using in Components

```tsx
// Select single value
const count = useStore((state) => state.count);

// Select multiple with shallow
const { count, increment } = useStore(
	(state) => ({ count: state.count, increment: state.increment }),
	shallow
);

// Use entire store (⚠️ avoid - re-renders on any change)
const store = useStore();
```

## 🔧 Middleware Stack

```tsx
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export const useStore = create<Store>()(
	devtools(
		// ← Outermost
		persist(
			// ← Middle
			immer((set) => ({
				// ← Innermost
				// state here
			})),
			{ name: "storage-key" }
		),
		{ name: "DevTools Name" }
	)
);
```

## ✏️ Updating State

### Without Immer

```tsx
set((state) => ({
	...state,
	nested: {
		...state.nested,
		value: newValue
	}
}));
```

### With Immer

```tsx
set((state) => {
	state.nested.value = newValue; // Direct mutation!
});
```

## 🎯 Best Practices

### ✅ DO

- Use specific selectors
- Separate state from actions
- Use immer for complex updates
- Create selector hooks
- Write tests
- Use devtools in development
- Handle async errors

### ❌ DON'T

- Store derived state
- Select entire store
- Mutate without immer
- Store actions in nested objects
- Forget error handling in async

## 📊 Selector Patterns

```tsx
// Custom hook selector
export const useActiveProject = () =>
	useStore((state) => state.projects.find((p) => p.id === state.activeId));

// Filtered selector with deps
export const useFilteredItems = (filter: string) =>
	useStore(useCallback((state) => state.items.filter((i) => i.name.includes(filter)), [filter]));

// Multiple values with shallow
const { name, count } = useStore(
	(state) => ({ name: state.name, count: state.items.length }),
	shallow
);
```

## 🔄 Outside React

```tsx
// Get current state
const state = useStore.getState();

// Set state
useStore.setState({ count: 5 });

// Subscribe to changes
const unsub = useStore.subscribe(
	(state) => state.count,
	(count) => console.log("Count:", count)
);

// Cleanup
unsub();
```

## 🧪 Testing

```tsx
// Reset before tests
beforeEach(() => {
	useStore.setState(initialState, true);
});

// Test action
it("increments count", () => {
	const { result } = renderHook(() => useStore());

	act(() => {
		result.current.increment();
	});

	expect(result.current.count).toBe(1);
});
```

## 📝 TypeScript Tips

```tsx
// Separate interfaces
interface StoreData {
	count: number;
}

interface StoreActions {
	increment: () => void;
}

type Store = StoreData & StoreActions;

// Initial state
const initial: StoreData = {
	count: 0
};

// Create store
export const useStore = create<Store>()((set) => ({
	...initial,
	increment: () => set((s) => ({ count: s.count + 1 }))
}));
```

## 🚀 Performance Tips

```tsx
// ✅ GOOD: Specific selector
const name = useStore((s) => s.user.name);

// ❌ BAD: Selecting object creates new reference
const user = useStore((s) => s.user); // Re-renders always

// ✅ GOOD: Use shallow for objects
const user = useStore((s) => s.user, shallow);

// ✅ GOOD: Memoize computed values
const total = useStore(useCallback((s) => s.items.reduce((sum, i) => sum + i.price, 0), []));
```

## 🎨 Common Patterns

### Async Actions

```tsx
const fetchData = async () => {
	set({ loading: true, error: null });
	try {
		const data = await api.fetch();
		set({ data, loading: false });
	} catch (error) {
		set({ error: error.message, loading: false });
	}
};
```

### Optimistic Updates

```tsx
const update = async (id: string, data: Data) => {
	const original = get().items.find((i) => i.id === id);

	// Optimistic
	set((s) => ({
		items: s.items.map((i) => (i.id === id ? { ...i, ...data } : i))
	}));

	try {
		await api.update(id, data);
	} catch {
		// Rollback
		if (original) {
			set((s) => ({
				items: s.items.map((i) => (i.id === id ? original : i))
			}));
		}
	}
};
```

### Computed Selectors

```tsx
// Bad: Always recomputes
const total = useStore((s) => s.items.reduce((sum, i) => sum + i.price, 0));

// Good: Only when items change
const useTotal = () => useStore((s) => s.items.reduce((sum, i) => sum + i.price, 0));
```

## 🔗 Useful Links

- [Zustand Docs](https://github.com/pmndrs/zustand)
- [Immer Docs](https://immerjs.github.io/immer/)
- [Redux DevTools](https://github.com/reduxjs/redux-devtools)

## 💡 Pro Tips

1. **Name your stores** in devtools for easy debugging
2. **Use partialize** to only persist necessary data
3. **Split stores** by domain (user, workspace, settings)
4. **Shallow compare** when selecting multiple values
5. **Test actions** separately from components
6. **Version your storage** for migrations
7. **Enable devtools** only in development
8. **Subscribe outside React** for analytics/side effects
