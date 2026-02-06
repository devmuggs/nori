import type { LanguageCode } from "./locale-enums.js";
import type { NoriI18nCollection } from "./locale-types.js";

export const createNoriI18nCollection = (
	collection: Readonly<Record<LanguageCode, string>>
): Readonly<NoriI18nCollection> => {
	return Object.freeze({
		...collection,
		_meta: {
			kind: "noriI18nCollection" as const
		}
	});
};

export const createNoriI18nCollectionGenerator = <TParams extends Record<string, unknown>>(
	generator: (params: TParams) => Readonly<NoriI18nCollection>
) => {
	return (params: TParams): Readonly<NoriI18nCollection> => {
		return generator(params);
	};
};

export const isNoriI18nCollection = (obj: unknown): obj is Readonly<NoriI18nCollection> => {
	return (obj as any)?._meta?.kind === "noriI18nCollection";
};
