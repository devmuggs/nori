import {
	ArgumentOption,
	ArgumentOptionConfig,
	CommandConfig
} from "@nori/command-line-interpreter/cli-types.js";
import CommandLineInterpreter from "@nori/command-line-interpreter/index.js";
import logger from "@nori/logger.js";

const main = async () => {
	const cli = new CommandLineInterpreter();

	const args = cli.args;
	const command = cli.command;

	if (args[ArgumentOption.Help]) {
		logger.info(`Available Commands and Options:
Usage: nori [command] [options]

Commands:
${Object.entries(CommandConfig)
	.map(([command, config]) => {
		return `  ${command}\t\t${config.description}`;
	})
	.join("\n")}

Options:
${Object.entries(ArgumentOptionConfig)
	.flatMap(([argName, config]) => {
		return `  --${argName}\t\t${config.description}`;
	})
	.join("\n")}
`);
	}
};

main().catch((error) => {
	logger.error("An error occurred:");
	logger.error(error);
	process.exit(1);
});
