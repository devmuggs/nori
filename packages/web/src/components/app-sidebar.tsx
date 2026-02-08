import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupAction,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarSeparator
} from "@/components/ui/sidebar";
import { Edit, Plus, RotateCcw, Trash } from "lucide-react";

import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger
} from "@/components/ui/context-menu";
import { ConnectionStatus, useDaemon } from "@/lib/daemon-service";
import clsx from "clsx";
import { useState } from "react";
import { ThemeToggle } from "./theme/theme-toggle";
import { Button } from "./ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from "./ui/dialog";
import { ProjectForm, useProjectForm } from "./workspace/projects";
import { WatchedFilePreview } from "./workspace/projects/project-details";
import {
	useActiveProject,
	useProjects,
	useWorkspaceActions,
	useWorkspaceName
} from "./workspace/workspace-store";

const EditContextMenuItem = ({ ...props }: React.ComponentProps<typeof ContextMenuItem>) => {
	return (
		<ContextMenuItem {...props} className="flex items-center gap-2">
			<Edit /> Edit
		</ContextMenuItem>
	);
};

const DeleteContextMenuItem = ({ ...props }: React.ComponentProps<typeof ContextMenuItem>) => {
	return (
		<ContextMenuItem {...props} className="flex items-center gap-2">
			<Trash /> Remove
		</ContextMenuItem>
	);
};

export function AppSidebar() {
	const daemon = useDaemon();
	const workspaceName = useWorkspaceName();
	const projects = useProjects();

	const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);

	const activeProject = useActiveProject();
	const { addProject, editProject, setActiveProject, removeProject } = useWorkspaceActions();

	const projectFormControls = useProjectForm({
		onCancel: () => setIsProjectFormOpen(false),
		onSubmit: (project) => {
			if (!projectFormControls.values.id) {
				addProject(project);
			} else {
				editProject(project.id, project);
			}

			setIsProjectFormOpen(false);
			setActiveProject(project.id);
		}
	});

	return (
		<>
			<Sidebar>
				<SidebarHeader>
					<SidebarMenu>
						<SidebarMenuItem>
							<h1 className="p-2">{workspaceName || "Nori"}</h1>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarHeader>
				<SidebarContent>
					<SidebarGroup>
						<SidebarGroupLabel className="">Projects</SidebarGroupLabel>
						<SidebarGroupAction
							onClick={() => {
								setIsProjectFormOpen(true);
								projectFormControls.reset();
							}}
						>
							<Plus /> <span className="sr-only">Add Project</span>
						</SidebarGroupAction>
						<SidebarGroupContent>
							{projects.length === 0 ? (
								<span className="text-xs text-muted-foreground">
									No projects found. Click the + button to add one.
								</span>
							) : null}

							{projects.map((project, index) => {
								const isActive = activeProject?.id === project.id;
								return (
									<ContextMenu key={index}>
										<ContextMenuTrigger>
											<SidebarMenu key={index}>
												<SidebarMenuItem>
													<SidebarMenuButton
														onClick={() => setActiveProject(project.id)}
														tooltip={project.description}
														className="h-12 my-1"
													>
														<div className="flex gap-2">
															{project.configuration
																.thumbnailPath && (
																<WatchedFilePreview
																	className="size-8 bg-white/50 p-1"
																	filePath={
																		project.configuration
																			.thumbnailPath
																	}
																/>
															)}
															<div
																className={clsx(
																	"flex flex-col overflow-hidden",
																	{
																		"text-muted-foreground":
																			!isActive,
																		"font-medium": isActive
																	}
																)}
															>
																<span>{project.name}</span>
																<span
																	className={clsx(
																		"truncate text-muted-foreground text-xs"
																	)}
																>
																	{project.description}
																</span>
															</div>
														</div>
													</SidebarMenuButton>
												</SidebarMenuItem>
											</SidebarMenu>
											<ContextMenuContent>
												<EditContextMenuItem
													onSelect={() => {
														setIsProjectFormOpen(true);
														projectFormControls.reset(project);
													}}
												/>
												<DeleteContextMenuItem
													onSelect={() => {
														removeProject(project.id);
													}}
												/>
											</ContextMenuContent>
										</ContextMenuTrigger>
									</ContextMenu>
								);
							})}
						</SidebarGroupContent>
					</SidebarGroup>
					<SidebarGroup />
				</SidebarContent>
				<SidebarFooter>
					<SidebarMenu>
						<SidebarMenuItem className="flex justify-between">
							<SidebarMenuButton>Local User</SidebarMenuButton>
							<ThemeToggle />
						</SidebarMenuItem>
					</SidebarMenu>
					<SidebarSeparator />
					<SidebarMenu>
						<div
							className={clsx(
								"flex gap-2 items-center text-muted-foreground px-2",
								!daemon || daemon.connectionStatus === ConnectionStatus.Connecting
									? "animate-pulse"
									: ""
							)}
						>
							<div
								className={clsx(
									"w-2 h-2 rounded-full",
									{
										"bg-green-600":
											daemon?.connectionStatus === ConnectionStatus.Connected,
										"bg-yellow-600":
											daemon?.connectionStatus ===
											ConnectionStatus.Connecting,
										"bg-red-600":
											daemon?.connectionStatus === ConnectionStatus.Error ||
											daemon?.connectionStatus ===
												ConnectionStatus.Disconnected
									},
									!daemon ? "bg-gray-600" : ""
								)}
							/>
							<span className={"text-sm text-muted-foreground truncate w-full"}>
								{
									{
										[ConnectionStatus.Connecting]: "daemon connecting",
										[ConnectionStatus.Connected]: "daemon connected",
										[ConnectionStatus.Disconnected]: "daemon disconnected",
										[ConnectionStatus.Error]:
											"daemon connection error very long error to test the truncation"
									}[daemon?.connectionStatus || ConnectionStatus.Disconnected]
								}
							</span>
							{daemon && daemon.connectionStatus === ConnectionStatus.Error ? (
								<RotateCcw
									className="size-4 cursor-pointer hover:text-primary ml-auto"
									onClick={() => {
										// Forcing a re-check of the daemon connection
										window.location.reload();
									}}
								/>
							) : null}
						</div>
					</SidebarMenu>
				</SidebarFooter>
			</Sidebar>
			<Dialog open={isProjectFormOpen} onOpenChange={setIsProjectFormOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{projectFormControls.values.id ? "Edit Project" : "Add New Project"}
						</DialogTitle>
						<DialogDescription>
							{projectFormControls.values.id
								? `Edit project "${projectFormControls.values.name}".`
								: `Add a new project to ${workspaceName || "your workspace"}.`}
						</DialogDescription>
					</DialogHeader>
					<ProjectForm controls={projectFormControls} />
					<DialogFooter>
						<DialogClose asChild>
							<Button type="button">Close</Button>
						</DialogClose>
						<DialogClose asChild>
							<Button
								type="submit"
								disabled={!projectFormControls.values.name}
								onClick={projectFormControls.handleSubmit}
							>
								{projectFormControls.values.id ? "Save Changes" : "Add Project"}
							</Button>
						</DialogClose>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
