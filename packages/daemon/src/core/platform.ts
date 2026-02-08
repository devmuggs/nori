import { type EnumValue, Enum } from "@nori/core";

export type Platform = EnumValue<typeof Platform>;
export const [Platform, PlatformMeta] = Enum({
	Windows: "windows",
	MacOS: "macos",
	Linux: "linux",
	Unknown: "unknown"
});

export const detectPlatform = (): Platform => {
	const platform = process.platform;
	if (platform === "win32") return Platform.Windows;
	if (platform === "darwin") return Platform.MacOS;
	return Platform.Linux;
};

export const platform = detectPlatform();
