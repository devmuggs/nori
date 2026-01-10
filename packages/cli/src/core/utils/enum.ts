export type EnumValue<T extends Record<string | number | symbol, unknown>> = T[keyof T];
export type EnumKey<T extends Record<string | number | symbol, unknown>> = keyof T;

export const Enum = <const T extends Record<string | number | symbol, unknown>>(obj: T) => {
	const enumObj = Object.freeze(obj);
	const metadata = Object.freeze({
		values: Object.values(enumObj) as Array<T[keyof T]>,
		keys: Object.keys(enumObj) as EnumKey<T>[],
		evaluateIsValue: (value: unknown): value is EnumValue<T> => {
			return new Set(Object.values(enumObj)).has(value);
		},
		evaluateIsKey: (key: unknown): key is EnumKey<T> => {
			return (
				(typeof key === "string" || typeof key === "number" || typeof key === "symbol") &&
				key in enumObj
			);
		}
	});

	return [enumObj, metadata] as const;
};
