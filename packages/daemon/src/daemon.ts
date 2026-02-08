import { Enum, type EnumValue } from "@nori/core";
import { exec, execSync } from "child_process";
import { createConsola, LogLevels } from "consola";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

export const logger = createConsola({
	level: LogLevels.debug
});

const daemon = express();
daemon.use(express.json());
daemon.use(express.urlencoded({ extended: true }));
daemon.use(
	cors({
		origin: "*",
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"]
	})
);

daemon.use((req, res, next) => {
	logger.debug(`[${req.method}] ${req.url}`);
	next();
});

daemon.get("/health", (req, res) => {
	res.status(200).send("OK");
});

const pathToStack = (path: string): string[] => {
	const segments = path.split("/").filter((segment) => segment.length > 0);
	const stack: string[] = [];
	for (const segment of segments) {
		if (segment === ".") continue;
		if (segment === "..") {
			stack.pop();
		} else {
			stack.push(segment);
		}
	}
	return stack;
};

export type FileSystemResponse = {
	dir: string;
	children: {
		name: string;
		isDirectory: boolean;
	}[];
};

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

const platform = detectPlatform();

export const currentUser: string = process.env.USER || process.env.USERNAME || "unknown";
export const PlatformToUserDirMap: Record<Platform, string> = {
	[Platform.Windows]: `C:\\Users\\${currentUser}`,
	[Platform.MacOS]: `/Users/${currentUser}`,
	[Platform.Linux]: `/home/${currentUser}`,
	[Platform.Unknown]: "/"
};

const homeDir = PlatformToUserDirMap[platform];

export const PlatformDefaultPaths = PlatformMeta.derive({
	[Platform.Windows]: [
		`C:\\github`,
		`${homeDir}\\Documents`,
		`${homeDir}\\Desktop`,
		`${homeDir}\\Downloads`,
		`${homeDir}\\`
	],
	[Platform.MacOS]: [
		`/Users/${currentUser}/github`,
		`${homeDir}/Documents`,
		`${homeDir}/Desktop`,
		`${homeDir}/Downloads`,
		`${homeDir}/`
	],
	[Platform.Linux]: [
		`/github`,
		`/home/${currentUser}/github`,
		`${homeDir}/Documents/github`,
		`${homeDir}/Documents/Github`,
		`${homeDir}/Documents`,
		`${homeDir}/Desktop`,
		`${homeDir}/Downloads`,
		`${homeDir}/`
	],
	[Platform.Unknown]: ["/"]
});

logger.info(`Detected platform: ${PlatformMeta.reverseLookup(platform)}`);

const getValidDefaultPath = (): string => {
	const possiblePaths = PlatformDefaultPaths[platform];
	for (const path of possiblePaths) {
		try {
			execSync(`ls "${path.replace(/"/g, '\\"')}"`, { encoding: "utf-8" });
			return path;
		} catch {
			continue;
		}
	}
	return "/";
};

export const DEFAULT_PATH = process.env.DEFAULT_PATH || getValidDefaultPath();
logger.info(`Using default path: ${DEFAULT_PATH}`);

daemon.get("/file-system", async (req, res) => {
	const {
		q = "",
		showHidden = "false",
		extensions = ""
	} = req.query as {
		q?: string;
		showHidden?: string;
		extensions?: string;
	};

	const extensionsArray = extensions
		? (extensions as string).split(",").map((ext) => ext.trim())
		: [];

	logger.info(`Requested extensions filter:`, extensionsArray);

	const stack = pathToStack(q || `${DEFAULT_PATH}`);
	const path = "/" + stack.join("/");
	const children: { name: string; isDirectory: boolean }[] = [];

	logger.info(`Reading directory: ${path} (showHidden: ${showHidden})`);

	try {
		const dirents = execSync(`ls -a "${path.replace(/"/g, '\\"')}"`, { encoding: "utf-8" });
		const entries = dirents.split("\n").filter((entry) => entry.length > 0);

		// use fs to get details about each entry
		const fs = await import("fs");
		for (const entry of entries) {
			if (showHidden !== "true" && entry.startsWith(".")) {
				continue;
			}

			try {
				const stat = fs.statSync(`${path}/${entry}`);
				children.push({
					name: entry,
					isDirectory: stat.isDirectory()
				});
			} catch (error) {
				logger.error(`Error stating file: ${path}/${entry}`, error);
			}
		}

		const filteredChildren = children
			.filter((child) => {
				if (extensionsArray.length === 0) return true;
				if (child.isDirectory) return true;
				for (const ext of extensionsArray) {
					if (child.name.endsWith(ext)) return true;
				}
				return false;
			})
			.sort((a, b) => {
				if (a.isDirectory && !b.isDirectory) return -1;
				if (!a.isDirectory && b.isDirectory) return 1;
				return a.name.localeCompare(b.name);
			});

		res.status(200).json({
			path,
			data: {
				dir: path,
				children: filteredChildren
			} as FileSystemResponse
		});
	} catch (error) {
		logger.error(`Error reading directory: ${path}`, error);
		res.status(500).send("Internal Server Error");
	}
});

const PORT = process.env.PORT || 3080; // ... because I have an rtx 3080

daemon.listen(PORT, () => {
	logger.info(`Nori Daemon is listening on port ${PORT}`);
});
