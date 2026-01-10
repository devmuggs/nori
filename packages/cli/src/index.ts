import CommandEvaluator, { NoriCommands } from "./core/args-evaluator/index.js";
import { loadEnvironment } from "./core/environment-loader.js";
import { Initialiser } from "./core/initialiser/index.js";
import logger from "./core/logger.js";
import { NoriManager } from "./core/state-loader/index.js";

const main = async () => {
	logger.success("CLI started");

	CommandEvaluator.applySideEffects();

	const { args: args } = CommandEvaluator;
	if (!("env" in args)) loadEnvironment("../../.env");

	await CommandEvaluator.executeCommand({
		[NoriCommands.Init]: async () => {
			logger.info("Initializing Nori project...");
			await Initialiser.initialiseProject();
			logger.success("Project initialized.");
		},
		[NoriCommands.Generate]: async () => {
			logger.info("Generating...");
			await NoriManager.loadFromYaml();
			NoriManager.debugPrint();
			logger.success("Generation complete.");
		}
	});

	logger.success("CLI finished");
};

main().catch((error) => {
	logger.error("An error occurred:");
	logger.error(error);
	process.exit(1);
});
