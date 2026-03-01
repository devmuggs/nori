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
import { ChevronsUpDown, Edit, LogOut, Plus, RotateCcw, Trash, User } from "lucide-react";

import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger
} from "@/components/ui/context-menu";
import { ConnectionStatus, noriSdk, useDaemon } from "@/lib/daemon-service";
import clsx from "clsx";
import { useState } from "react";
import { Theme, ThemeConfig } from "./theme/theme-enum";
import { useTheme } from "./theme/theme-provider";
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
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger
} from "./ui/dropdown-menu";
import { FieldGroup, FieldLabel } from "./ui/field";
import { Input } from "./ui/input";
import LoginForm from "./user/login-form";
import RegistrationForm from "./user/registration-form";
import UserEditForm from "./user/user-edit-form";
import { clearUser, setUser, useUser } from "./user/user-store";
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

const Avatar = () => {
	const user = useUser();
	if (!user) return null;
	return (
		<div className="flex gap-2 items-center">
			<User className="size-8" />

			<div className="flex flex-col leading-tight text-sm text-left">
				<span className="truncate font-medium">
					{user.displayName ?? user.email.split("@")[0]}
				</span>
				{user.displayName && (
					<span className="truncate text-xs text-muted-foreground">
						{user?.email ?? "No email"}
					</span>
				)}
			</div>
		</div>
	);
};

export function AppSidebar() {
	const daemon = useDaemon();
	const workspaceName = useWorkspaceName();
	const projects = useProjects();
	const { theme, setTheme } = useTheme();
	const user = useUser();

	const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
	const [isRegistrationFormOpen, setIsRegistrationFormOpen] = useState(false);
	const [isLoginFormOpen, setIsLoginFormOpen] = useState(false);
	const [isUserEditFormOpen, setIsUserEditFormOpen] = useState(false);
	const [isDeletingUser, setIsDeletingUser] = useState(false);
	const [deletionConfirmInput, setDeletionConfirmInput] = useState("");
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
							<div className="flex justify-between gap-2">
								<h1 className="p-2">{workspaceName || "Nori"}</h1>
								<ThemeToggle />
							</div>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarHeader>
				<SidebarContent>
					<SidebarGroup>
						<SidebarMenu>
							<SidebarMenuItem></SidebarMenuItem>
						</SidebarMenu>
					</SidebarGroup>
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
						{user ? (
							<SidebarMenuItem>
								<DropdownMenu>
									<DropdownMenuTrigger className="flex justify-between w-full items-center">
										<Avatar />
										<ChevronsUpDown className="ml-auto size-4" />
									</DropdownMenuTrigger>
									<DropdownMenuContent
										className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
										side={"right"}
										align="end"
										sideOffset={12}
									>
										<DropdownMenuGroup>
											<DropdownMenuItem
												onClick={() => setIsUserEditFormOpen(true)}
											>
												<Edit />
												Edit Profile
											</DropdownMenuItem>
											<DropdownMenuSub>
												<DropdownMenuSubTrigger className="justify-between w-full">
													<div className="flex items-center gap-2">
														<i>{ThemeConfig[theme].icon}</i>
														<span>Theme</span>
													</div>
												</DropdownMenuSubTrigger>
												<DropdownMenuSubContent>
													{(
														[
															Theme.Light,
															Theme.Dark,
															Theme.System
														] as const
													).map((themeOption) => (
														<DropdownMenuItem
															key={themeOption}
															onClick={() => setTheme(themeOption)}
															className="flex items-center gap-2"
														>
															<i>{ThemeConfig[themeOption].icon}</i>
															{ThemeConfig[themeOption].name}
														</DropdownMenuItem>
													))}
												</DropdownMenuSubContent>
											</DropdownMenuSub>
										</DropdownMenuGroup>
										<DropdownMenuSeparator />
										<DropdownMenuGroup>
											<DropdownMenuItem
												onClick={() => {
													noriSdk.auth.logout().then(() => clearUser());
												}}
											>
												<LogOut />
												Log out
											</DropdownMenuItem>
										</DropdownMenuGroup>
										<DropdownMenuSeparator />
										<DropdownMenuItem
											className="text-destructive hover:bg-destructive/10! hover:text-destructive!"
											onClick={() => {
												setIsDeletingUser(true);
											}}
										>
											<Trash className="text-destructive" />
											Delete Account
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</SidebarMenuItem>
						) : (
							<SidebarMenuItem>
								<div className="flex gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => setIsLoginFormOpen(true)}
										className="grow"
									>
										Log in
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={() => setIsRegistrationFormOpen(true)}
										className="grow"
									>
										Register
									</Button>
								</div>
							</SidebarMenuItem>
						)}
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
										[ConnectionStatus.Connecting]: "connecting to nori server",
										[ConnectionStatus.Connected]: "connected to nori server",
										[ConnectionStatus.Disconnected]:
											"disconnected from nori server",
										[ConnectionStatus.Error]: "error connecting to nori server"
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
			<Dialog open={isLoginFormOpen} onOpenChange={setIsLoginFormOpen}>
				<DialogContent>
					<DialogTitle> User Login </DialogTitle>
					<LoginForm
						onLoginSuccess={(user) => {
							setUser(user);
							setIsLoginFormOpen(false);
						}}
					/>
				</DialogContent>
			</Dialog>
			<Dialog open={isRegistrationFormOpen} onOpenChange={setIsRegistrationFormOpen}>
				<DialogContent>
					<DialogTitle> User Registration </DialogTitle>
					<RegistrationForm
						onRegisterSuccess={(user) => {
							setUser(user);
							setIsRegistrationFormOpen(false);
						}}
					/>
				</DialogContent>
			</Dialog>
			{user && (
				<Dialog open={isUserEditFormOpen} onOpenChange={setIsUserEditFormOpen}>
					<DialogContent>
						<DialogTitle> Edit User </DialogTitle>
						<UserEditForm
							user={user}
							onUpdateSuccess={(user) => {
								setUser(user);
								setIsUserEditFormOpen(false);
							}}
						/>
					</DialogContent>
				</Dialog>
			)}
			<Dialog open={isDeletingUser} onOpenChange={setIsDeletingUser}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle> Are you sure you want to delete your account? </DialogTitle>
						<DialogDescription>
							This action cannot be undone. All your data will be permanently deleted.
						</DialogDescription>
					</DialogHeader>
					<div>
						<FieldGroup>
							<FieldLabel>
								Please enter your email{" "}
								<code className="bg-accent px-2 rounded-md text-foreground">
									{user?.email}
								</code>{" "}
								to confirm:
							</FieldLabel>
							<Input
								type="text"
								value={deletionConfirmInput}
								onChange={(e) => setDeletionConfirmInput(e.target.value)}
								placeholder="Enter your email address"
							/>
						</FieldGroup>
					</div>
					<DialogFooter>
						<DialogClose asChild>
							<Button variant="outline">Cancel</Button>
						</DialogClose>
						<DialogClose asChild>
							<Button
								disabled={deletionConfirmInput !== user?.email}
								variant="destructive"
								onClick={() => {
									setIsDeletingUser(true);
									noriSdk.auth.deleteCurrentUser().then(() => {
										clearUser();
										setIsDeletingUser(false);
									});
								}}
							>
								Delete Account
							</Button>
						</DialogClose>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
