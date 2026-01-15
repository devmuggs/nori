import z from "zod";
import logger from "../logger.js";
import { GlobalCliOptionsSchema, NoriCommand } from "./arg-evaluator-types.js";
import { ArgumentSideEffectsMap } from "./arg-side-effects.js";

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
		commandExecutionMap: Record<NoriCommand, (args: unknown) => Promise<void> | void>
	) {
		const command = this.command;

		if (!command) {
			logger.error("No command provided.");
			process.exit(1);
		}

		const commandFunc = commandExecutionMap[command as NoriCommand];

		if (!commandFunc) {
			logger.error(`Unknown command: ${command}`);
			process.exit(1);
		}

		return commandFunc(this.args);
	}
}

export default CommandEvaluator;
