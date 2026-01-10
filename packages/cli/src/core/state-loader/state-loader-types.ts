import { Enum, type EnumValue } from "../utils/enum.js";

export type NoriLocale = EnumValue<typeof NoriLocale>;
export const [NoriLocale] = Enum({
	English: "en",
	Japanese: "ja"
});

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
