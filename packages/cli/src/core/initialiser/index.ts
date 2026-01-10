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
	public static async initialiseProject(): Promise<void> {
		// want to do a very similar experience to things like git --init, npm init, et cetera.
		// Should hand hold devs through the experience of setting up a nori project.

		const cwd = process.cwd();
		const norifilePath = path.join(cwd, "nori.yaml");

		if (fs.existsSync(norifilePath)) {
			logger.error("A nori.yaml file already exists in this directory.");
			return;
		}

		const preferredLocale =
			environment.PreferredLocale in NoriLocale ? environment.PreferredLocale : undefined;

		if (!preferredLocale) {
			logger.info("No preferred locale set. Let's set one up now.");

			const localeOptions = NoriLocaleMeta.values.map((locale) => ({
				name: `${NoriLocaleConfiguration[locale].displayName} (${NoriLocaleConfiguration[locale].description})`,
				value: locale
			}));

			const answers = await select({
				message: "Select your preferred locale:",
				choices: localeOptions
			});

			logger.debug(`User selected locale: ${answers}`);

			environment.PreferredLocale = answers;
			if (NoriLocaleMeta.evaluateIsValue(answers)) {
				logger.success(
					`Preferred locale set to ${NoriLocaleConfiguration[answers].displayName}`
				);
			}
		}
	}
}
