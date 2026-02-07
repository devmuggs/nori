import { input, select } from "@inquirer/prompts";
import { createNoriI18nCollection, LanguageCode, type NoriI18nCollection } from "@nori/core";
import z from "zod";
import type NoriEnvironment from "../environment/environment-loader.js";
import { logger } from "../logger.js";

export class InputManager {
	private locale: LanguageCode;

	constructor(private environment: NoriEnvironment) {
		this.locale = this.environment.preferences.preferredLocale || LanguageCode.EnglishBritish;
		this.environment.registerOnChangeCallback(() => {
			this.locale =
				this.environment.preferences.preferredLocale || LanguageCode.EnglishBritish;
		});
	}

	public text = async <
		TSchema extends z.ZodTypeAny = z.ZodString,
		TValue = z.infer<TSchema>
	>(options: {
		prompt: NoriI18nCollection;
		default?: TValue;
		schema?: TSchema;
		retryMessage?: NoriI18nCollection;
	}) => {
		while (true) {
			const userInput = await input({
				message: options.prompt[this.locale]!,
				...(options.default !== undefined ? { default: `${options.default}` } : {})
			});

			try {
				const parsedInput = (options.schema ?? z.string()).parse(userInput);
				return parsedInput;
			} catch (error) {
				logger.error(
					{
						[LanguageCode.EnglishBritish]:
							options.retryMessage?.[LanguageCode.EnglishBritish] ??
							`Invalid input: ${(error as Error).message}. Please try again.`,
						[LanguageCode.Japanese]:
							options.retryMessage?.[LanguageCode.Japanese] ??
							`無効な入力: ${(error as Error).message}。もう一度お試しください。`
					}[this.locale]
				);
			}
		}
	};

	select = async <T>(options: {
		message: Readonly<NoriI18nCollection>;
		choices: Readonly<{ label: Readonly<NoriI18nCollection>; value: T }[]>;
		default?: T;
	}) => {
		const selected = await select({
			message: options.message[this.locale]!,
			choices: options.choices.map((choice) => ({
				label: choice.label[this.locale]!,
				value: choice.value
			})),
			default: options.default
		});
		return selected;
	};

	promptLocaleSelection = async (): Promise<LanguageCode> => {
		const selectedLocale = await this.select({
			message: createNoriI18nCollection({
				[LanguageCode.EnglishBritish]: "Select your preferred locale:",
				[LanguageCode.Japanese]: "希望のロケールを選択してください："
			}),
			choices: Object.values(LanguageCode).map((locale) => ({
				label: createNoriI18nCollection({
					[LanguageCode.EnglishBritish]: locale,
					[LanguageCode.Japanese]: locale
				}),
				value: locale
			})),
			default: this.locale
		});
		return selectedLocale as LanguageCode;
	};
}
