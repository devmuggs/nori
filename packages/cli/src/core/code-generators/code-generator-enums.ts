import { Enum, type EnumValue } from "../utils/enum.js";

export type SupportedLanguage = EnumValue<typeof SupportedLanguage>;
export const [SupportedLanguage, SupportedLanguageMeta] = Enum({
	TypeScript: "typescript",
	Python: "python"
});

export const SupportedLanguageExtension = SupportedLanguageMeta.derive({
	[SupportedLanguage.TypeScript]: "ts",
	[SupportedLanguage.Python]: "py"
});
