export type RecordEnumValue = string | number | symbol;
export type EnumLike<T extends RecordEnumValue> = {
	[key: string]: T;
};

export type EnumValue<T extends EnumLike<RecordEnumValue>> = T[keyof T];
export type EnumKey<T extends EnumLike<RecordEnumValue>> = keyof T;

export type EnumKeyFromValue<T extends EnumLike<RecordEnumValue>, V extends EnumValue<T>> = {
	[K in EnumKey<T>]: T[K] extends V ? K : never;
}[EnumKey<T>];

export type EnumPick<T extends EnumLike<RecordEnumValue>, K extends readonly EnumValue<T>[]> = {
	[K2 in EnumKey<T> as T[K2] extends K[number] ? K2 : never]: T[K2];
};

export type EnumOmit<T extends EnumLike<RecordEnumValue>, K extends readonly EnumValue<T>[]> = {
	[K2 in EnumKey<T> as T[K2] extends K[number] ? never : K2]: T[K2];
};

const _pick = <const T extends EnumLike<RecordEnumValue>, const K extends readonly EnumValue<T>[]>(
	enumObj: T,
	keys: K
): EnumPick<T, K> => {
	const result = {} as EnumPick<T, K>;
	for (const key in enumObj) {
		if (keys.includes(enumObj[key] as EnumValue<T>)) {
			(result as Record<string, unknown>)[key] = enumObj[key];
		}
	}
	return result;
};

const _omit = <const T extends EnumLike<RecordEnumValue>, const K extends readonly EnumValue<T>[]>(
	enumObj: T,
	values: K
): EnumOmit<T, K> => {
	const result = {} as EnumOmit<T, K>;
	const valueSet = new Set(values);

	for (const key in enumObj) {
		if (!valueSet.has(enumObj[key] as EnumValue<T>)) {
			(result as Record<string, unknown>)[key] = enumObj[key];
		}
	}

	if (Object.keys(result).length + values.length !== Object.keys(enumObj).length) {
		throw new Error("Some values to omit were not found in the enum");
	}

	return result;
};

const _derive = <
	const T extends EnumLike<RecordEnumValue>,
	const U extends Readonly<Partial<Record<EnumValue<T>, unknown>>>
>(
	enumObj: T,
	record: U
) => {
	const result: Record<EnumValue<T>, unknown> = {} as Record<EnumValue<T>, unknown>;
	for (const key of Object.values(enumObj) as EnumValue<T>[]) {
		if (key in record) {
			result[key] = record[key];
		} else {
			throw new Error(`Missing derived value for key "${String(key)}"`);
		}
	}
	return Object.freeze(result) as Readonly<{ [key in EnumValue<T>]: U[key] }>;
};

/** Utility to create enums with metadata and helper functions */
export const Enum = <const T extends EnumLike<RecordEnumValue>>(obj: T) => {
	/** Immutable enum object */
	const enumObj = Object.freeze(obj);

	const _reverseLookup: Record<EnumValue<T>, EnumKey<T>> = Object.fromEntries(
		Object.entries(enumObj).map(([key, value]) => [value, key])
	) as Record<EnumValue<T>, EnumKey<T>>;

	/** Metadata and utility functions for the enum */
	const metadata = Object.freeze({
		/** All values of the enum */
		values: Object.values(enumObj) as Array<T[keyof T]>,

		/** All keys of the enum */
		keys: Object.keys(enumObj) as EnumKey<T>[],

		/** Check if a given value exists in the enum */
		evaluateIsValue: (value: unknown): value is EnumValue<T> => {
			return new Set(Object.values(enumObj)).has(value);
		},

		/** Check if a given key exists in the enum */
		evaluateIsKey: (key: unknown): key is EnumKey<T> => {
			return (
				(typeof key === "string" || typeof key === "number" || typeof key === "symbol") &&
				key in enumObj
			);
		},

		/** Get the key corresponding to a given enum value */
		reverseLookup: (value: EnumValue<T>): EnumKey<T> | undefined => _reverseLookup[value],

		/** Derive metadata for each enum value */
		derive: <const U extends Readonly<Record<EnumValue<T>, unknown>>>(derivedRecord: U) => {
			return _derive(enumObj, derivedRecord);
		},

		pick: <const K extends EnumValue<T>[]>(values: K) => {
			const picked = _pick(enumObj, values);

			return Object.freeze({
				...picked,
				derive: <const U extends Readonly<Record<EnumValue<typeof picked>, unknown>>>(
					derivedRecord: U
				) => {
					return _derive(picked, derivedRecord);
				}
			});
		},

		omit: <const K extends EnumValue<T>[]>(values: K) => {
			const omitted = _omit(enumObj, values);

			return Object.freeze({
				...omitted,
				derive: <const U extends Readonly<Record<EnumValue<typeof omitted>, unknown>>>(
					derivedRecord: U
				) => {
					return _derive(omitted, derivedRecord);
				}
			});
		}
	});

	return [enumObj, metadata] as const;
};
