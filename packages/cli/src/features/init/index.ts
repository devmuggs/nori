import { select } from "@inquirer/prompts";

import { YesNoOptions } from "../../core/input-manager/constants.js";
import { logger } from "../../core/logger.js";
import {
	createNoriI18nCollection,
	NoriLocale,
	NoriLocaleMeta
} from "../../core/state-loader/state-loader-types.js";
import type { CommandHandler } from "../index.js";

type InitForm = {
	preferredLocale: NoriLocale;
	authorName: string;
	project: {
		name: string;
		description: string;
	};
};

export const inferSystemLocale = (): NoriLocale => {
	const systemLocale = Intl.DateTimeFormat().resolvedOptions().locale;
	logger.info(`Detected system locale: ${systemLocale}`);

	if (systemLocale.startsWith("ja")) {
		logger.debug("Inferring preferred locale as Japanese based on system locale.");
		return NoriLocale.Japanese;
	} else {
		logger.debug("Inferring preferred locale as English (British) based on system locale.");
		return NoriLocale.EnglishBritish;
	}
};

export const runInitCommand: CommandHandler = async ({ environment, cli: { input } }) => {
	let displayLocale: NoriLocale = NoriLocale.EnglishBritish;

	// Detect system locale if no preferred locale is set
	if (!environment.preferences.preferredLocale) {
		displayLocale = inferSystemLocale();
		environment.preferences.preferredLocale = displayLocale;
	}

	// Prompt for locale confirmation
	const isPreferredLocale = await input.select({
		message: createNoriI18nCollection({
			[NoriLocale.EnglishBritish]: "Is this your preferred locale?",
			[NoriLocale.Japanese]: "これはあなたの希望のロケールですか？"
		}),
		choices: YesNoOptions,
		default: true
	});

	if (!isPreferredLocale) {
		const preferredLocale = await input.select({
			message: createNoriI18nCollection({
				[NoriLocale.EnglishBritish]: "Preferred Locale:",
				[NoriLocale.Japanese]: "希望のロケール："
			}),
			choices: [
				{
					label: createNoriI18nCollection({
						[NoriLocale.EnglishBritish]: "English (British)",
						[NoriLocale.Japanese]: "英語（英国）"
					}),
					value: NoriLocale.EnglishBritish
				},
				{
					label: createNoriI18nCollection({
						[NoriLocale.EnglishBritish]: "Japanese (日本語)",
						[NoriLocale.Japanese]: "日本語（日本語）"
					}),
					value: NoriLocale.Japanese
				}
			],
			default:
				displayLocale === NoriLocale.EnglishBritish
					? NoriLocale.Japanese
					: NoriLocale.EnglishBritish
		});

		if (NoriLocaleMeta.evaluateIsValue(preferredLocale)) {
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
				[NoriLocale.EnglishBritish]: "Author Name:",
				[NoriLocale.Japanese]: "著者名："
			}),
			default: process.env.USER || process.env.USERNAME || ""
		}),
		project: {
			name: await input.text({
				prompt: createNoriI18nCollection({
					[NoriLocale.EnglishBritish]: "Project Name:",
					[NoriLocale.Japanese]: "プロジェクト名："
				}),
				default: process.cwd().split("/").pop() || "nori-project"
			}),
			description: await input.text({
				prompt: createNoriI18nCollection({
					[NoriLocale.EnglishBritish]: "Project Description:",
					[NoriLocale.Japanese]: "プロジェクトの説明："
				}),
				default: createNoriI18nCollection({
					[NoriLocale.EnglishBritish]: "I18n by Nori ≽^•⩊•^≼",
					[NoriLocale.Japanese]: "Noriによる国際化 ≽^•⩊•^≼"
				})
			})
		}
	};

	if (!environment.isEnvFileFound) {
		logger.info(
			{
				[NoriLocale.EnglishBritish]:
					"No .env file found in the current directory. Creating one with your preferences...",
				[NoriLocale.Japanese]:
					"現在のディレクトリに.envファイルが見つかりません。あなたの設定で作成します..."
			}[displayLocale]
		);

		const performCreation = await select({
			message: {
				[NoriLocale.EnglishBritish]: "Create .env file now?",
				[NoriLocale.Japanese]: ".envファイルを今すぐ作成しますか？"
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

		if (performCreation) {
			environment.persistEnv();
			logger.success(
				{
					[NoriLocale.EnglishBritish]: ".env file created successfully.",
					[NoriLocale.Japanese]: ".envファイルが正常に作成されました。"
				}[displayLocale]
			);
		} else {
			logger.warn(
				{
					[NoriLocale.EnglishBritish]: "Skipped .env file creation.",
					[NoriLocale.Japanese]: ".envファイルの作成をスキップしました。"
				}[displayLocale]
			);
		}
	} else {
		const saveLocalePreference = await select({
			message: {
				[NoriLocale.EnglishBritish]:
					".env file already exists. Do you want to update your preferred locale in it?",
				[NoriLocale.Japanese]:
					".envファイルは既に存在します。希望のロケールを更新しますか？"
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
			default: false
		});

		if (saveLocalePreference) {
			environment.persistEnv();
			logger.success(
				{
					[NoriLocale.EnglishBritish]: "Preferred locale updated in .env file.",
					[NoriLocale.Japanese]: ".envファイルの希望のロケールが更新されました。"
				}[displayLocale]
			);
		} else {
			logger.info(
				{
					[NoriLocale.EnglishBritish]: "Preferred locale not updated in .env file.",
					[NoriLocale.Japanese]: ".envファイルの希望のロケールは更新されませんでした。"
				}[displayLocale]
			);
		}
	}

	logger.success(
		{
			[NoriLocale.EnglishBritish]: "Initialization complete! You can now start using Nori.",
			[NoriLocale.Japanese]: "初期化が完了しました！これでNoriを使用開始できます。"
		}[displayLocale]
	);
};
