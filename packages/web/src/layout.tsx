import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Toaster } from "./components/ui/sonner";
export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<SidebarProvider>
			<AppSidebar />
			<Toaster />
			<main>
				<SidebarTrigger />
				{children}
			</main>
		</SidebarProvider>
	);
}
