import { LanguageCode } from "@nori/core";
import z from "zod";
import { SupportedLanguage } from "../code-generators/code-generator-enums.js";

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
				directory: z.string()
				// mode: z.enum(OutputMode).default(OutputMode.Monolithic)
			})
		)
		.default({
			[SupportedLanguage.TypeScript]: {
				directory: ".generated/nori/"
				// mode: OutputMode.Monolithic
			},
			[SupportedLanguage.Python]: {
				directory: ".generated/nori/"
				// mode: OutputMode.Monolithic
			}
		}),
	preferences: z
		.object({
			preferredLocale: z.enum(Object.values(LanguageCode)).optional()
		})
		.default({ preferredLocale: undefined })
});
