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
	Default: "default",
	Optional: "optional"
});

export type NoriEntryParamType = EnumValue<typeof NoriEntryParamType>;
export const [NoriEntryParamType] = Enum({
	String: "string",
	Boolean: "boolean",
	Number: "number"
});

export interface NoriI18nCollection extends Readonly<Partial<Record<NoriLocale, string>>> {
	_meta: {
		kind: "noriI18nCollection";
	};
}

export const createNoriI18nCollection =
	<TProps extends Record<string, unknown> | never = never>(
		builder: (props: TProps) => Omit<NoriI18nCollection, "_meta">
	) =>
	(props: TProps): NoriI18nCollection => {
		return Object.freeze({
			...builder(props),
			_meta: {
				kind: "noriI18nCollection"
			} as const
		} as const) as NoriI18nCollection;
	};

export const isNoriI18nCollection = (obj: unknown): obj is NoriI18nCollection => {
	if (typeof obj !== "object" || obj === null) return false;
	const record = obj as Record<string, unknown>;
	if ((record["_meta"] as { _kind?: string })?._kind !== "noriI18nCollection") return false;
	for (const localeKey of Object.keys(NoriLocale)) {
		const localeValue = NoriLocale[localeKey as keyof typeof NoriLocale];
		if (typeof record[localeValue] !== "string") {
			return false;
		}
	}
	return true;
};
