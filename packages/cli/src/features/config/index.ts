import { ArgumentOption } from "@nori/command-line-interface/cli-schema.js";
import type { CommandHandler } from "../index.js";

export const configHandler: CommandHandler = async ({ environment, cli: { args, input } }) => {
	if (args[ArgumentOption.SetLocale]) {
	}
};
