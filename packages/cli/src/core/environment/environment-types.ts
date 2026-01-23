import z from "zod";
import { NoriLocale } from "../state-loader/state-loader-types.js";
import { Enum, type EnumValue } from "../utils/enum.js";

export type OutputMode = EnumValue<typeof OutputMode>;
export const [OutputMode] = Enum({
	Monolithic: "monolithic", // all i18n data in a single file (i.e. nori.yaml)
	GroupByLocale: "groupByLocale" // separate file per locale (i.e. nori/ja-JP.yaml, nori/en-GB.yaml)
});

export const [SupportedFileFormat] = Enum({
	Yaml: "yaml",
	Json: "json"
});

export const [SupportedLanguage] = Enum({
	TypeScript: "typescript",
	Python: "python"
});

export const [EnvironmentVariable] = Enum({
	EnvFilePath: "NORI_ENV_FILE_PATH",
	InputTarget: "NORI_INPUT_TARGET",
	OutputDirectory: "NORI_OUTPUT_DIRECTORY",
	OutputMode: "NORI_OUTPUT_MODE",
	PreferredLocale: "NORI_PREFERRED_LOCALE"
});

export type NoriEnvironmentType = z.infer<typeof NoriEnvironmentSchema>;
export const NoriEnvironmentSchema = z.object({
	envFilePath: z.string().optional().default(".env"),
	input: z
		.object({
			target: z.string().default("./nori.yaml")
		})
		.default({ target: "./nori.yaml" }),
	output: z
		.partialRecord(
			z.enum(SupportedLanguage),
			z.object({
				directory: z.string(),
				mode: z.enum(OutputMode).default(OutputMode.Monolithic)
			})
		)
		.default({
			[SupportedLanguage.TypeScript]: {
				directory: "./nori-output/ts",
				mode: OutputMode.Monolithic
			}
		}),
	preferences: z
		.object({
			preferredLocale: z.enum(Object.values(NoriLocale)).optional()
		})
		.default({ preferredLocale: undefined })
});
