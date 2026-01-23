import logger from "../logger.js";
import { ArgSchemaBase, ArgSchemas, Command, CommandMeta, type ArgSchema } from "./cli-schema.js";
import { ArgumentShape } from "./cli-types.js";
import { ArgumentShapeEvaluators, evaluateArgumentShape } from "./cli-utils.js";

/** Evaluates and processes Nori CLI arguments */
export default class CommandLineInterpreter implements CommandLineInterpreter {
	public static argStrings: readonly string[];
	public static command: Command | undefined;
	public static args: ArgSchema;

	public static start = () => {
		const argv = process.argv.slice(2);

		if (argv.length === 0) {
			throw new Error("No command provided. Please specify a command to run.");
		}

		const commandString = argv[0] ?? "";
		logger.trace(`Interpreting command: ${commandString}`);

		const isValidCommand = CommandMeta.evaluateIsValue(commandString);
		logger.trace(`Is valid command: ${isValidCommand}`);

		CommandLineInterpreter.command = isValidCommand ? (commandString as Command) : undefined;
		CommandLineInterpreter.argStrings = Object.freeze(isValidCommand ? argv.slice(1) : argv);
	};

	public get command(): Command | undefined {
		return CommandLineInterpreter.command;
	}

	/** Interpret CLI arguments and apply to _args */
	public get args(): ArgSchema {
		if (CommandLineInterpreter.args) return CommandLineInterpreter.args;

		const kvPairs: Record<string, string | boolean> = {};

		for (let i = 0; i < CommandLineInterpreter.argStrings.length; i++) {
			const currentArg = CommandLineInterpreter.argStrings[i];
			if (!currentArg) break;

			const shape = evaluateArgumentShape(currentArg);
			const evaluator = ArgumentShapeEvaluators[shape];

			const { key, value } = evaluator(currentArg);
			kvPairs[key] = value;

			if (shape === ArgumentShape.KeyValue || shape === ArgumentShape.KeyEqualsValue) {
				i++;
			}
		}

		const schemaToUse = CommandLineInterpreter.command
			? ArgSchemas[CommandLineInterpreter.command as keyof typeof ArgSchemas]
			: ArgSchemaBase;

		try {
			CommandLineInterpreter.args = schemaToUse.parse({
				...kvPairs,
				kind: CommandLineInterpreter.command ? CommandLineInterpreter.command : "base"
			});
		} catch (error) {
			logger.error("Error parsing CLI arguments:");
			logger.error(error);
			throw error;
		}

		return CommandLineInterpreter.args;
	}
}
