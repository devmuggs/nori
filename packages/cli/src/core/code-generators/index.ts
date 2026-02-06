import logger from "../logger.js";
import type { NoriYaml } from "../state/state-schemas.js";
import { Enum, type EnumValue } from "../utils/enum.js";
import { PythonCodeGenerator } from "./python-code-generator/index.js";
import { TypeScriptCodeGenerator } from "./typescript-code-generator/index.js";

export type SupportedCodeGenerator = EnumValue<typeof SupportedCodeGenerator>;
export const [SupportedCodeGenerator] = Enum({
	TypeScript: "typescript",
	Python: "python"
});

export const codeGeneratorFactory = (generatorType: SupportedCodeGenerator): ICodeGenerator => {
	const generatorMap: Record<SupportedCodeGenerator, ICodeGenerator> = {
		[SupportedCodeGenerator.TypeScript]: new TypeScriptCodeGenerator(),
		[SupportedCodeGenerator.Python]: new PythonCodeGenerator()
	};

	const generator = generatorMap[generatorType];
	if (!generator) {
		logger.error(`Unsupported code generator type: ${generatorType}`);
		throw new Error(`Unsupported code generator type: ${generatorType}`);
	}

	return generator;
};

export interface ICodeGenerator {
	generate(collection: NoriYaml): string;
}
