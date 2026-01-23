import { loadEnvironment } from "@nori";
import { ArgumentOption, Command } from "@nori/command-line-interpreter/cli-types.js";
import cli from "@nori/command-line-interpreter/index.js";
import logger from "@nori/logger.js";
import { runHelpCommand } from "./features/index.js";
import { runGenerateCommand } from "./features/init/index.js";

const main = async () => {
	const args = cli.args;
	const command = cli.command;

	logger.trace("Parsed Command Line Arguments:", args);
	logger.trace("Parsed Command:", command);

	if (args[ArgumentOption.Help]) return runHelpCommand();
	if (args[ArgumentOption.Env]) loadEnvironment(args[ArgumentOption.Env]);
	if (command === Command.Generate) return runGenerateCommand();

	logger.log("No command provided. Use --help to see available commands.");
	process.exit(0);
};

main().catch((error) => {
	if (error instanceof Error && error.message === "User force closed the prompt with SIGINT") {
		process.exit(0);
	}

	logger.error("An error occurred:");
	logger.error(error);
	process.exit(1);
});
