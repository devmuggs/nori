import { ArgumentOption, Command } from "@nori/command-line-interpreter/cli-schema.js";
import CommandLineInterface from "@nori/command-line-interpreter/index.js";
import logger from "@nori/logger.js";

import { select } from "@inquirer/prompts";
import NoriEnvironment from "@nori/environment/environment-loader.js";
import { InputManager } from "@nori/input-manager/index.js";
import { NoriLocale, NoriLocaleMeta } from "@nori/state-loader/index.js";
import { runHelpCommand } from "./features/index.js";
import { runInitCommand } from "./features/init/index.js";

const main = async () => {
	const environment = new NoriEnvironment();
	const input = new InputManager(environment);
	const cli = new CommandLineInterface(input);

	const args = cli.args;
	const command = cli.command;

	logger.debug("Parsed Command Line Arguments:", args);
	logger.debug("Parsed Command:", command);

	if (args[ArgumentOption.Help] || command === Command.Base)
		return runHelpCommand({ environment, cli });
	if (args[ArgumentOption.Env]) environment.loadEnv(args[ArgumentOption.Env]);
	if (args[ArgumentOption.Init]) return runInitCommand({ environment, cli });

	if (args.kind === Command.Config) {
		if (args[ArgumentOption.SetLocale] !== undefined) {
			if (args[ArgumentOption.SetLocale] === true) {
				select({
					message: "Select your preferred locale:",
					choices:
						Object.values(NoriLocale).map((locale) => ({
							name: locale,
							value: locale
						})) || [],
					default: environment.preferences.preferredLocale || NoriLocale.EnglishBritish
				}).then((selectedLocale) => {
					environment.preferences.preferredLocale = selectedLocale as any;
					environment.persistEnv();
					logger.log(`Preferred locale set to ${selectedLocale}`);
				});
			} else if (NoriLocaleMeta.evaluateIsValue(args[ArgumentOption.SetLocale])) {
				environment.preferences.preferredLocale = args[
					ArgumentOption.SetLocale
				] as NoriLocale;
				environment.persistEnv();
				logger.log(`Preferred locale set to ${args[ArgumentOption.SetLocale]}`);
			} else {
				logger.error(`Invalid locale: ${args[ArgumentOption.SetLocale]}. No changes made.`);
			}
			return;
		}
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
