import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import type { Project } from "./workspace-types";

// ============================================================================
// BEST PRACTICE #1: Separate state interface from actions
// This makes the store structure clearer and easier to test
// ============================================================================

interface WorkspaceData {
	name: string;
	projects: {
		activeProjectId: string | null;
		list: Project[];
	};
}

interface WorkspaceActions {
	setName: (name: string) => void;
	addProject: (project: Project) => void;
	editProject: (id: string, data: Partial<Project>) => void;
	removeProject: (id: string) => void;
	setActiveProject: (projectId: string | null) => void;
	reset: () => void;
}

type WorkspaceState = WorkspaceData & {
	actions: WorkspaceActions;
};

// ============================================================================
// BEST PRACTICE #2: Define initial state separately for reusability
// ============================================================================

const initialState: WorkspaceData = {
	name: "",
	projects: {
		activeProjectId: null,
		list: []
	}
};

// ============================================================================
// BEST PRACTICE #3: Use devtools + immer + persist middleware
// - devtools: Redux DevTools integration for debugging
// - immer: Write "mutating" code that produces immutable updates
// - persist: LocalStorage persistence
// ============================================================================

export const useWorkspaceStore = create<WorkspaceState>()(
	devtools(
		persist(
			immer((set) => ({
				...initialState,
				actions: {
					// Actions using immer for cleaner updates
					setName: (name) =>
						set((state) => {
							state.name = name;
						}),

					addProject: (project) =>
						set((state) => {
							state.projects.list.push(project);
						}),

					editProject: (id, data) =>
						set((state) => {
							const project = state.projects.list.find((p: Project) => p.id === id);
							if (project) {
								Object.assign(project, data);
							}
						}),

					removeProject: (id) =>
						set((state) => {
							state.projects.list = state.projects.list.filter(
								(p: Project) => p.id !== id
							);
							// Clear active project if it's being removed
							if (state.projects.activeProjectId === id) {
								state.projects.activeProjectId = null;
							}
						}),

					setActiveProject: (projectId) =>
						set((state) => {
							state.projects.activeProjectId = projectId;
						}),

					reset: () => set(initialState)
				}
			})),
			{
				name: "workspace-storage",
				storage: createJSONStorage(() => localStorage),
				// Persist only the data, not the actions
				partialize: (state) => ({
					name: state.name,
					projects: state.projects
				})
			}
		),
		{ name: "WorkspaceStore" }
	)
);

// ============================================================================
// BEST PRACTICE #4: Create selector hooks for performance
// Only re-renders when the specific data changes
// ============================================================================

export const useWorkspaceName = () => useWorkspaceStore((state) => state.name);

export const useProjects = () => useWorkspaceStore((state) => state.projects.list);

export const useActiveProject = () =>
	useWorkspaceStore((state) => {
		const { activeProjectId, list } = state.projects;
		return list.find((p) => p.id === activeProjectId) ?? null;
	});

export const useProjectById = (id: string) =>
	useWorkspaceStore((state) => state.projects.list.find((p) => p.id === id));

export const useWorkspaceActions = () => {
	return useWorkspaceStore((s) => s.actions);
};
