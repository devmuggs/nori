import { type EnumValue, Enum } from "../utils/enum.js";

export type LanguageCode = EnumValue<typeof LanguageCode>;
export const [LanguageCode, LanguageCodeMeta] = Enum({
	EnglishBritish: "en-GB",
	Japanese: "ja-JP"
});

export type NoriLocaleConfigurationType = {
	displayName: string;
	description: string;
};

export const NoriLocaleConfiguration: Record<LanguageCode, NoriLocaleConfigurationType> =
	LanguageCodeMeta.derive({
		[LanguageCode.EnglishBritish]: {
			displayName: "English (British)",
			description: "English language as used in the United Kingdom."
		},
		[LanguageCode.Japanese]: {
			displayName: "日本語",
			description: "日本で使用される日本語。"
		}
	});
