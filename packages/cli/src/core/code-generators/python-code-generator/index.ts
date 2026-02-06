import type { ICodeGenerator } from "../index.js";

export class PythonCodeGenerator implements ICodeGenerator {
	generate(collection: unknown): string {
		throw new Error("Method not implemented.");
	}
}
