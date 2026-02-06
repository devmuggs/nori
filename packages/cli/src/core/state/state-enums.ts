import { Enum, type EnumValue } from "../utils/enum.js";

export type NoriLocaleItemParamOption = EnumValue<typeof ParamOption>;
export const [ParamOption, ParamOptionMeta] = Enum({
	Description: "description",
	Type: "type",
	Default: "default",
	Optional: "optional"
});

export type ParamType = EnumValue<typeof ParamType>;
export const [ParamType, ParamTypeMeta] = Enum({
	String: "string",
	Boolean: "boolean",
	Number: "number"
});
