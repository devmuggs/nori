import { environment } from "../environment-loader.js";
import { Enum, type EnumValue } from "../utils/enum.js";

export type NoriLocale = EnumValue<typeof NoriLocale>;
export const [NoriLocale, NoriLocaleMeta] = Enum({
	EnglishBritish: "en-GB",
	Japanese: "ja-JP"
});

export type NoriLocaleConfigurationType = {
	displayName: string;
	description: string;
};

export const NoriLocaleConfiguration: Record<NoriLocale, NoriLocaleConfigurationType> = {
	[NoriLocale.EnglishBritish]: {
		displayName: "English (UK)",
		description: "British English"
	},
	[NoriLocale.Japanese]: {
		displayName: "日本語",
		description: "Japanese"
	}
} as const;

export type NoriLocaleItemParamOption = EnumValue<typeof NoriLocaleItemParamOptions>;
export const [NoriLocaleItemParamOptions] = Enum({
	Description: "description",
	Type: "type",
	Default: "default"
});

export type NoriEntryParamType = EnumValue<typeof NoriEntryParamType>;
export const [NoriEntryParamType] = Enum({
	String: "string",
	Boolean: "boolean",
	Number: "number"
});

export type NoriI18nCollection = Record<NoriLocale, string>;
export const NoriI18nCollection = (
	locales: Partial<Record<NoriLocale, string>>,
	defaultLocale: NoriLocale = NoriLocale.EnglishBritish
): NoriI18nCollection => {
	const collection: NoriI18nCollection = {
		[NoriLocale.EnglishBritish]: "",
		[NoriLocale.Japanese]: ""
	};

	for (const localeKey of Object.values(NoriLocale)) {
		collection[localeKey] = locales[localeKey] ?? locales[defaultLocale] ?? "";
	}

	return collection;
};
