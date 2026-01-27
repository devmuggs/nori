import { createNoriI18nCollection, NoriLocale } from "@nori/state-loader/state-loader-types.js";

export const YesNoOptions = Object.freeze([
	{
		label: createNoriI18nCollection({
			[NoriLocale.EnglishBritish]: "Yes",
			[NoriLocale.Japanese]: "はい"
		}),
		value: true
	},
	{
		label: createNoriI18nCollection({
			[NoriLocale.EnglishBritish]: "No",
			[NoriLocale.Japanese]: "いいえ"
		}),
		value: false
	}
] as const);

export const LocaleOptions = Object.freeze([
	{
		label: createNoriI18nCollection({
			[NoriLocale.EnglishBritish]: "English (British)",
			[NoriLocale.Japanese]: "英語（英国）"
		}),
		value: NoriLocale.EnglishBritish
	},
	{
		label: createNoriI18nCollection({
			[NoriLocale.EnglishBritish]: "Japanese (日本語)",
			[NoriLocale.Japanese]: "日本語（日本語）"
		}),
		value: NoriLocale.Japanese
	}
] as const);

export const Messages = Object.freeze({
	InvalidInput: createNoriI18nCollection({
		[NoriLocale.EnglishBritish]: "Invalid input. Please try again.",
		[NoriLocale.Japanese]: "無効な入力です。もう一度お試しください。"
	}),
	SelectPreferredLocale: createNoriI18nCollection({
		[NoriLocale.EnglishBritish]: "Select your preferred locale:",
		[NoriLocale.Japanese]: "希望のロケールを選択してください："
	})
});
