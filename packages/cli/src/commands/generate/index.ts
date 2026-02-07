import {
	SupportedLanguageExtension,
	SupportedLanguageMeta
} from "../../core/code-generators/code-generator-enums.js";
import { FileSystem } from "../../core/filesystem/index.js";
import logger from "../../core/logger.js";
import type { CommandContext } from "../index.js";

import { NoriYamlSchema } from "@nori/core";
import Yaml from "@nori/core/state/state-utils.js";
import { codeGeneratorFactory } from "../../core/index.js";

export class GenerateCommand {
	public async execute({ environment }: CommandContext): Promise<void> {
		const inputTargetPath = environment.input.target; // e.g., ./nori.yaml
		const fileSystem = new FileSystem();

		logger.info(`Loading input target from: ${inputTargetPath}`);
		let object: unknown;
		try {
			object = await Yaml.ingest(inputTargetPath);
		} catch (error) {
			logger.error(`Failed to read or parse input target at path: ${inputTargetPath}`);
			throw error;
		}

		logger.info("Yaml parsed successfully. Validating...");
		const yamlParse = NoriYamlSchema.safeParse(object);
		if (!yamlParse.success) {
			logger.error(`Input target at path: ${inputTargetPath} is not a valid Nori YAML file.`);
			logger.error(yamlParse.error.issues);
			throw new Error("Invalid Nori YAML file.");
		}

		const data = yamlParse.data;

		logger.info("Generating code...");

		// remove the existing generated code directory
		const generatedCodeDir = FileSystem.normalisePath(`${"./.generated"}/nori`);
		if (fileSystem.exists(generatedCodeDir)) {
			logger.info(`Removing existing generated code directory at: ${generatedCodeDir}`);
			fileSystem.remove(generatedCodeDir, { recursive: true });
		}

		// generate code for each supported language

		for (const supportedLanguage of SupportedLanguageMeta.values) {
			const config = environment.output?.[supportedLanguage];
			if (!config) continue;

			const outputDir = config.directory;
			if (!fileSystem.exists(outputDir)) {
				fileSystem.mkDir(outputDir, { recursive: true });
			}

			const outputFilePath = FileSystem.normalisePath(
				`${outputDir}/nori.${SupportedLanguageExtension[supportedLanguage]}`
			);
			const outputContent = codeGeneratorFactory(supportedLanguage).generate(data);

			fileSystem.writeFile(outputFilePath, outputContent, { mode: "overwrite" });
			logger.success(`\tGenerated ${supportedLanguage} code at: ${outputFilePath}`);
		}

		logger.info("Code generation completed.");
	}
}
