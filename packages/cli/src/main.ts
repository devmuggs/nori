import Commands from "./commands/index.js";
import { ArgumentOption } from "./core/command-line-interface/cli-schema.js";
import CommandLineInterface from "./core/command-line-interface/index.js";
import NoriEnvironment from "./core/environment/environment-loader.js";
import { InputManager } from "./core/input-manager/index.js";
import logger from "./core/logger.js";

const main = async () => {
	const environment = new NoriEnvironment();
	const input = new InputManager(environment);
	const cli = new CommandLineInterface(input);

	const args = cli.args;
	const command = cli.command;

	logger.debug("Parsed Command Line Arguments:", args);
	logger.debug("Parsed Command:", command);

	if (args[ArgumentOption.Env]) {
		environment.loadEnv(args[ArgumentOption.Env]);
	}

	const commandClass = Commands[command];

	if (commandClass) {
		const commandInstance = new commandClass();
		try {
			await commandInstance.execute({ environment, cli });
		} catch (error) {
			logger.error("An error occurred while executing the command:");
			logger.error(error);
			process.exit(0);
		}
		return;
	}

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
