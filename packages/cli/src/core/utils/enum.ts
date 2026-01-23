export type RecordKey = string;
export type RecordEnumValue = string | number | symbol;

export type EnumLike<T extends RecordEnumValue> = { [key in T]: T };
export type EnumValue<T extends EnumLike<RecordEnumValue>> = T[keyof T];
export type EnumKey<T extends EnumLike<RecordEnumValue>> = keyof T;

const _derive = <
	const T extends EnumLike<RecordEnumValue>,
	const U extends Readonly<Partial<Record<EnumValue<T>, unknown>>>
>(
	enumObj: T,
	record: U
) => {
	const result: Partial<Record<EnumValue<T>, unknown>> = {};
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
			const pickSet = new Set(values);

			// Find the keys for the picked values
			const pickedEntries = Object.entries(enumObj).filter(([, value]) =>
				pickSet.has(value as EnumValue<T>)
			) as [EnumKey<T>, EnumValue<T>][]; // type assertion for TS

			// Build the picked enum object
			const picked = Object.fromEntries(pickedEntries) as {
				[K2 in EnumKey<T> as T[K2] extends K[number] ? K2 : never]: T[K2];
			};

			return Object.freeze({
				...picked,
				derive: <const K3 extends Partial<Record<EnumValue<typeof picked>, unknown>>>(
					derivedRecord: K3
				) => {
					return _derive(picked, derivedRecord);
				}
			});
		},

		omit: <const K extends EnumValue<T>[]>(values: K) => {
			const omitSet = new Set(values);

			// Find the keys for the omitted values
			const omittedEntries = Object.entries(enumObj).filter(
				([, value]) => !omitSet.has(value as EnumValue<T>)
			) as [EnumKey<T>, EnumValue<T>][]; // type assertion for TS

			// Build the omitted enum object
			const omitted = Object.fromEntries(omittedEntries) as {
				[K2 in EnumKey<T> as T[K2] extends K[number] ? never : K2]: T[K2];
			};

			return Object.freeze({
				...omitted,
				derive: <const K3 extends Partial<Record<EnumValue<typeof omitted>, unknown>>>(
					derivedRecord: K3
				) => {
					return _derive(omitted, derivedRecord);
				}
			});
		}
	});

	return [enumObj, metadata] as const;
};

const [colours] = Enum({
	Red: "red",
	Green: "green",
	Blue: "blue"
});
