import { ArgumentShape, type ArgumentShapeEvaluatorMap } from "./cli-types.js";

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

export const ArgumentShapeEvaluators: ArgumentShapeEvaluatorMap = {
	[ArgumentShape.Flag]: (arg: string) => {
		const fullKey = arg; // remove leading '--'
		const key = fullKey.startsWith("--") ? fullKey.slice(2) : fullKey;
		if (!key?.trim()) throw new Error(`Invalid flag argument format: ${arg}`);
		return { key, value: true };
	},
	[ArgumentShape.KeyValue]: (arg: string) => {
		const [fullKey, value] = arg.split(" ");
		const key = fullKey && fullKey.startsWith("--") ? fullKey.slice(2) : fullKey;

		if (!key?.trim() || !value) {
			throw new Error(`Invalid key-value argument format: ${arg}`);
		}

		return { key, value };
	},
	[ArgumentShape.KeyEqualsValue]: (arg: string) => {
		const [fullKey, value] = arg.split("=");
		const key = fullKey && fullKey.startsWith("--") ? fullKey.slice(2) : fullKey;

		if (!key?.trim() || !value) {
			throw new Error(`Invalid key-equals-value argument format: ${arg}`);
		}

		return { key, value };
	}
};
