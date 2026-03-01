import { Enum, EnumValue } from "@nori/core";
import { Moon, Sun, User } from "lucide-react";

export type Theme = EnumValue<typeof Theme>;
export const [Theme, ThemeMeta] = Enum({
	Dark: "dark",
	Light: "light",
	System: "system"
});

export const ThemeConfig = ThemeMeta.derive({
	[Theme.Dark]: {
		name: "Dark",
		description: "Dark mode theme",
		icon: <Moon />
	},
	[Theme.Light]: {
		name: "Light",
		description: "Light mode theme",
		icon: <Sun />
	},
	[Theme.System]: {
		name: "System",
		description: "Use system theme",
		icon: <User />
	}
});
