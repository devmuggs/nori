import { Enum, type EnumValue } from "@nori/core";
import { DeploymentMode } from "@nori/core/deployment-mode";
import NoriSdk, { NoriSDK } from "@nori/core/sdk";
import { useEffect, useState } from "react";

export const noriApiUrl = import.meta.env.VITE_API_URL || "https://nori-api.muggridge.dev";

export const noriSdk = new NoriSdk({
	noriApiUrl,
	deploymentMode: DeploymentMode.WebServer,
	logger: {
		level: NoriSDK.LogLevel.Info,
		...console
	}
});

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
	const [daemon, setDaemon] = useState<DaemonInstance | null>({
		connectionStatus: ConnectionStatus.Connecting
	});

	useEffect(() => {
		let isMounted = true;
		const checkHealth = async () => {
			try {
				const response = await noriSdk.health.check();
				void response;
				if (isMounted) {
					setDaemon({ connectionStatus: ConnectionStatus.Connected });
				}
			} catch {
				if (isMounted) {
					setDaemon({ connectionStatus: ConnectionStatus.Error });
				}
			}
		};
		checkHealth();

		return () => {
			isMounted = false;
		};
	}, []);

	return daemon;
};
