import type { InputManager } from "@nori/input-manager/index.js";
import logger from "../logger.js";
import {
	ArgSchema,
	ArgSchemaBase,
	Command,
	CommandArgSchemaMap,
	CommandMeta
} from "./cli-schema.js";
import { ArgumentShapeEvaluators, evaluateArgumentShape } from "./cli-utils.js";

/** Evaluates and processes Nori CLI arguments */
export default class CommandLineInterface {
	public input: InputManager;
	public argStrings: readonly string[];
	private _command: Command =
		process.argv.length > 2 ? (process.argv[2] as Command) : Command.Base;

	private _args: ArgSchema | null = null;

	constructor(input: InputManager) {
		this.input = input;

		const argv = process.argv.slice(2);

		if (argv.length === 0) {
			throw new Error("No command provided. Please specify a command to run.");
		}

		const commandString = argv[0] ?? "";
		logger.trace(`Interpreting command: ${commandString}`);

		const isValidCommand = CommandMeta.evaluateIsValue(commandString);
		logger.trace(`Is valid command: ${isValidCommand}`);

		this._command = isValidCommand ? (commandString as Command) : Command.Base;
		this.argStrings = Object.freeze(isValidCommand ? argv.slice(1) : argv);
	}

	public get command(): Command {
		return this._command;
	}

	/** Interpret CLI arguments and apply to _args */
	public get args(): ArgSchema {
		if (this._args) return this._args;

		logger.debug("Parsing CLI arguments:", this.argStrings);
		const kvPairs: Record<string, string | boolean> = {};

		// i.e. --log-level=debug or --version 1 or --verbose
		for (let i = 0; i < this.argStrings.length; i++) {
			const currentArg = this.argStrings[i];
			if (!currentArg) break;

			const nextArg = this.argStrings.at(i + 1); // 1 or --verbose or undefined
			const isProbablyValue = nextArg && !nextArg.startsWith("--"); // 1 -> true, --verbose -> false, undefined -> false

			// should either be "--log-level=debug" or "--version 1" or "--verbose"
			const fullArg = isProbablyValue ? `${currentArg} ${nextArg}` : currentArg;
			const shape = evaluateArgumentShape(fullArg);
			const evaluator = ArgumentShapeEvaluators[shape];

			const { key, value } = evaluator(fullArg);
			kvPairs[key] = value;

			// skip next arg if it was used as a value
			i += isProbablyValue ? 1 : 0;
		}

		const schemaToUse = CommandArgSchemaMap[this.command];

		try {
			this._args = schemaToUse.parse({
				...kvPairs,
				kind: this.command
			});
		} catch (error) {
			logger.error("Error parsing CLI arguments:");
			logger.error(error);
			throw error;
		}

		return this._args ?? ArgSchemaBase.parse({ kind: "base" });
	}
}
