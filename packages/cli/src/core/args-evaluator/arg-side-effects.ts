import { loadEnvironment } from "@nori/environment-loader.js";
import logger, { setLogLevel } from "@nori/logger.js";
import { LogLevels } from "consola";
import { GlobalCliOption } from "./arg-evaluator-types.js";

export const ArgumentSideEffectsMap: Record<
	GlobalCliOption,
	{ callback: (value: string) => void; description: string }
> = {
	[GlobalCliOption.Verbose]: {
		callback: (isVerbose: string) => {
			isVerbose = isVerbose?.trim().toLowerCase();
			if (!isVerbose) throw new Error("Invalid value for verbose argument");

			const truthyValues = ["true", "1", "yes", "y"];
			const isVerboseTruthy = truthyValues.includes(isVerbose);
			if (!isVerboseTruthy) return;

			setLogLevel(LogLevels.debug);
			logger.debug("Verbose mode enabled");
		},
		description: "Enable verbose logging"
	},

	[GlobalCliOption.Env]: {
		callback: (envPath: string) => loadEnvironment(envPath),
		description: "Path to the environment file"
	},

	[GlobalCliOption.LogLevel]: {
		callback: (level: string) => {
			const logLevel = LogLevels[level as keyof typeof LogLevels];
			if (logLevel === undefined) throw new Error(`Invalid log level: ${level}`);
			setLogLevel(logLevel);
			logger.debug(`Log level set to ${level}`);
		},
		description: "Set the logging level"
	}
} as const;
