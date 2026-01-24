import { NoriLocale } from "@nori";
import { ArgumentOptionConfig, CommandConfig } from "@nori/command-line-interpreter/cli-schema.js";
import type NoriEnvironment from "@nori/environment/environment-loader.js";
import { logger } from "../../core/logger.js";

const buildHelpString = (locale: NoriLocale) => {
	// keep track for formatting
	let longestCommandLength = 0;
	let longestOptionLength = 0;

	longestCommandLength = Math.max(...Object.keys(CommandConfig).map((cmd) => cmd.length));
	longestOptionLength = Math.max(...Object.keys(ArgumentOptionConfig).map((opt) => opt.length));

	const commandLines = Object.entries(CommandConfig).map(([command, config]) => {
		const padding = " ".repeat(longestCommandLength - command.length + 4);
		return `  ${command}${padding}${config.description[locale]}`;
	});

	const optionLines = Object.entries(ArgumentOptionConfig).map(([argName, config]) => {
		const padding = " ".repeat(longestOptionLength - argName.length + 4);
		return `  --${argName}${padding}${config.description[locale]}`;
	});

	return {
		[NoriLocale.EnglishBritish]: `Available Commands and Options:
Usage: nori [command] [options]

Commands:
${commandLines.join("\n")}

Options:
${optionLines.join("\n")}
`,
		[NoriLocale.Japanese]: `利用可能なコマンドとオプション：
使用法: nori [コマンド] [オプション]

コマンド:
${commandLines.join("\n")}

オプション:
${optionLines.join("\n")}
`
	}[locale];
};

export const runHelpCommand = (environment: NoriEnvironment): void => {
	logger.log(
		buildHelpString(environment.preferences.preferredLocale ?? NoriLocale.EnglishBritish)
	);
};
