import { ArgumentOption, Command } from "@nori/command-line-interpreter/cli-schema.js";
import CommandLineInterpreter from "@nori/command-line-interpreter/index.js";
import logger from "@nori/logger.js";
import { environment } from "./core/index.js";
import { runHelpCommand } from "./features/index.js";
import { runInitCommand } from "./features/init/index.js";

const main = async () => {
	CommandLineInterpreter.start();

	const args = CommandLineInterpreter.args;
	const command = CommandLineInterpreter.command;

	logger.debug("Parsed Command Line Arguments:", args);
	logger.debug("Parsed Command:", command);

	if (args[ArgumentOption.Help]) return runHelpCommand();
	if (args[ArgumentOption.Env]) environment.loadEnv(args[ArgumentOption.Env]);
	if (command === Command.Generate) return runInitCommand();

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
