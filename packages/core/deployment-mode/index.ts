import { Enum, EnumValue } from "../utils/enum";

export type DeploymentMode = EnumValue<typeof DeploymentMode>;
export const [DeploymentMode, DeploymentModeMeta] = Enum({
	LocalDaemon: "local-daemon",
	WebServer: "web-server"
});
