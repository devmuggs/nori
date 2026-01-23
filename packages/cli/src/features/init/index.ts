import { input, select } from "@inquirer/prompts";

import { environment } from "../../core/index.js";
import { logger } from "../../core/logger.js";
import { NoriLocale, NoriLocaleMeta } from "../../core/state-loader/state-loader-types.js";

type InitForm = {
	preferredLocale: NoriLocale;
	authorName: string;
	project: {
		name: string;
		description: string;
	};
};

export const runInitCommand = async () => {
	let displayLocale: NoriLocale = NoriLocale.EnglishBritish;

	// Detect system locale if no preferred locale is set
	if (!environment.preferences.preferredLocale) {
		const systemLocale = Intl.DateTimeFormat().resolvedOptions().locale;
		logger.info(`Detected system locale: ${systemLocale}`);

		if (systemLocale.startsWith("ja")) {
			environment.preferences.preferredLocale = NoriLocale.Japanese;
			logger.debug("Setting preferred locale to Japanese based on system locale.");
		} else {
			environment.preferences.preferredLocale = NoriLocale.EnglishBritish;
			logger.debug("Setting preferred locale to English (British) based on system locale.");
		}

		if (environment.preferences.preferredLocale)
			displayLocale = environment.preferences.preferredLocale;
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
			environment.preferences.preferredLocale = preferredLocale;
			displayLocale = environment.preferences.preferredLocale;
		} else {
			throw new Error("Invalid locale selected.");
		}
	}

	// Prompt for other project details
	const formResponses: InitForm = {
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
	}

	logger.success(
		{
			[NoriLocale.EnglishBritish]: "Initialization complete! You can now start using Nori.",
			[NoriLocale.Japanese]: "初期化が完了しました！これでNoriを使用開始できます。"
		}[displayLocale]
	);
};
