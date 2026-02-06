import z from "zod";

import { LogLevels } from "consola";
import { LanguageCode, LanguageCodeMeta } from "../locales/index.js";
import { Enum, type EnumValue } from "../utils/enum.js";

/** Available commands for the CLI */
export type Command = EnumValue<typeof Command>;
export const [Command, CommandMeta] = Enum({
	Help: "help",
	Init: "init",
	Generate: "generate",
	Base: "base",
	Config: "config"
});

/** Metadata for each Command */
export const CommandConfig = CommandMeta.derive({
	[Command.Generate]: {
		description: {
			[LanguageCode.EnglishBritish]: "Generate assets based on the Nori configuration",
			[LanguageCode.Japanese]: "Noriの設定に基づいてアセットを生成します"
		}
	},
	[Command.Base]: {
		description: {
			[LanguageCode.EnglishBritish]: "Base command with no specific action",
			[LanguageCode.Japanese]: "特定のアクションを持たない基本コマンド"
		}
	},
	[Command.Config]: {
		description: {
			[LanguageCode.EnglishBritish]: "Manage Nori configuration settings",
			[LanguageCode.Japanese]: "Noriの設定を管理します"
		}
	},
	[Command.Help]: {
		description: {
			[LanguageCode.EnglishBritish]: "Display help information about Nori commands",
			[LanguageCode.Japanese]: "Noriコマンドに関するヘルプ情報を表示します"
		}
	},
	[Command.Init]: {
		description: {
			[LanguageCode.EnglishBritish]: "Initialize a new Nori project",
			[LanguageCode.Japanese]: "新しいNoriプロジェクトを初期化します"
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
			[LanguageCode.EnglishBritish]:
				"Set the log level for CLI output (e.g., info, debug, warn, error)",
			[LanguageCode.Japanese]:
				"CLI出力のログレベルを設定します（例：info、debug、warn、error）"
		},
		options: {
			trace: LogLevels.trace,
			debug: LogLevels.debug,
			info: LogLevels.info,
			warn: LogLevels.warn,
			error: LogLevels.error,
			fatal: LogLevels.fatal
		}
	},
	[ArgumentOption.Verbose]: {
		description: {
			[LanguageCode.EnglishBritish]: "Enable verbose logging for more detailed output",
			[LanguageCode.Japanese]: "詳細な出力のために冗長なログを有効にします"
		}
	},
	[ArgumentOption.Version]: {
		description: {
			[LanguageCode.EnglishBritish]: "Display the current version of Nori CLI",
			[LanguageCode.Japanese]: "Nori CLIの現在のバージョンを表示します"
		}
	},
	[ArgumentOption.ConfigPath]: {
		description: {
			[LanguageCode.EnglishBritish]: "Specify the path to the configuration file",
			[LanguageCode.Japanese]: "設定ファイルのパスを指定します"
		}
	},
	[ArgumentOption.OutputDir]: {
		description: {
			[LanguageCode.EnglishBritish]: "Define the output directory for generated files",
			[LanguageCode.Japanese]: "生成されたファイルの出力ディレクトリを定義します"
		}
	},
	[ArgumentOption.Force]: {
		description: {
			[LanguageCode.EnglishBritish]: "Force overwrite of existing files during generation",
			[LanguageCode.Japanese]: "生成中に既存のファイルを強制的に上書きします"
		}
	},
	[ArgumentOption.Watch]: {
		description: {
			[LanguageCode.EnglishBritish]:
				"Enable watch mode for continuous generation on file changes",
			[LanguageCode.Japanese]:
				"ファイルの変更時に継続的な生成のための監視モードを有効にします"
		}
	},

	[ArgumentOption.Env]: {
		description: {
			[LanguageCode.EnglishBritish]: "Specify the path to the environment file",
			[LanguageCode.Japanese]: "環境ファイルのパスを指定します"
		}
	},
	[ArgumentOption.SetLocale]: {
		description: {
			[LanguageCode.EnglishBritish]: "Set the preferred locale for Nori",
			[LanguageCode.Japanese]: "Noriの優先ロケールを設定します"
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
			ArgumentOption.Env
		]).derive({
			[ArgumentOption.LogLevel]: z
				.enum(Object.keys(LogLevels) as (keyof typeof LogLevels)[])
				.default("info"),
			[ArgumentOption.Verbose]: argumentFlagValueSchema,
			[ArgumentOption.Version]: z.coerce.number().optional(),
			[ArgumentOption.ConfigPath]: fileString.optional(),
			[ArgumentOption.OutputDir]: fileString.optional(),
			[ArgumentOption.Force]: argumentFlagValueSchema,
			[ArgumentOption.Watch]: argumentFlagValueSchema,
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
	[ArgumentOption.SetLocale]: z.enum(LanguageCodeMeta.values).or(z.boolean()).optional()
})
	.partial()
	.extend({
		kind: z.literal(Command.Config)
	});

export type ArgSchema = z.infer<typeof ArgSchema>;
export const ArgSchema = z.union([GenerateArgSchema, ConfigArgSchema, ArgSchemaBase]);

export const CommandArgSchemaMap = CommandMeta.derive({
	[Command.Base]: ArgSchemaBase,
	[Command.Generate]: GenerateArgSchema,
	[Command.Config]: ConfigArgSchema,
	[Command.Help]: ArgSchemaBase,
	[Command.Init]: ArgSchemaBase
});
