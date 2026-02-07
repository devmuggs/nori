import { select } from "@inquirer/prompts";

import { createNoriI18nCollection, LanguageCode, LanguageCodeMeta } from "@nori/core";
import { YesNoOptions } from "../../core/input-manager/constants.js";
import { logger } from "../../core/logger.js";
import type { CommandContext, CommandHandler } from "../index.js";

type InitForm = {
	preferredLocale: LanguageCode;
	authorName: string;
	project: {
		name: string;
		description: string;
	};
};

export const inferSystemLocale = (): LanguageCode => {
	const systemLocale = Intl.DateTimeFormat().resolvedOptions().locale;
	logger.info(`Detected system locale: ${systemLocale}`);

	if (systemLocale.startsWith("ja")) {
		logger.debug("Inferring preferred locale as Japanese based on system locale.");
		return LanguageCode.Japanese;
	} else {
		logger.debug("Inferring preferred locale as English (British) based on system locale.");
		return LanguageCode.EnglishBritish;
	}
};

const runInitCommand: CommandHandler = async ({ environment, cli: { input } }) => {
	let displayLocale: LanguageCode = LanguageCode.EnglishBritish;

	// Detect system locale if no preferred locale is set
	if (!environment.preferences.preferredLocale) {
		displayLocale = inferSystemLocale();
		environment.preferences.preferredLocale = displayLocale;
	}

	// Prompt for locale confirmation
	const isPreferredLocale = await input.select({
		message: createNoriI18nCollection({
			[LanguageCode.EnglishBritish]: "Is this your preferred locale?",
			[LanguageCode.Japanese]: "これはあなたの希望のロケールですか？"
		}),
		choices: YesNoOptions,
		default: true
	});

	if (!isPreferredLocale) {
		const preferredLocale = await input.select({
			message: createNoriI18nCollection({
				[LanguageCode.EnglishBritish]: "Preferred Locale:",
				[LanguageCode.Japanese]: "希望のロケール："
			}),
			choices: [
				{
					label: createNoriI18nCollection({
						[LanguageCode.EnglishBritish]: "English (British)",
						[LanguageCode.Japanese]: "英語（英国）"
					}),
					value: LanguageCode.EnglishBritish
				},
				{
					label: createNoriI18nCollection({
						[LanguageCode.EnglishBritish]: "Japanese (日本語)",
						[LanguageCode.Japanese]: "日本語（日本語）"
					}),
					value: LanguageCode.Japanese
				}
			],
			default:
				displayLocale === LanguageCode.EnglishBritish
					? LanguageCode.Japanese
					: LanguageCode.EnglishBritish
		});

		if (LanguageCodeMeta.evaluateIsValue(preferredLocale)) {
			environment.preferences.preferredLocale = preferredLocale;
			displayLocale = environment.preferences.preferredLocale;
		} else {
			throw new Error("Invalid locale selected.");
		}
	}

	// Prompt for other project details
	const formResponses: InitForm = {
		preferredLocale: displayLocale,
		authorName: await input.text({
			prompt: createNoriI18nCollection({
				[LanguageCode.EnglishBritish]: "Author Name:",
				[LanguageCode.Japanese]: "著者名："
			}),
			default: process.env.USER || process.env.USERNAME || ""
		}),
		project: {
			name: await input.text({
				prompt: createNoriI18nCollection({
					[LanguageCode.EnglishBritish]: "Project Name:",
					[LanguageCode.Japanese]: "プロジェクト名："
				}),
				default: process.cwd().split("/").pop() || "nori-project"
			}),
			description: await input.text({
				prompt: createNoriI18nCollection({
					[LanguageCode.EnglishBritish]: "Project Description:",
					[LanguageCode.Japanese]: "プロジェクトの説明："
				}),
				default: createNoriI18nCollection({
					[LanguageCode.EnglishBritish]: "I18n by Nori ≽^•⩊•^≼",
					[LanguageCode.Japanese]: "Noriによる国際化 ≽^•⩊•^≼"
				})
			})
		}
	};

	if (!environment.isEnvFileFound) {
		logger.info(
			{
				[LanguageCode.EnglishBritish]:
					"No .env file found in the current directory. Creating one with your preferences...",
				[LanguageCode.Japanese]:
					"現在のディレクトリに.envファイルが見つかりません。あなたの設定で作成します..."
			}[displayLocale]
		);

		const performCreation = await select({
			message: {
				[LanguageCode.EnglishBritish]: "Create .env file now?",
				[LanguageCode.Japanese]: ".envファイルを今すぐ作成しますか？"
			}[displayLocale],
			choices: [
				{
					name: {
						[LanguageCode.EnglishBritish]: "Yes",
						[LanguageCode.Japanese]: "はい"
					}[displayLocale],
					value: true
				},
				{
					name: {
						[LanguageCode.EnglishBritish]: "No",
						[LanguageCode.Japanese]: "いいえ"
					}[displayLocale],
					value: false
				}
			],
			default: true
		});

		if (performCreation) {
			environment.persistEnv();
			logger.success(
				{
					[LanguageCode.EnglishBritish]: ".env file created successfully.",
					[LanguageCode.Japanese]: ".envファイルが正常に作成されました。"
				}[displayLocale]
			);
		} else {
			logger.warn(
				{
					[LanguageCode.EnglishBritish]: "Skipped .env file creation.",
					[LanguageCode.Japanese]: ".envファイルの作成をスキップしました。"
				}[displayLocale]
			);
		}
	} else {
		const saveLocalePreference = await select({
			message: {
				[LanguageCode.EnglishBritish]:
					".env file already exists. Do you want to update your preferred locale in it?",
				[LanguageCode.Japanese]:
					".envファイルは既に存在します。希望のロケールを更新しますか？"
			}[displayLocale],
			choices: [
				{
					name: {
						[LanguageCode.EnglishBritish]: "Yes",
						[LanguageCode.Japanese]: "はい"
					}[displayLocale],
					value: true
				},
				{
					name: {
						[LanguageCode.EnglishBritish]: "No",
						[LanguageCode.Japanese]: "いいえ"
					}[displayLocale],
					value: false
				}
			],
			default: false
		});

		if (saveLocalePreference) {
			environment.persistEnv();
			logger.success(
				{
					[LanguageCode.EnglishBritish]: "Preferred locale updated in .env file.",
					[LanguageCode.Japanese]: ".envファイルの希望のロケールが更新されました。"
				}[displayLocale]
			);
		} else {
			logger.info(
				{
					[LanguageCode.EnglishBritish]: "Preferred locale not updated in .env file.",
					[LanguageCode.Japanese]: ".envファイルの希望のロケールは更新されませんでした。"
				}[displayLocale]
			);
		}
	}

	logger.success(
		{
			[LanguageCode.EnglishBritish]: "Initialization complete! You can now start using Nori.",
			[LanguageCode.Japanese]: "初期化が完了しました！これでNoriを使用開始できます。"
		}[displayLocale]
	);
};

export default class InitCommand {
	public async execute(params: CommandContext): Promise<void> {
		return runInitCommand(params);
	}
}
