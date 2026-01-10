import { LogLevels } from "consola";
import z from "zod";
import { loadEnvironment } from "../environment-loader.js";
import logger, { setLogLevel } from "../logger.js";
import { Enum, type EnumValue } from "../utils/enum.js";

export type GlobalCliOption = EnumValue<typeof GlobalCliOptions>;
export const [GlobalCliOptions] = Enum({
	Verbose: "verbose",
	Env: "env",
	LogLevel: "log-level"
});

export const GlobalCliOptionsSchema = z.object({
	[GlobalCliOptions.Verbose]: z.string().optional().default("false"),
	[GlobalCliOptions.Env]: z.string().optional(),
	[GlobalCliOptions.LogLevel]: z.enum(Object.keys(LogLevels)).optional().default("info")
});

export const [NoriCommands] = Enum({
	Init: "--init",
	Generate: "generate"
});

const ArgumentSideEffectsMap: Record<
	GlobalCliOption,
	{ callback: (value: string) => void; description: string }
> = {
	[GlobalCliOptions.Verbose]: {
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

	[GlobalCliOptions.Env]: {
		callback: (envPath: string) => {
			loadEnvironment(envPath);
		},
		description: "Path to the environment file"
	},

	[GlobalCliOptions.LogLevel]: {
		callback: (level: string) => {
			const logLevel = LogLevels[level as keyof typeof LogLevels];
			if (logLevel === undefined) {
				throw new Error(`Invalid log level: ${level}`);
			}
			setLogLevel(logLevel);
			logger.debug(`Log level set to ${level}`);
		},
		description: "Set the logging level"
	}
} as const;

class CommandEvaluator {
	private static _command: string | undefined;
	public static get command() {
		if (!this._command) this.evaluateCommand();
		return this._command;
	}

	private static _args: z.infer<typeof GlobalCliOptionsSchema>;
	public static get args() {
		if (!this._args) this.evaluateArguments();
		return this._args;
	}

	public static readonly evaluateCommand = () => {
		const args = process.argv.slice(2);
		const command = args[0];
		this._command = command;
		return command;
	};

	public static readonly evaluateArguments = () => {
		const args = process.argv.slice(2);
		const commandArgs = args.slice(1);

		const argValueMap: Record<string, unknown> = {};

		for (let i = 0; i < commandArgs.length; i++) {
			const arg = commandArgs.at(i);
			if (!arg) continue;

			if (arg.startsWith("--")) {
				const argName = arg.slice(2);
				const argValue =
					commandArgs.at(i + 1) && !commandArgs.at(i + 1)?.startsWith("--")
						? commandArgs.at(i + 1)
						: true;

				argValueMap[argName] = argValue;
				if (argValue !== true) i++;
			}
		}

		const parsed = GlobalCliOptionsSchema.parse(argValueMap);

		this._args = parsed;
		return parsed;
	};

	public static readonly applySideEffects = () => {
		if (!this.args) this.evaluateCommand();

		for (const [argName, argValue] of Object.entries(this.args)) {
			const { callback, description } =
				ArgumentSideEffectsMap[argName as keyof typeof ArgumentSideEffectsMap];

			if (!description) {
				logger.warn(`No side effect found for argument "${argName}"`);
				continue;
			}

			try {
				callback?.(argValue as never);
			} catch (error) {
				logger.error(`Error applying side effect for argument "${argName}":`);
				logger.error(error);
			}
		}
	};

	public static executeCommand(
		commandExecutionMap: Record<EnumValue<typeof NoriCommands>, () => Promise<void> | void>
	) {
		const command = this.command;

		if (!command) {
			logger.error("No command provided.");
			process.exit(1);
		}

		const commandFunc = commandExecutionMap[command as EnumValue<typeof NoriCommands>];

		if (!commandFunc) {
			logger.error(`Unknown command: ${command}`);
			process.exit(1);
		}

		return commandFunc();
	}
}

export default CommandEvaluator;
