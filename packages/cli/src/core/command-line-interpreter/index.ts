import logger from "../logger.js";
import { ArgSchemaBase, ArgSchemas, type ArgSchema } from "./cli-schema.js";
import { ArgumentShape, Command } from "./cli-types.js";
import { ArgumentShapeEvaluators, evaluateArgumentShape } from "./cli-utils.js";

/** Evaluates and processes Nori CLI arguments */
export default class CommandLineInterpreter implements CommandLineInterpreter {
	private readonly argStrings: readonly string[];
	private readonly _command: Command | undefined;
	private _args: ArgSchema | undefined;

	constructor() {
		const argv = process.argv.slice(2);

		if (argv.length === 0) {
			throw new Error("No command provided. Please specify a command to run.");
		}

		const commandString = argv[0] ?? "";
		const isValidCommand = commandString in Command;

		this._command = isValidCommand ? (commandString as Command) : undefined;
		this.argStrings = Object.freeze(isValidCommand ? argv.slice(1) : argv);
	}

	public get command(): Command | undefined {
		return this._command;
	}

	/** Interpret CLI arguments and apply to _args */
	public get args(): ArgSchema {
		if (this._args) return this._args;

		const kvPairs: Record<string, string | boolean> = {};

		for (let i = 0; i < this.argStrings.length; i++) {
			const currentArg = this.argStrings[i];
			if (!currentArg) break;

			const shape = evaluateArgumentShape(currentArg);
			const evaluator = ArgumentShapeEvaluators[shape];

			const { key, value } = evaluator(currentArg);
			kvPairs[key] = value;

			if (shape === ArgumentShape.KeyValue || shape === ArgumentShape.KeyEqualsValue) {
				i++;
			}
		}

		const schemaToUse = this._command ? ArgSchemas[this._command] : ArgSchemaBase;

		try {
			this._args = schemaToUse.parse(kvPairs);
		} catch (error) {
			logger.error("Error parsing CLI arguments:");
			logger.error(error);
			throw error;
		}

		return this._args;
	}
}
