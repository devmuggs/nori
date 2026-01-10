import fs from "fs";
import path from "path";
import { environment } from "../environment-loader.js";
import logger from "../logger.js";
import {
	NoriLocale,
	NoriLocaleConfiguration,
	NoriLocaleMeta
} from "../state-loader/state-loader-types.js";

import { input, select, Separator } from "@inquirer/prompts";

/** Initialiser is responsible for setting up the initial configuration and environment for the CLI tool. (i.e. nori --init ) */
export class Initialiser {
	private static async prompt(options: {
		message: Record<NoriLocale, string>;
		default?: string;
		choices?: Array<{ name: string; value: string } | Separator>;
		validate?: (value: string) => boolean | string;
		onSubmit?: (value: string) => void;
	}): Promise<string> {
		const { message, default: defaultValue, validate, choices } = options;
		const localizedMessage =
			message[environment.PreferredLocale as NoriLocale] ||
			message[NoriLocale.EnglishBritish];

		let answer: string;

		if (choices) {
			logger.debug(`Prompting user with choices: ${JSON.stringify(choices)}`);
			answer = await select({
				message: localizedMessage,
				choices
			});
			logger.debug(`User selected: ${answer}`);
		} else {
			answer = await input({
				message: localizedMessage,
				...(defaultValue ? { default: defaultValue } : {}),
				...(validate ? { validate } : {})
			});
			logger.debug(`User entered: ${answer}`);
		}

		options.onSubmit?.(answer);
		return answer;
	}

	public static async initialiseProject(): Promise<void> {
		// want to do a very similar experience to things like git --init, npm init, et cetera.
		// Should hand hold devs through the experience of setting up a nori project.

		const cwd = process.cwd();
		const norifilePath = path.join(cwd, "nori.yaml");

		if (fs.existsSync(norifilePath)) {
			logger.error("A nori.yaml file already exists in this directory.");
			return;
		}

		const state = {
			preferredLocale: await this.prompt({
				message: {
					[NoriLocale.EnglishBritish]: "Preferred locale:",
					[NoriLocale.Japanese]: "希望のロケール:"
				},
				choices: NoriLocaleMeta.values.map((locale) => ({
					name: `${NoriLocaleConfiguration[locale].displayName} (${NoriLocaleConfiguration[locale].description})`,
					value: locale
				})),
				default: NoriLocale.EnglishBritish,
				validate: (value: string) =>
					NoriLocaleMeta.values.includes(value as NoriLocale) ||
					"Please select a valid locale.",
				onSubmit: (value: string) => {
					environment.PreferredLocale = value as NoriLocale;
				}
			}),
			author: await this.prompt({
				message: {
					[NoriLocale.EnglishBritish]: "Author name:",
					[NoriLocale.Japanese]: "著者名:"
				},
				default: process.env.USER || process.env.USERNAME || "Unknown Author",
				validate: (value: string) =>
					value.trim().length > 0 || "Author name cannot be empty."
			}),
			projectName: await this.prompt({
				message: {
					[NoriLocale.EnglishBritish]: "Project name:",
					[NoriLocale.Japanese]: "プロジェクト名:"
				},
				default: path.basename(cwd),
				validate: (value: string) =>
					value.trim().length > 0 || "Project name cannot be empty."
			}),
			projectDescription: await this.prompt({
				message: {
					[NoriLocale.EnglishBritish]: "Project description:",
					[NoriLocale.Japanese]: "プロジェクトの説明:"
				},
				default: "A Nori project",
				validate: (value: string) =>
					value.trim().length > 0 || "Project description cannot be empty."
			}),
			version: await this.prompt({
				message: {
					[NoriLocale.EnglishBritish]: "Version:",
					[NoriLocale.Japanese]: "バージョン:"
				},
				default: "1.0.0",
				validate: (value: string) =>
					/^\d+\.\d+\.\d+$/.test(value) || "Version must be in the format x.y.z"
			})
		};

		logger.debug(`Initialisation state: ${JSON.stringify(state, null, 2)}`);
	}
}
