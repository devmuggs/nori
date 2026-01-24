import z from "zod";

import { LogLevels } from "consola";
import { Enum, type EnumValue } from "../utils/enum.js";

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
	Generate: "generate",
	Base: "base"
});

/** Metadata for each Command */
export const CommandConfig = CommandMeta.derive({
	[Command.Generate]: {
		description: "Generate code based on the provided configuration"
	},
	[Command.Base]: {
		description: "Base command with general options"
	}
});

export type CommandLineInterpreter = {
	command: Command | undefined;
	args: ArgSchema;
};

export const argumentFlagValueSchema = z.boolean().default(false);
export const fileString = z.string().refine(
	(value) => {
		// regex to match valid file paths (basic)
		const filePathRegex = /^(\/|\.\/|\.\.\/)?([\w-]+(\/|\\))*[\w-]+\.[\w]+$/;
		return filePathRegex.test(value);
	},
	{ error: "Invalid file path format" }
);

export type ArgSchemaBaseType = z.infer<typeof ArgSchemaBase>;
export const ArgSchemaBase = z
	.object({
		kind: z.literal("base"),
		// using derive so we get ide errors if we forget to add a new ArgumentOption here
		...ArgumentOptionMetadata.derive({
			[ArgumentOption.LogLevel]: z.enum(LogLevels).default(LogLevels.info),
			[ArgumentOption.Verbose]: argumentFlagValueSchema,
			[ArgumentOption.Version]: argumentFlagValueSchema,
			[ArgumentOption.ConfigPath]: fileString.optional(),
			[ArgumentOption.OutputDir]: fileString.optional(),
			[ArgumentOption.Force]: argumentFlagValueSchema,
			[ArgumentOption.Watch]: argumentFlagValueSchema,
			[ArgumentOption.Init]: argumentFlagValueSchema,
			[ArgumentOption.Help]: argumentFlagValueSchema,
			[ArgumentOption.Env]: fileString.optional()
		})
	})
	.partial();

export type GenerateArgs = z.infer<typeof GenerateArgSchema>;
export const GenerateArgSchema = ArgSchemaBase.extend({
	[ArgumentOption.OutputDir]: fileString.default("./nori-generated"),
	[ArgumentOption.Force]: argumentFlagValueSchema,
	[ArgumentOption.Watch]: argumentFlagValueSchema
})
	.partial()
	.extend({
		kind: z.literal(Command.Generate)
	});

export type ArgSchema = z.infer<typeof ArgSchema>;
export const ArgSchema = z.union([GenerateArgSchema, ArgSchemaBase]);

export const CommandArgSchemaMap = CommandMeta.derive({
	base: ArgSchemaBase,
	[Command.Generate]: GenerateArgSchema
});
