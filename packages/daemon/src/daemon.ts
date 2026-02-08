import { createConsola, LogLevels } from "consola";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";

import { NoriSDK } from "@nori/core";
import type { FileSystemResponse } from "@nori/core/sdk/file-system.js";
import fs from "fs";
import { readdir } from "fs/promises";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { platform, PlatformMeta } from "./core/platform.js";

dotenv.config();

export const logger = createConsola({
	level: LogLevels.debug
});

const daemon = express();
const server = createServer(daemon);
const wss = new WebSocketServer({ server });

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

export const DEFAULT_PATH = process.env.DEFAULT_PATH || (platform === "windows" ? "C:/" : "/home");

daemon.get("/file-system/list-directory", async (req, res) => {
	const parse = NoriSDK.fileSystem.schemas.listDirectory.query.safeParse(req.query);

	if (!parse.success) {
		logger.warn("Invalid file system query:", parse.error.format());
		return res.status(400).json({ error: "Invalid query parameters" });
	}

	const { q, "show-hidden": showHidden, "allowed-extensions": extensions = [] } = parse.data;

	const stack = NoriSDK.fileSystem.helpers.pathStringToStack(q || DEFAULT_PATH);
	const path = `/${stack.join("/")}`;

	const data: FileSystemResponse = { dir: path, children: [] };
	const extensionSet = new Set(extensions);

	try {
		const nodes = await readdir(path, { withFileTypes: true });

		for (const node of nodes) {
			const { name } = node;
			const isHidden = name.startsWith(".");
			const isDirectory = node.isDirectory();
			const extension = name.split(".").pop();
			const isAllowedExtension = !extension || extensionSet.has(`.${extension}`);

			if (!showHidden && isHidden) continue;
			if (!isDirectory && !isAllowedExtension) continue;

			data.children.push({
				name,
				isDirectory
			});
		}

		data.children.sort((a, b) => {
			if (a.isDirectory && !b.isDirectory) return -1;
			if (!a.isDirectory && b.isDirectory) return 1;
			return a.name.localeCompare(b.name);
		});

		res.status(200).json(data);
	} catch (error) {
		logger.error(`Error reading directory: ${path}`, error);
		res.status(500).send("Internal Server Error");
	}
});

daemon.get("/file-system/read-file", async (req, res) => {
	const filePath = req.query.path as string;
	if (!filePath) {
		return res.status(400).json({ error: "Missing 'path' query parameter" });
	}

	try {
		const blob = await fs.promises.readFile(filePath);
		res.status(200).send(blob);
	} catch (error) {
		logger.error(`Error reading file: ${filePath}`, error);
		res.status(500).send("Internal Server Error");
	}
});

const fileWatchers = new Map<any, Map<string, fs.FSWatcher>>();

// WebSocket connection handler
wss.on("connection", (ws) => {
	logger.info("WebSocket client connected");
	fileWatchers.set(ws, new Map());

	ws.on("message", async (message) => {
		try {
			const data = JSON.parse(message.toString());

			if (data.type === "watch") {
				const { path } = data;

				if (!path) {
					ws.send(JSON.stringify({ type: "error", message: "Missing path" }));
					return;
				}

				// Check if already watching
				const clientWatchers = fileWatchers.get(ws);
				if (clientWatchers?.has(path)) {
					logger.debug(`Already watching: ${path}`);
					return;
				}

				// Create file watcher
				const watcher = fs.watch(path, async (eventType) => {
					if (eventType === "change") {
						try {
							const content = await fs.promises.readFile(path, "utf-8");
							ws.send(
								JSON.stringify({
									type: "file-change",
									path,
									content
								})
							);
							logger.debug(`File changed: ${path}`);
						} catch (error) {
							logger.error(`Error reading changed file: ${path}`, error);
						}
					}
				});

				clientWatchers?.set(path, watcher);
				logger.info(`Now watching: ${path}`);

				ws.send(JSON.stringify({ type: "watch-started", path }));
			}

			if (data.type === "unwatch") {
				const { path } = data;
				const clientWatchers = fileWatchers.get(ws);
				const watcher = clientWatchers?.get(path);

				if (watcher) {
					watcher.close();
					clientWatchers?.delete(path);
					logger.info(`Stopped watching: ${path}`);
					ws.send(JSON.stringify({ type: "watch-stopped", path }));
				}
			}
		} catch (error) {
			logger.error("WebSocket message error:", error);
			ws.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
		}
	});

	ws.on("close", () => {
		logger.info("WebSocket client disconnected");

		// Clean up all watchers for this client
		const clientWatchers = fileWatchers.get(ws);
		if (clientWatchers) {
			for (const [path, watcher] of clientWatchers) {
				watcher.close();
				logger.debug(`Cleaned up watcher for: ${path}`);
			}
			fileWatchers.delete(ws);
		}
	});

	ws.on("error", (error) => {
		logger.error("WebSocket error:", error);
	});
});

const PORT = process.env.PORT || 3080; // ... because I have an rtx 3080
server.listen(PORT, () => {
	logger.info(`Nori Daemon is listening on port ${PORT}`);
	logger.info(`WebSocket server ready on ws://localhost:${PORT}`);

	logger.info(`Detected platform: ${PlatformMeta.reverseLookup(platform)}`);
	logger.info(`Using default path: ${DEFAULT_PATH}`);
});
