import logger from "../logger.js";
import type { NoriCollection, NoriEntry } from "../state-loader/index.js";
import { Enum, type EnumValue } from "../utils/enum.js";
import { TypeScriptCodeGenerator } from "./typescript-code-generator/index.js";

export type SupportedCodeGenerator = EnumValue<typeof SupportedCodeGenerator>;
export const [SupportedCodeGenerator] = Enum({
	TypeScript: "typescript",
	Python: "python"
});

export const codeGeneratorFactory = (generatorType: SupportedCodeGenerator): ICodeGenerator => {
	switch (generatorType) {
		case SupportedCodeGenerator.TypeScript: {
			return new TypeScriptCodeGenerator();
		}
		default: {
			logger.error(`Unsupported code generator type: ${generatorType}`);
			throw new Error(`Unsupported code generator type: ${generatorType}`);
		}
	}
};

export interface ICodeGenerator {
	generateCode(): string;
	generateFileHeader(): string;

	generateManager(): string;

	generateCollection(collection: NoriCollection): string;

	generateEntryFunctionSignature(entry: NoriEntry): string;
	generateEntryFunctionBody(entry: NoriEntry): string;
	generateEntry(entry: NoriEntry): string;
}
