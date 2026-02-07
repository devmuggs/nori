import { Enum, type EnumValue } from "@nori/core";

/** Shapes that CLI arguments can take */
export type ArgumentShape = EnumValue<typeof ArgumentShape>;

/** Shapes that CLI arguments can take */
export const [ArgumentShape] = Enum({
	/** --flag (i.e. --help) */
	Flag: "flag",
	/** --key value (i.e. --output file.txt) */
	KeyValue: "key-value",
	/** --key=value (i.e. --output=file.txt) */
	KeyEqualsValue: "key-equals-value"
});

export type KeyValuePair<TValue> = Readonly<{
	key: string;
	value: TValue;
}>;

export type ArgumentShapeFlagEvaluatorFunction = (arg: string) => KeyValuePair<boolean>;
export type ArgumentShapeKeyValueEvaluatorFunction = (arg: string) => KeyValuePair<string>;
export type ArgumentShapeKeyEqualsValueEvaluatorFunction = (arg: string) => KeyValuePair<string>;

export type ArgumentShapeEvaluatorMap = {
	[ArgumentShape.Flag]: ArgumentShapeFlagEvaluatorFunction;
	[ArgumentShape.KeyValue]: ArgumentShapeKeyValueEvaluatorFunction;
	[ArgumentShape.KeyEqualsValue]: ArgumentShapeKeyEqualsValueEvaluatorFunction;
};
