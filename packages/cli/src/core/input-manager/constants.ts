import { LanguageCode } from "../locales/locale-enums.js";
import { createNoriI18nCollection } from "../locales/locale-utils.js";

export const YesNoOptions = Object.freeze([
	{
		label: createNoriI18nCollection({
			[LanguageCode.EnglishBritish]: "Yes",
			[LanguageCode.Japanese]: "はい"
		}),
		value: true
	},
	{
		label: createNoriI18nCollection({
			[LanguageCode.EnglishBritish]: "No",
			[LanguageCode.Japanese]: "いいえ"
		}),
		value: false
	}
] as const);

export const LocaleOptions = Object.freeze([
	{
		label: createNoriI18nCollection({
			[LanguageCode.EnglishBritish]: "English (British)",
			[LanguageCode.Japanese]: "英語（英国）"
		}),
		value: LanguageCode.EnglishBritish
	},
	{
		label: createNoriI18nCollection({
			[LanguageCode.EnglishBritish]: "Japanese (日本語)",
			[LanguageCode.Japanese]: "日本語（日本語）"
		}),
		value: LanguageCode.Japanese
	}
] as const);

export const Messages = Object.freeze({
	InvalidInput: createNoriI18nCollection({
		[LanguageCode.EnglishBritish]: "Invalid input. Please try again.",
		[LanguageCode.Japanese]: "無効な入力です。もう一度お試しください。"
	}),
	SelectPreferredLocale: createNoriI18nCollection({
		[LanguageCode.EnglishBritish]: "Select your preferred locale:",
		[LanguageCode.Japanese]: "希望のロケールを選択してください："
	})
});
