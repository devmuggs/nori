import { createConsola, LogLevels } from "consola";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";

import type { FileSystemResponse } from "@nori/core/sdk/file-system.js";
import NoriSDK from "@nori/core/sdk/index.js";
import fs from "fs";
import { readdir } from "fs/promises";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { platform, PlatformMeta } from "./core/platform.js";
import { useAuthRouter } from "./features/authentication/authentcation-router.js";

dotenv.config();

export const logger = createConsola({
	level: LogLevels.debug
});

const daemon = express();
const server = createServer(daemon);
const wss = new WebSocketServer({ server });

daemon.use(express.json());
daemon.use(express.urlencoded({ extended: true }));
daemon.use((req, res, next) => {
	logger.debug(`[${req.method}] ${req.url}`);
	next();
});
daemon.use(
	cors({
		origin: (origin, callback) => {
			// Allow all origins or restrict to specific ones
			logger.debug(`CORS origin check: ${origin}`);
			callback(null, true);
		},
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
		credentials: true // Allow cookies and credentials
	})
);

daemon.use(cookieParser());

daemon.get("/health", (req, res) => {
	res.status(200).send("OK");
});

export const DEFAULT_PATH = process.env.DEFAULT_PATH || (platform === "windows" ? "C:/" : "/home");

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

useAuthRouter(daemon);

const PORT = process.env.PORT || 3080; // ... because I have an rtx 3080
server.listen(PORT, () => {
	logger.info(`Nori Daemon is listening on port ${PORT}`);
	logger.info(`WebSocket server ready on ws://localhost:${PORT}`);

	logger.info(`Detected platform: ${PlatformMeta.reverseLookup(platform)}`);
	logger.info(`Using default path: ${DEFAULT_PATH}`);
});
