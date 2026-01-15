import {
	codeGeneratorFactory,
	environment,
	Initialiser,
	loadEnvironment,
	NoriManager,
	SupportedCodeGenerator
} from "@nori";
import { NoriCommand } from "@nori/args-evaluator/arg-evaluator-types.js";
import CommandEvaluator from "@nori/args-evaluator/index.js";
import logger from "@nori/logger.js";
import fs from "fs";
import { TypeScriptCodeGenerator } from "./core/code-generators/typescript-code-generator/index.js";

const main = async () => {
	logger.success("CLI started");

	CommandEvaluator.applySideEffects();

	const { args: args } = CommandEvaluator;
	if (!("env" in args)) loadEnvironment("../../.env");

	await CommandEvaluator.executeCommand({
		[NoriCommand.Init]: async () => {
			logger.info("Initializing Nori project...");
			await Initialiser.initialiseProject();
			logger.success("Project initialized.");
		},

		[NoriCommand.Generate]: async () => {
			environment.NoriYamlPath
				? logger.info(`Using Nori YAML at ${environment.NoriYamlPath}`)
				: logger.warn("No Nori YAML path specified; using default path.");

			if (!environment.NoriYamlPath) {
				logger.error("NORI_YAML_PATH environment variable is not set.");
				process.exit(1);
			}

			logger.info("Generating...");

			await NoriManager.loadFromYaml();

			const generator = codeGeneratorFactory(SupportedCodeGenerator.TypeScript);
			if (!(generator instanceof TypeScriptCodeGenerator)) {
				logger.error("Selected code generator is not TypeScriptCodeGenerator.");
				process.exit(1);
			}

			const tsCode = generator.generateCode();

			// Output the generated code to a file or stdout as needed
			fs.writeFileSync("nori-generated.ts", tsCode);
			logger.success("Generation complete.");

			// format the generated file using prettier
			const { exec } = await import("child_process");
			exec("npx prettier --write nori-generated.ts", (error, stdout, stderr) => {
				if (error) {
					logger.error(`Error formatting generated code: ${error.message}`);
					return;
				}
				if (stderr) {
					logger.error(`Prettier stderr: ${stderr}`);
					return;
				}
				logger.info(`Formatted generated code:\n${stdout}`);
			});
		}
	});

	logger.success("CLI finished");
};

main().catch((error) => {
	logger.error("An error occurred:");
	logger.error(error);
	process.exit(1);
});
