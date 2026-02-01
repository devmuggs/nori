import type CommandLineInterface from "@nori/command-line-interface/index.js";
import type NoriEnvironment from "@nori/environment/environment-loader.js";
import type { InputManager } from "@nori/input-manager/index.js";

export * from "./help/index.js";

export type CommandHandler = (params: {
	environment: NoriEnvironment;
	cli: CommandLineInterface;
}) => Promise<void> | void;
