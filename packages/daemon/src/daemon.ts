import { createConsola, LogLevels } from "consola";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";

import fs from "fs";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { platform, PlatformMeta } from "./core/platform.js";
import { useAuthRouter } from "./features/authentication/authentcation-router.js";
import { useFileUploadRouter } from "./features/file-uploads/file-upload-router.js";

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
			// allow requests with no origin (e.g. direct <img>/<video> src, server-to-server)
			if (!origin) return callback(null, true);

			// nori web is hosted on cloudflare tunnel at nori.muggridge.dev
			if (origin === "http://localhost:5174" || origin === "https://nori.muggridge.dev") {
				return callback(null, true);
			}
			callback(new Error("Not allowed by CORS"));
		},
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
		credentials: true // Allow cookies and credentials,
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
useFileUploadRouter(daemon);

import http from "http";
// setup a proxy for the object storage so that clients can use the pre-signed URLs without needing to know the internal hostname of the minio server or worry about CORS issues when uploading directly to the minio server from the client
daemon.use("/object-storage", (req, res) => {
	const { method, url, headers } = req;
	const targetUrl = `http://minio:9000${url}`;

	logger.debug(`Proxying request to object storage: ${method} ${targetUrl}`);

	const proxyReq = http.request(
		targetUrl,
		{ method, headers: { ...headers, host: "minio:9000" } },
		(proxyRes) => {
			res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
			proxyRes.pipe(res, { end: true });
		}
	);

	proxyReq.on("error", (error) => {
		logger.error("Error proxying request to object storage:", error);
		res.status(500).json({ message: "Error proxying request to object storage" });
	});

	if (method === "POST" || method === "PUT") {
		req.pipe(proxyReq, { end: true });
	} else {
		proxyReq.end();
	}
});

const PORT = process.env.PORT || 3080; // ... because I have an rtx 3080
server.listen(PORT, () => {
	logger.info(`Nori Daemon is listening on port ${PORT}`);
	logger.info(`WebSocket server ready on ws://localhost:${PORT}`);

	logger.info(`Detected platform: ${PlatformMeta.reverseLookup(platform)}`);
	logger.info(`Using default path: ${DEFAULT_PATH}`);
});
