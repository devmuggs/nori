import { LogLevels, type EnumValue } from "@nori";
import z from "zod";
import { Enum } from "../utils/enum.js";
import { argumentFlagValueSchema, fileString, type ArgSchema } from "./cli-schema.js";

/** Shapes that CLI arguments can take */
export type ArgumentShape = EnumValue<typeof ArgumentShape>;

/** Shapes that CLI arguments can take */
export const [ArgumentShape] = Enum({
	/** --flag (i.e. --help) */
	Flag: "flag",
	/** --key value (i.e. --output file.txt) */
	KeyValue: "key-value",
	/** --key=value (i.e. --output=file.txt) */
	KeyEqualsValue: "key-equals-value"
});

export type ArgumentOption = EnumValue<typeof ArgumentOption>;
/** Available argument options */
export const [ArgumentOption, ArgumentOptionMetadata] = Enum({
	/** Log level for the CLI output */
	LogLevel: "log-level",
	/** Enabled verbose logging */
	Verbose: "verbose",
	/** Show version information */
	Version: "version",
	/** Path to the configuration file */
	ConfigPath: "config-path",
	/** Output directory for generated files */
	OutputDir: "output-dir",
	/** Force overwrite of existing files */
	Force: "force",
	/** Enable watch mode for continuous generation */
	Watch: "watch",
	/** Initialize a new Nori project */
	Init: "init",
	/** Display help information */
	Help: "help",
	/** Indicate env file path */
	Env: "env"
});

/** Metadata for each ArgumentOption */
export const ArgumentOptionConfig = ArgumentOptionMetadata.derive({
	[ArgumentOption.LogLevel]: {
		description: "Set the log level for CLI output (e.g., info, debug, warn, error)"
	},
	[ArgumentOption.Verbose]: {
		description: "Enable verbose logging for more detailed output"
	},
	[ArgumentOption.Version]: {
		description: "Display the version information of the CLI tool"
	},
	[ArgumentOption.ConfigPath]: {
		description: "Specify the path to the configuration file"
	},
	[ArgumentOption.OutputDir]: {
		description: "Define the output directory for generated files"
	},
	[ArgumentOption.Force]: {
		description: "Force overwrite of existing files during generation"
	},
	[ArgumentOption.Watch]: {
		description: "Enable watch mode for continuous generation on file changes"
	},
	[ArgumentOption.Init]: {
		description: "Initialize a new Nori project with default settings"
	},
	[ArgumentOption.Help]: {
		description: "Display help information about CLI commands and options"
	},
	[ArgumentOption.Env]: {
		description: "Specify the path to the environment file"
	}
});

/** Available commands for the CLI */
export type Command = EnumValue<typeof Command>;
export const [Command, CommandMeta] = Enum({
	Generate: "generate"
});

/** Metadata for each Command */
export const CommandConfig = CommandMeta.derive({
	[Command.Generate]: {
		description: "Generate code based on the provided configuration"
	}
});

export type KeyValuePair<TValue> = Readonly<{
	key: string;
	value: TValue;
}>;

export type ArgumentShapeFlagEvaluatorFunction = (arg: string) => KeyValuePair<boolean>;
export type ArgumentShapeKeyValueEvaluatorFunction = (arg: string) => KeyValuePair<string>;
export type ArgumentShapeKeyEqualsValueEvaluatorFunction = (arg: string) => KeyValuePair<string>;

export type ArgumentShapeEvaluatorMap = {
	[ArgumentShape.Flag]: ArgumentShapeFlagEvaluatorFunction;
	[ArgumentShape.KeyValue]: ArgumentShapeKeyValueEvaluatorFunction;
	[ArgumentShape.KeyEqualsValue]: ArgumentShapeKeyEqualsValueEvaluatorFunction;
};

export type CommandLineInterpreter = {
	command: Command | undefined;
	args: ArgSchema;
};
