import { select } from "@inquirer/prompts";

import { LanguageCode, LanguageCodeMeta } from "@nori/core";
import type { ArgSchema } from "../../core/command-line-interface/cli-schema.js";
import { ArgumentOption, Command } from "../../core/command-line-interface/cli-schema.js";
import { logger } from "../../core/logger.js";
import type { CommandContext, ICommand } from "../index.js";

type ConfigArgs = Extract<ArgSchema, { kind: typeof Command.Config }>;
type ConfigOption = Exclude<keyof ConfigArgs, "kind">;

const ArgumentOptionCallbackMap: Partial<
	Record<ConfigOption, (params: CommandContext) => Promise<void>>
> = {
	[ArgumentOption.SetLocale]: async ({ cli, environment }: CommandContext) => {
		const args = cli.args;
		if (args.kind !== Command.Config) return;

		const { "set-locale": setLocale } = args;
		let setToLocale: LanguageCode | undefined = undefined;

		if (setLocale === undefined) {
			logger.error("No value provided for --set-locale option.");
			return;
		}

		if (setLocale === true) {
			const response = await select({
				message: "Select your preferred locale:",
				choices:
					Object.values(LanguageCode).map((locale) => ({
						name: locale,
						value: locale
					})) || [],
				default: environment.preferences.preferredLocale || LanguageCode.EnglishBritish
			});

			setToLocale = response;
		} else if (LanguageCodeMeta.evaluateIsValue(setLocale)) {
			setToLocale = setLocale;
		}

		if (!setToLocale) {
			logger.error(
				`Invalid value provided for --set-locale option: ${setLocale}. Please provide a valid locale.`
			);
			return;
		}

		environment.preferences.preferredLocale = setToLocale;
		environment.persistEnv();

		logger.log(`Preferred locale set to ${setToLocale}`);
	}
};

export class ConfigCommand implements ICommand {
	public async execute({ cli, environment }: CommandContext): Promise<void> {
		const args = cli.args;
		if (args.kind !== Command.Config) return;

		for (const option of Object.keys(ArgumentOptionCallbackMap) as ConfigOption[]) {
			const callback = ArgumentOptionCallbackMap[option];
			if (!callback) continue;
			if (args[option] !== undefined) {
				await callback({ cli, environment });
			}
		}
	}
}
