import { Enum, type EnumValue } from "@nori/core";
import axios from "axios";
import { useEffect, useState } from "react";

const noriDaemonUrl = "http://localhost:3080";

export const simulateLatency = async (ms: number) => {
	return new Promise((resolve) => setTimeout(resolve, ms));
};

const noriDaemonSdk = {
	healthCheck: async () => {
		const response = await axios(`${noriDaemonUrl}/health`);
		return response.data;
	}
};

export type ConnectionStatus = EnumValue<typeof ConnectionStatus>;
export const [ConnectionStatus] = Enum({
	Connecting: "connecting",
	Connected: "connected",
	Disconnected: "disconnected",
	Error: "error"
});

type DaemonInstance = {
	connectionStatus: ConnectionStatus;
};

export const useDaemon = () => {
	const [daemon, setDaemon] = useState<DaemonInstance | null>(null);

	useEffect(() => {
		let isMounted = true;
		const checkHealth = async () => {
			try {
				await noriDaemonSdk.healthCheck();
				if (isMounted) {
					setDaemon({ connectionStatus: ConnectionStatus.Connected });
				}
			} catch (error) {
				if (isMounted) {
					setDaemon({ connectionStatus: ConnectionStatus.Error });
				}
			}
		};

		setDaemon({ connectionStatus: ConnectionStatus.Connecting });
		checkHealth();

		return () => {
			isMounted = false;
		};
	}, []);

	return daemon;
};
