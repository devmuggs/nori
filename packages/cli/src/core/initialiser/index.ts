import fs from "fs";
import path from "path";
import { environment } from "../environment-loader.js";
import logger from "../logger.js";
import {
	NoriLocale,
	NoriLocaleConfiguration,
	NoriLocaleMeta
} from "../state-loader/state-loader-types.js";

import { checkbox, input, select, Separator } from "@inquirer/prompts";

/** Initialiser is responsible for setting up the initial configuration and environment for the CLI tool. (i.e. nori --init ) */
export class Initialiser {
	private static async promptLocale(): Promise<NoriLocale> {
		const locale = await select({
			message: {
				[NoriLocale.EnglishBritish]: "Preferred locale:",
				[NoriLocale.Japanese]: "希望のロケール:"
			}[(environment.PreferredLocale as NoriLocale) || NoriLocale.EnglishBritish],
			choices: NoriLocaleMeta.values.map((locale) => ({
				name: `${NoriLocaleConfiguration[locale].displayName} (${NoriLocaleConfiguration[locale].description})`,
				value: locale
			})),
			default: NoriLocale.EnglishBritish
		});

		if (NoriLocaleMeta.evaluateIsValue(locale)) {
			environment.PreferredLocale = locale;
			return locale as NoriLocale;
		}

		throw new Error("Invalid locale selected.");
	}

	private static async prompt(options: {
		message: Record<NoriLocale, string>;
		default?: string;
		choices?: Array<{ name: string; value: string } | Separator>;
		validate?: (value: string) => boolean | string;
		onSubmit?: (value: string) => void;
	}): Promise<string> {
		if (environment.PreferredLocale === undefined) {
			await this.promptLocale();
		}

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

		if (environment.PreferredLocale === undefined) {
			await this.promptLocale();
		}

		if (fs.existsSync(norifilePath)) {
			logger.warn("A nori.yaml file already exists in this directory.");

			const overwrite = await select({
				message: {
					[NoriLocale.EnglishBritish]:
						"A nori.yaml file already exists in this directory. Do you want to overwrite it?",
					[NoriLocale.Japanese]:
						"このディレクトリには既にnori.yamlファイルが存在します。上書きしますか？"
				}[(environment.PreferredLocale as NoriLocale) ?? NoriLocale.EnglishBritish],
				choices: [
					{ name: "Yes, overwrite the existing nori.yaml", value: "yes" },
					{ name: "No, cancel initialization", value: "no" }
				]
			});

			logger.debug(`User chose to overwrite: ${JSON.stringify(overwrite)}`);

			if (!overwrite.includes("yes")) {
				logger.info("Initialization cancelled by user.");
				process.exit(0);
			}
		}

		const state = {
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

		const noriYamlContent = `# Nori Configuration File
preferredLocale: ${environment.PreferredLocale}
author: ${state.author}
projectName: ${state.projectName}
projectDescription: ${state.projectDescription}
version: ${state.version}

# Add your collections and entries below
collections:
    welcome-to-nori:
        params:
            username
                type: string
                description: "The name of the user."
        locales:
            en-GB: "Welcome to Nori, {{username}}!"
            ja-JP: "ノリへようこそ、{{username}}さん！"

entries:
    lets-get-started:
        params:
            topic:
                type: string
                description: "The topic to get started with."
        locales:
            en-GB: "Let's get started with {{topic}}."
            ja-JP: "さあ、{{topic}}を始めましょう！"
`;

		fs.writeFileSync(norifilePath, noriYamlContent, { encoding: "utf-8" });
		logger.info(`Created nori.yaml at ${norifilePath}`);
	}
}
