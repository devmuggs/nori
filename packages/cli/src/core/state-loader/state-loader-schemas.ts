import z from "zod";
import {
	NoriEntryParamType,
	NoriLocale,
	NoriLocaleItemParamOptions
} from "./state-loader-types.js";

export const YamlKeyRegex = /^[a-zA-Z0-9-_]+$/;
export const YamlKeySchema = z.string().regex(YamlKeyRegex);
export const LocaleStringSchema = z.record(z.enum(NoriLocale), z.string());
export const LocaleStringCollectionOrStringSchema = z.union([LocaleStringSchema, z.string()]);

export type INoriEntryParam = z.infer<typeof INoriEntryParam>;
export const INoriEntryParam = z.record(
	YamlKeySchema,
	z.object({
		[NoriLocaleItemParamOptions.Description]: LocaleStringCollectionOrStringSchema.optional(),
		[NoriLocaleItemParamOptions.Type]: z.enum(NoriEntryParamType),
		[NoriLocaleItemParamOptions.Default]: LocaleStringCollectionOrStringSchema.optional()
	})
);

export type INoriEntry = z.infer<typeof INoriEntry>;
export const INoriEntry = z.object({
	description: LocaleStringCollectionOrStringSchema.optional(),
	params: INoriEntryParam.optional(),
	locales: LocaleStringSchema.optional()
});

export type INoriCollection = z.infer<typeof INoriCollection>;
export const INoriCollection = z.object({
	description: LocaleStringCollectionOrStringSchema.optional(),
	entries: z.record(YamlKeySchema, INoriEntry),
	collections: z
		.record(
			YamlKeySchema,
			z.lazy((): z.ZodType => INoriCollection)
		)
		.optional()
});

export type INoriMetadata = z.infer<typeof MetadataSchema>;
export const MetadataSchema = z.object({
	generator: z.object({
		name: z.string().optional(),
		version: z.string().optional()
	})
});

export const IYamlSchema = z.object({
	metadata: MetadataSchema.optional(),
	collections: z.record(YamlKeySchema, INoriCollection).optional()
});
