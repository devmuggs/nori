/**
 * EXAMPLE COMPONENT: Demonstrates Zustand Best Practices
 *
 * This file shows real-world usage patterns you can copy to your actual components
 */

import { useCallback, useState } from "react";
import {
	useActiveProject,
	useProjectById,
	useProjects,
	useWorkspaceActions,
	useWorkspaceName,
	useWorkspaceStore
} from "./workspace-store";
import type { Project } from "./workspace-types";

// ============================================================================
// EXAMPLE 1: Simple component with single selector
// ============================================================================
export function WorkspaceTitle() {
	// ✅ Only re-renders when name changes
	const name = useWorkspaceName();

	return <div className="text-2xl font-bold">{name || "Unnamed Workspace"}</div>;
}

// ============================================================================
// EXAMPLE 2: Component with actions only (no state)
// ============================================================================
export function AddProjectButton() {
	const { addProject } = useWorkspaceActions();
	const [isLoading, setIsLoading] = useState(false);

	const handleAdd = async () => {
		setIsLoading(true);
		try {
			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 500));

			const newProject: Project = {
				id: crypto.randomUUID(),
				name: `Project ${Date.now()}`,
				description: "New project description"
			};

			addProject(newProject);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<button onClick={handleAdd} disabled={isLoading}>
			{isLoading ? "Adding..." : "Add Project"}
		</button>
	);
}

// ============================================================================
// EXAMPLE 3: List component with efficient re-rendering
// ============================================================================
export function ProjectList() {
	const projects = useProjects();
	const { removeProject, setActiveProject } = useWorkspaceActions();
	const activeProject = useActiveProject();

	return (
		<div className="space-y-2">
			{projects.length === 0 ? (
				<p className="text-gray-500">No projects yet</p>
			) : (
				projects.map((project) => (
					<ProjectItem
						key={project.id}
						projectId={project.id}
						isActive={project.id === activeProject?.id}
						onActivate={() => setActiveProject(project.id)}
						onRemove={() => removeProject(project.id)}
					/>
				))
			)}
		</div>
	);
}

// ============================================================================
// EXAMPLE 4: Optimized child component using specific selector
// ============================================================================
interface ProjectItemProps {
	projectId: string;
	isActive: boolean;
	onActivate: () => void;
	onRemove: () => void;
}

function ProjectItem({ projectId, isActive, onActivate, onRemove }: ProjectItemProps) {
	// ✅ Only this item re-renders when its project changes
	const project = useProjectById(projectId);

	if (!project) return null;

	return (
		<div
			className={`p-4 border rounded ${isActive ? "border-blue-500" : "border-gray-200"}`}
			onClick={onActivate}
		>
			<h3 className="font-semibold">{project.name}</h3>
			<button
				onClick={(e) => {
					e.stopPropagation();
					onRemove();
				}}
				className="text-red-500 text-sm"
			>
				Delete
			</button>
		</div>
	);
}

// ============================================================================
// EXAMPLE 5: Multiple selectors with shallow comparison
// ============================================================================
export function WorkspaceHeader() {
	// ✅ Only re-renders when name OR activeProject changes
	const { name, projectCount, activeProjectName } = useWorkspaceStore((state) => ({
		name: state.name,
		projectCount: state.projects.list.length,
		activeProjectName: state.projects.list.find(
			(p: Project) => p.id === state.projects.activeProjectId
		)?.name
	}));

	return (
		<header className="border-b p-4">
			<h1 className="text-2xl">{name}</h1>
			<p className="text-sm text-gray-500">
				{projectCount} projects
				{activeProjectName && ` • Active: ${activeProjectName}`}
			</p>
			<p className="text-xs text-gray-400 mt-1">
				Note: Use shallow comparison from 'zustand/shallow' when you need multiple values
			</p>
		</header>
	);
}

// ============================================================================
// EXAMPLE 6: Filtered/computed state with memoization
// ============================================================================
interface FilteredProjectsProps {
	searchTerm: string;
}

export function FilteredProjects({ searchTerm }: FilteredProjectsProps) {
	// ✅ Memoized selector prevents unnecessary recalculations
	const filteredProjects = useWorkspaceStore(
		useCallback(
			(state) =>
				state.projects.list.filter((project) =>
					project.name.toLowerCase().includes(searchTerm.toLowerCase())
				),
			[searchTerm]
		)
	);

	return (
		<div>
			<p>Found {filteredProjects.length} projects</p>
			{filteredProjects.map((project) => (
				<div key={project.id}>{project.name}</div>
			))}
		</div>
	);
}

// ============================================================================
// EXAMPLE 7: Using store outside React (event handlers, utils)
// Note: Moved to separate utility file to avoid Fast Refresh issues
// ============================================================================

// Example usage - put this in a separate utils file:
/*
export function setupWorkspaceEventListeners() {
	// Access store outside React components
	const unsubscribe = useWorkspaceStore.subscribe(
		(state) => state.projects.list.length
	);
	
	// Manual subscription with callback
	let previousCount = useWorkspaceStore.getState().projects.list.length;
	const unsubscribeManual = useWorkspaceStore.subscribe(() => {
		const currentCount = useWorkspaceStore.getState().projects.list.length;
		if (currentCount !== previousCount) {
			console.log(`Project count changed: ${currentCount}`);
			document.title = `Nori (${currentCount} projects)`;
			previousCount = currentCount;
		}
	});

	// Return cleanup function
	return () => {
		unsubscribe();
		unsubscribeManual();
	};
}
*/

// ============================================================================
// EXAMPLE 8: Async action with error handling
// ============================================================================
export function ProjectSync() {
	const { addProject } = useWorkspaceActions();
	const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
	const [error, setError] = useState<string | null>(null);

	const syncProjects = async () => {
		setStatus("loading");
		setError(null);

		try {
			// Simulate API call
			const response = await fetch("/api/projects");
			if (!response.ok) throw new Error("Failed to fetch projects");

			const projects: Project[] = await response.json();

			// Batch update
			projects.forEach((project) => addProject(project));

			setStatus("success");
		} catch (err) {
			setStatus("error");
			setError(err instanceof Error ? err.message : "Unknown error");
		}
	};

	return (
		<div>
			<button onClick={syncProjects} disabled={status === "loading"}>
				{status === "loading" ? "Syncing..." : "Sync Projects"}
			</button>
			{status === "error" && <p className="text-red-500 text-sm">{error}</p>}
			{status === "success" && <p className="text-green-500 text-sm">Synced successfully!</p>}
		</div>
	);
}

// ============================================================================
// EXAMPLE 9: Optimistic updates
// ============================================================================
export function ProjectEditor({ projectId }: { projectId: string }) {
	const { editProject } = useWorkspaceActions();
	const project = useProjectById(projectId);
	const [localName, setLocalName] = useState(project?.name || "");

	const handleSave = async () => {
		if (!project) return;

		// Optimistic update
		const originalName = project.name;
		editProject(projectId, { name: localName });

		try {
			// Simulate API call
			await fetch(`/api/projects/${projectId}`, {
				method: "PATCH",
				body: JSON.stringify({ name: localName })
			});
		} catch {
			// Rollback on error
			editProject(projectId, { name: originalName });
			alert("Failed to save. Changes reverted.");
		}
	};

	if (!project) return null;

	return (
		<div>
			<input
				value={localName}
				onChange={(e) => setLocalName(e.target.value)}
				className="border rounded px-2 py-1"
			/>
			<button onClick={handleSave}>Save</button>
		</div>
	);
}

// ============================================================================
// EXAMPLE 10: Direct state access (non-reactive)
// Note: This is a utility function - in real code, move to separate file
// ============================================================================

// Example - put this in a separate utils file to avoid Fast Refresh warnings
/*
export function exportWorkspaceData() {
	// Get current state without subscribing
	const state = useWorkspaceStore.getState();

	const data = {
		name: state.name,
		projects: state.projects.list,
		exportedAt: new Date().toISOString(),
	};

	const blob = new Blob([JSON.stringify(data, null, 2)], {
		type: "application/json",
	});
	const url = URL.createObjectURL(blob);

	const a = document.createElement("a");
	a.href = url;
	a.download = `workspace-${Date.now()}.json`;
	a.click();

	URL.revokeObjectURL(url);
}
*/

export function ExportButton() {
	const handleExport = () => {
		const state = useWorkspaceStore.getState();
		const data = {
			name: state.name,
			projects: state.projects.list,
			exportedAt: new Date().toISOString()
		};

		const blob = new Blob([JSON.stringify(data, null, 2)], {
			type: "application/json"
		});
		const url = URL.createObjectURL(blob);

		const a = document.createElement("a");
		a.href = url;
		a.download = `workspace-${Date.now()}.json`;
		a.click();

		URL.revokeObjectURL(url);
	};

	return <button onClick={handleExport}>Export Workspace</button>;
}
