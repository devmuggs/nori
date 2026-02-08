import { useEffect, useRef } from "react";

export const useFileWatcher = (
	filePath: string | undefined,
	onFileChange: (content: string) => void
) => {
	const wsRef = useRef<WebSocket | null>(null);

	useEffect(() => {
		if (!filePath) return;

		const ws = new WebSocket("ws://localhost:3080");
		wsRef.current = ws;

		ws.onopen = () => {
			ws.send(JSON.stringify({ type: "watch", path: filePath }));
		};

		ws.onmessage = (event) => {
			const data = JSON.parse(event.data);

			if (data.type === "file-change") {
				onFileChange(data.content);
			}
		};

		ws.onerror = (error) => {
			console.error("WebSocket error:", error);
		};

		return () => {
			if (ws.readyState === WebSocket.OPEN && filePath) {
				ws.send(JSON.stringify({ type: "unwatch", path: filePath }));
			}
			ws.close();
		};
	}, [filePath, onFileChange]);
};
