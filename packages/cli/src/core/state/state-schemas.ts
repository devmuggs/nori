import z from "zod";
import { LanguageCode } from "../locales/locale-enums.js";
import { ParamOption, ParamType } from "./state-enums.js";

export const versionRegex = /^(\d+\.)?(\d+\.)?(\*|\d+)$/;
export const yamlPropertyRegex = /^[a-zA-Z_][a-zA-Z0-9_-]*$/;

export const YamlPropertyStringSchema = z.string().refine(
	(val) => {
		return yamlPropertyRegex.test(val);
	},
	{ message: "Invalid YAML property name" }
);

export type YamlI18nString = z.infer<typeof YamlI18nStringSchema>;
export const YamlI18nStringSchema = z.record(z.enum(LanguageCode), z.string().min(1));

export type YamlI18nStringOrString = z.infer<typeof YamlI18nStringOrStringSchema>;
export const YamlI18nStringOrStringSchema = z.union([YamlI18nStringSchema, z.string().min(1)]);

export type YamlMeta = z.infer<typeof YamlMetaSchema>;
export const YamlMetaSchema = z
	.object({
		preferredLocale: z.enum(LanguageCode),
		author: z.string().min(1),
		project: z.object({
			name: YamlI18nStringOrStringSchema,
			description: YamlI18nStringOrStringSchema
		}),
		version: z
			.string()
			.min(1)
			.regex(versionRegex, { message: "Version must be in the format X.Y.Z" })
	})
	.optional();

export type YamlCollectionEntryParamsOptions = z.infer<
	typeof YamlCollectionEntryParamsOptionsSchema
>;
export const YamlCollectionEntryParamsOptionsSchema = z
	.object({
		[ParamOption.Description]: YamlI18nStringOrStringSchema.optional(),
		[ParamOption.Optional]: z.boolean().optional()
	})
	.and(
		z.union([
			z.object({
				[ParamOption.Type]: z.literal(ParamType.String),
				[ParamOption.Default]: z.string().optional()
			}),
			z.object({
				[ParamOption.Type]: z.literal(ParamType.Boolean),
				[ParamOption.Default]: z.boolean().optional()
			}),
			z.object({
				[ParamOption.Type]: z.literal(ParamType.Number),
				[ParamOption.Default]: z.number().optional()
			})
		])
	);

export type YamlCollectionEntryParams = z.infer<typeof YamlCollectionEntryParamsSchema>;
export const YamlCollectionEntryParamsSchema = z
	.record(YamlPropertyStringSchema, YamlCollectionEntryParamsOptionsSchema)
	.optional();

export type YamlCollectionEntry = z.infer<typeof YamlCollectionEntrySchema>;
export const YamlCollectionEntrySchema = z.object({
	description: YamlI18nStringOrStringSchema.optional(),
	params: YamlCollectionEntryParamsSchema.optional(),
	locales: YamlI18nStringSchema
});

export type YamlCollectionEntries = z.infer<typeof YamlCollectionEntriesSchema>;
export const YamlCollectionEntriesSchema = z.record(
	YamlPropertyStringSchema, // entry key
	YamlCollectionEntrySchema
);

export type YamlCollection = z.infer<typeof YamlCollectionSchema>;
export const YamlCollectionSchema = z.record(
	YamlPropertyStringSchema, // collection name
	YamlCollectionEntriesSchema // entries within the collection
);

export type NoriYaml = z.infer<typeof NoriYamlSchema>;
export const NoriYamlSchema = z.object({
	meta: YamlMetaSchema,
	collections: YamlCollectionSchema
});

// demo for sanity check

const demo: NoriYaml = {
	meta: {
		preferredLocale: LanguageCode.EnglishBritish,
		author: "tristan",
		project: {
			name: "cli",
			description: "A Nori project"
		},
		version: "1.0.0"
	},
	collections: {
		root: {
			["lets-get-started"]: {
				description: {
					[LanguageCode.EnglishBritish]: "Displayed on first step of onboarding wizard.",
					[LanguageCode.Japanese]:
						"オンボーディングウィザードの最初のステップに表示されます。"
				},
				params: {
					topic: {
						type: "string",
						description: {
							[LanguageCode.EnglishBritish]: "The topic to get started with.",
							[LanguageCode.Japanese]: "始めるトピック。"
						}
					}
				},
				locales: {
					[LanguageCode.EnglishBritish]: "Let's get started with {{topic}}.",
					[LanguageCode.Japanese]: "さあ、{{topic}}を始めましょう！"
				}
			}
		},
		client: {
			greeting: {
				description: {
					[LanguageCode.EnglishBritish]: "A friendly greeting message.",
					[LanguageCode.Japanese]: "親しみやすい挨拶メッセージ。"
				},
				locales: {
					[LanguageCode.EnglishBritish]: "Hello!",
					[LanguageCode.Japanese]: "こんにちは！"
				}
			},
			farewell: {
				description: {
					[LanguageCode.EnglishBritish]: "A friendly farewell message.",
					[LanguageCode.Japanese]: "親しみやすい別れのメッセージ。"
				},
				locales: {
					[LanguageCode.EnglishBritish]: "Goodbye!",
					[LanguageCode.Japanese]: "さようなら！"
				}
			}
		}
	}
};
