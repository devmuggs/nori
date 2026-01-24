import z from "zod";

import { NoriLocale, NoriLocaleMeta } from "@nori/state-loader/state-loader-types.js";
import { LogLevels } from "consola";
import { Enum, type EnumValue } from "../utils/enum.js";

/** Available commands for the CLI */
export type Command = EnumValue<typeof Command>;
export const [Command, CommandMeta] = Enum({
	Generate: "generate",
	Base: "base",
	Config: "config"
});

/** Metadata for each Command */
export const CommandConfig = CommandMeta.derive({
	[Command.Generate]: {
		description: {
			[NoriLocale.EnglishBritish]: "Generate assets based on the Nori configuration",
			[NoriLocale.Japanese]: "Noriの設定に基づいてアセットを生成します"
		}
	},
	[Command.Base]: {
		description: {
			[NoriLocale.EnglishBritish]: "Base command with no specific action",
			[NoriLocale.Japanese]: "特定のアクションを持たない基本コマンド"
		}
	},
	[Command.Config]: {
		description: {
			[NoriLocale.EnglishBritish]: "Manage Nori configuration settings",
			[NoriLocale.Japanese]: "Noriの設定を管理します"
		}
	}
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
	Env: "env",

	// configure options
	/** Set locale */
	SetLocale: "set-locale"
});

/** Metadata for each ArgumentOption */
export const ArgumentOptionConfig = ArgumentOptionMetadata.derive({
	[ArgumentOption.LogLevel]: {
		description: {
			[NoriLocale.EnglishBritish]:
				"Set the log level for CLI output (e.g., info, debug, warn, error)",
			[NoriLocale.Japanese]: "CLI出力のログレベルを設定します（例：info、debug、warn、error）"
		}
	},
	[ArgumentOption.Verbose]: {
		description: {
			[NoriLocale.EnglishBritish]: "Enable verbose logging for more detailed output",
			[NoriLocale.Japanese]: "詳細な出力のために冗長なログを有効にします"
		}
	},
	[ArgumentOption.Version]: {
		description: {
			[NoriLocale.EnglishBritish]: "Display the current version of Nori CLI",
			[NoriLocale.Japanese]: "Nori CLIの現在のバージョンを表示します"
		}
	},
	[ArgumentOption.ConfigPath]: {
		description: {
			[NoriLocale.EnglishBritish]: "Specify the path to the configuration file",
			[NoriLocale.Japanese]: "設定ファイルのパスを指定します"
		}
	},
	[ArgumentOption.OutputDir]: {
		description: {
			[NoriLocale.EnglishBritish]: "Define the output directory for generated files",
			[NoriLocale.Japanese]: "生成されたファイルの出力ディレクトリを定義します"
		}
	},
	[ArgumentOption.Force]: {
		description: {
			[NoriLocale.EnglishBritish]: "Force overwrite of existing files during generation",
			[NoriLocale.Japanese]: "生成中に既存のファイルを強制的に上書きします"
		}
	},
	[ArgumentOption.Watch]: {
		description: {
			[NoriLocale.EnglishBritish]:
				"Enable watch mode for continuous generation on file changes",
			[NoriLocale.Japanese]: "ファイルの変更時に継続的な生成のための監視モードを有効にします"
		}
	},
	[ArgumentOption.Init]: {
		description: {
			[NoriLocale.EnglishBritish]: "Initialize a new Nori project with default settings",
			[NoriLocale.Japanese]: "デフォルト設定で新しいNoriプロジェクトを初期化します"
		}
	},
	[ArgumentOption.Help]: {
		description: {
			[NoriLocale.EnglishBritish]: "Display help information about CLI commands and options",
			[NoriLocale.Japanese]: "CLIコマンドとオプションに関するヘルプ情報を表示します"
		}
	},
	[ArgumentOption.Env]: {
		description: {
			[NoriLocale.EnglishBritish]: "Specify the path to the environment file",
			[NoriLocale.Japanese]: "環境ファイルのパスを指定します"
		}
	},
	[ArgumentOption.SetLocale]: {
		description: {
			[NoriLocale.EnglishBritish]: "Set the preferred locale for Nori",
			[NoriLocale.Japanese]: "Noriの優先ロケールを設定します"
		}
	}
});

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
		// using derive so we get ide errors if we forget to add a new ArgumentOption here
		...ArgumentOptionMetadata.pick([
			ArgumentOption.LogLevel,
			ArgumentOption.Verbose,
			ArgumentOption.Version,
			ArgumentOption.ConfigPath,
			ArgumentOption.OutputDir,
			ArgumentOption.Force,
			ArgumentOption.Watch,
			ArgumentOption.Init,
			ArgumentOption.Help,
			ArgumentOption.Env
		]).derive({
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
	.partial()
	.extend({
		kind: z.literal(Command.Base)
	});

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

export type ConfigArgs = z.infer<typeof ConfigArgSchema>;
export const ConfigArgSchema = ArgSchemaBase.extend({
	[ArgumentOption.SetLocale]: z.enum(NoriLocaleMeta.values).or(z.boolean()).optional()
})
	.partial()
	.extend({
		kind: z.literal(Command.Config)
	});

export type ArgSchema = z.infer<typeof ArgSchema>;
export const ArgSchema = z.union([GenerateArgSchema, ConfigArgSchema, ArgSchemaBase]);

export const CommandArgSchemaMap = CommandMeta.derive({
	base: ArgSchemaBase,
	[Command.Generate]: GenerateArgSchema,
	[Command.Config]: ConfigArgSchema
});
