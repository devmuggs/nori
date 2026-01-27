import { ArgumentOption } from "@nori/command-line-interpreter/cli-schema.js";
import type { CommandHandler } from "../index.js";

export const configHandler: CommandHandler = async ({ environment, cli: { args, input } }) => {
	if (args[ArgumentOption.SetLocale]) {
	}
};
