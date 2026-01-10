import { Enum, type EnumValue } from "../utils/enum.js";

export type NoriLocale = EnumValue<typeof NoriLocale>;
export const [NoriLocale, NoriLocaleMeta] = Enum({
	EnglishBritish: "enGB",
	Japanese: "ja"
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

export type NoriEntryParamType = EnumValue<typeof NoriEntryParamTypes>;
export const [NoriEntryParamTypes] = Enum({
	String: "string",
	Boolean: "boolean",
	Number: "number"
});
