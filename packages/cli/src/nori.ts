import { ArgumentOption, Command } from "@nori/command-line-interpreter/cli-schema.js";
import CommandLineInterpreter from "@nori/command-line-interpreter/index.js";
import logger from "@nori/logger.js";

import NoriEnvironment from "@nori/environment/environment-loader.js";
import { runHelpCommand } from "./features/index.js";
import { runInitCommand } from "./features/init/index.js";

const main = async () => {
	const cli = new CommandLineInterpreter();
	const environment = new NoriEnvironment();

	const args = cli.args;
	const command = cli.command;

	logger.debug("Parsed Command Line Arguments:", args);
	logger.debug("Parsed Command:", command);

	if (args[ArgumentOption.Help]) return runHelpCommand();

	if (args[ArgumentOption.Env]) environment.loadEnv(args[ArgumentOption.Env]);
	if (args[ArgumentOption.Init]) return runInitCommand(environment);

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
