import { ArgumentOptionConfig, CommandConfig } from "@nori/command-line-interpreter/cli-types.js";
import { logger } from "../../core/logger.js";

const buildHelpString = () => {
	// keep track for formatting
	let longestCommandLength = 0;
	let longestOptionLength = 0;

	longestCommandLength = Math.max(...Object.keys(CommandConfig).map((cmd) => cmd.length));
	longestOptionLength = Math.max(...Object.keys(ArgumentOptionConfig).map((opt) => opt.length));

	const commandLines = Object.entries(CommandConfig).map(([command, config]) => {
		const padding = " ".repeat(longestCommandLength - command.length + 4);
		return `  ${command}${padding}${config.description}`;
	});

	const optionLines = Object.entries(ArgumentOptionConfig).map(([argName, config]) => {
		const padding = " ".repeat(longestOptionLength - argName.length + 4);
		return `  --${argName}${padding}${config.description}`;
	});

	return `Available Commands and Options:
Usage: nori [command] [options]

Commands:
${commandLines.join("\n")}

Options:
${optionLines.join("\n")}
`;
};

export const runHelpCommand = (): void => {
	logger.log(buildHelpString());
};
