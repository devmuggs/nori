import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./App.css";
import { AppSidebar } from "./components/app-sidebar";
import { ThemeProvider } from "./components/theme/theme-provider";
import { SidebarProvider, SidebarTrigger } from "./components/ui/sidebar";
import { TooltipProvider } from "./components/ui/tooltip";
import { ProjectDetails } from "./components/workspace/projects/project-details";

const queryClient = new QueryClient();

function App() {
	return (
		<div className="font-sans min-h-screen bg-background text-foreground">
			<QueryClientProvider client={queryClient}>
				<ThemeProvider>
					<TooltipProvider>
						<SidebarProvider>
							<AppSidebar />
							<main className="flex grow">
								<SidebarTrigger />
								<div className="grow p-6">
									<ProjectDetails />
								</div>
							</main>
						</SidebarProvider>
					</TooltipProvider>
				</ThemeProvider>
			</QueryClientProvider>
		</div>
	);
}

export default App;
