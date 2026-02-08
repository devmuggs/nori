import { type EnumValue, Enum } from "@nori/core";

export type SupportedLanguage = EnumValue<typeof SupportedLanguage>;
export const [SupportedLanguage, SupportedLanguageMeta] = Enum({
	TypeScript: "typescript",
	Python: "python"
});

export const SupportedLanguageExtension = SupportedLanguageMeta.derive({
	[SupportedLanguage.TypeScript]: "ts",
	[SupportedLanguage.Python]: "py"
});
