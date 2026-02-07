import { type EnumValue, Enum } from "@nori/core";

export type OutputMode = EnumValue<typeof OutputMode>;
export const [OutputMode] = Enum({
	Monolithic: "monolithic", // all i18n data in a single file (i.e. nori.yaml)
	GroupByLocale: "groupByLocale" // separate file per locale (i.e. nori/ja-JP.yaml, nori/en-GB.yaml)
});

export const [SupportedFileFormat] = Enum({
	Yaml: "yaml",
	Json: "json"
});

export type EnvironmentVariable = EnumValue<typeof EnvironmentVariable>;
export const [EnvironmentVariable] = Enum({
	EnvFilePath: "NORI_ENV_FILE_PATH", // path to .env file
	InputTarget: "NORI_INPUT_TARGET", // path to nori.yaml
	OutputDirectory: "NORI_OUTPUT_DIRECTORY", // path to output directory
	OutputMode: "NORI_OUTPUT_MODE", // monolithic (.generate/nori.ts) | groupByLocale (.generate/nori/en-GB.ts, nori/ja-JP.ts)
	PreferredLocale: "NORI_PREFERRED_LOCALE" // en-GB | ja-JP for cli prompts
});
