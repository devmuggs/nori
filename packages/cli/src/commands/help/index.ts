import { LanguageCode } from "@nori/core";
import {
	ArgumentOptionConfig,
	CommandConfig
} from "../../core/command-line-interface/cli-schema.js";
import { logger } from "../../core/logger.js";
import type { CommandContext, ICommand } from "../index.js";

const buildHelpString = (locale: LanguageCode) => {
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
		[LanguageCode.EnglishBritish]: `Available Commands and Options:
Usage: nori [command] [options]

Commands:
${commandLines.join("\n")}

Options:
${optionLines.join("\n")}
`,
		[LanguageCode.Japanese]: `利用可能なコマンドとオプション：
使用法: nori [コマンド] [オプション]

コマンド:
${commandLines.join("\n")}

オプション:
${optionLines.join("\n")}
`
	}[locale];
};

export class HelpCommand implements ICommand {
	public async execute(params: CommandContext): Promise<void> {
		const { environment } = params;
		const locale = environment.preferences.preferredLocale || LanguageCode.EnglishBritish;
		const helpString = buildHelpString(locale);
		logger.log(helpString);
	}
}
