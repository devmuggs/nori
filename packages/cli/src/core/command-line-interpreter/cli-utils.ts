import { ArgumentShape, type ArgumentShapeEvaluatorMap, type KeyValuePair } from "./cli-types.js";

/** Evaluate the shape of a given argument string
 * @param arg The argument string to evaluate
 * @returns The determined ArgumentShape
 *
 * @example
 * evaluateArgumentShape("--help") // ArgumentShape.Flag
 * evaluateArgumentShape("--output file.txt") // ArgumentShape.KeyValue
 * evaluateArgumentShape("--output=file.txt") // ArgumentShape.KeyEqualsValue
 */
export const evaluateArgumentShape = (arg: string): ArgumentShape => {
	if (arg.split("=").length === 2) return ArgumentShape.KeyEqualsValue;
	if (arg.split(" ").length === 2) return ArgumentShape.KeyValue;
	if (!arg.includes(" ")) return ArgumentShape.Flag;

	throw new Error(`Unable to evaluate argument shape for: ${arg}`);
};

const normaliseKey = (fullKey: string | undefined): string => {
	return fullKey && fullKey.startsWith("--") ? fullKey.slice(2) : fullKey || "";
};

class ArgumentShapeError extends Error {
	constructor(arg: string, message = `Invalid argument format for shape evaluation: ${arg}`) {
		super(message);
		this.name = "ArgumentShapeError";
	}
}

const extractKeyValuePair = <TValue extends string | boolean>(
	arg: string,
	delimiter: string | undefined,
	defaultValue?: TValue
): { key: string; value: TValue } => {
	const [fullKey, value] = delimiter ? arg.split(delimiter) : [arg, defaultValue];
	const key = normaliseKey(fullKey);
	if (!key?.trim() || value === undefined) throw new ArgumentShapeError(arg);
	return Object.freeze({ key, value: value as TValue });
};

/** Evaluators for each ArgumentShape */
export const ArgumentShapeEvaluators: ArgumentShapeEvaluatorMap = {
	[ArgumentShape.Flag]: (arg: string) => extractKeyValuePair<boolean>(arg, undefined, true),
	[ArgumentShape.KeyValue]: (arg: string) => extractKeyValuePair<string>(arg, " "),
	[ArgumentShape.KeyEqualsValue]: (arg: string) => extractKeyValuePair<string>(arg, "=")
};
