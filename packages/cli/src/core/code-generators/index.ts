import logger from "../logger.js";
import type { NoriManager } from "../state-loader/index.js";
import { Enum } from "../utils/enum.js";

const [SupportedCodeGenerators] = Enum({
	TypeScript: "typescript",
	Python: "python"
});

export type CodeGeneratorStrategy = (noriManager: NoriManager) => Promise<void>;

export const CodeGenerators: Record<
	(typeof SupportedCodeGenerators)[keyof typeof SupportedCodeGenerators],
	CodeGeneratorStrategy
> = {
	[SupportedCodeGenerators.TypeScript]: async (noriManager: NoriManager) => {
		logger.debug("TypeScript code generator is not yet implemented.");
	},
	[SupportedCodeGenerators.Python]: async (noriManager: NoriManager) => {
		logger.debug("Python code generator is not yet implemented.");
	}
} as const;
