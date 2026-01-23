import { checkbox, input, select, Separator } from "@inquirer/prompts";
import { logger, NoriCollection, NoriEntry } from "@nori";
import { environment } from "../../core/environment-loader.js";
import { NoriLocale, NoriLocaleMeta } from "../../core/state-loader/state-loader-types.js";

type GenerateForm = {
	preferredLocale: NoriLocale;
	authorName: string;
	project: {
		name: string;
		description: string;
	};
};

export const runGenerateCommand = async () => {
	let displayLocale: NoriLocale = NoriLocale.EnglishBritish;

	// Detect system locale if no preferred locale is set
	if (!environment.PreferredLocale) {
		const systemLocale = Intl.DateTimeFormat().resolvedOptions().locale;
		logger.debug(`Detected system locale: ${systemLocale}`);

		if (systemLocale.startsWith("ja")) {
			environment.PreferredLocale = NoriLocale.Japanese;
			logger.debug("Setting preferred locale to Japanese based on system locale.");
		} else {
			environment.PreferredLocale = NoriLocale.EnglishBritish;
			logger.debug("Setting preferred locale to English (British) based on system locale.");
		}

		if (environment.PreferredLocale) displayLocale = environment.PreferredLocale;
	}

	// Prompt for locale confirmation
	const isPreferredLocale = await select({
		message: {
			[NoriLocale.EnglishBritish]: "Is this your preferred locale?",
			[NoriLocale.Japanese]: "これはあなたの希望のロケールですか？"
		}[displayLocale],
		choices: [
			{
				name: {
					[NoriLocale.EnglishBritish]: "Yes",
					[NoriLocale.Japanese]: "はい"
				}[displayLocale],
				value: true
			},
			{
				name: {
					[NoriLocale.EnglishBritish]: "No",
					[NoriLocale.Japanese]: "いいえ"
				}[displayLocale],
				value: false
			}
		],
		default: true
	});

	if (!isPreferredLocale) {
		const preferredLocale = await select({
			message: {
				[NoriLocale.EnglishBritish]: "Preferred Locale:",
				[NoriLocale.Japanese]: "希望のロケール："
			}[displayLocale],
			choices: [
				{ name: "English (British)", value: NoriLocale.EnglishBritish },
				{ name: "Japanese (日本語)", value: NoriLocale.Japanese }
			],
			default:
				displayLocale === NoriLocale.EnglishBritish
					? NoriLocale.Japanese
					: NoriLocale.EnglishBritish
		});

		if (NoriLocaleMeta.evaluateIsValue(preferredLocale)) {
			environment.PreferredLocale = preferredLocale;
			displayLocale = environment.PreferredLocale;
		} else {
			throw new Error("Invalid locale selected.");
		}
	}

	// Prompt for other project details
	const formResponses: GenerateForm = {
		preferredLocale: displayLocale,
		authorName: await input({
			message: {
				[NoriLocale.EnglishBritish]: "Author Name:",
				[NoriLocale.Japanese]: "著者名："
			}[displayLocale],
			default: process.env.USER || process.env.USERNAME || ""
		}),
		project: {
			name: await input({
				message: {
					[NoriLocale.EnglishBritish]: "Project Name:",
					[NoriLocale.Japanese]: "プロジェクト名："
				}[displayLocale],
				default: process.cwd().split("/").pop() || "nori-project"
			}),
			description: await input({
				message: {
					[NoriLocale.EnglishBritish]: "Project Description:",
					[NoriLocale.Japanese]: "プロジェクトの説明："
				}[displayLocale],
				default: {
					[NoriLocale.EnglishBritish]: "I18n by Nori ≽^•⩊•^≼",
					[NoriLocale.Japanese]: "Noriによる国際化 ≽^•⩊•^≼"
				}[displayLocale]
			})
		}
	};

	logger.log("Generating project with the following details:");
	logger.log(`Locale: ${formResponses.preferredLocale}`);
	logger.log(`Author: ${formResponses.authorName}`);
	logger.log(`Project Name: ${formResponses.project.name}`);
	logger.log(`Project Description: ${formResponses.project.description}`);

	// Here you would add the logic to actually generate the project files based on the responses
};
