import { input, select } from "@inquirer/prompts";
import { logger } from "@nori";
import type NoriEnvironment from "@nori/environment/environment-loader.js";
import {
	createNoriI18nCollection,
	NoriLocale,
	type NoriI18nCollection
} from "@nori/state-loader/state-loader-types.js";
import z from "zod";

export class InputManager {
	private locale: NoriLocale;

	constructor(private environment: NoriEnvironment) {
		this.locale = this.environment.preferences.preferredLocale || NoriLocale.EnglishBritish;
		this.environment.registerOnChangeCallback(() => {
			this.locale = this.environment.preferences.preferredLocale || NoriLocale.EnglishBritish;
		});
	}

	public text = async <TSchema extends z.ZodTypeAny = z.ZodString>(options: {
		prompt: NoriI18nCollection;
		default?: string | number | boolean;
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
						[NoriLocale.EnglishBritish]:
							options.retryMessage?.[NoriLocale.EnglishBritish] ??
							`Invalid input: ${(error as Error).message}. Please try again.`,
						[NoriLocale.Japanese]:
							options.retryMessage?.[NoriLocale.Japanese] ??
							`無効な入力: ${(error as Error).message}。もう一度お試しください。`
					}[this.locale]
				);
			}
		}
	};

	select = async (options: {
		message: NoriI18nCollection;
		choices: { label: NoriI18nCollection; value: string | number | boolean }[];
		default?: string | number | boolean;
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

	promptLocaleSelection = async (): Promise<NoriLocale> => {
		const selectedLocale = await this.select({
			message: createNoriI18nCollection({
				[NoriLocale.EnglishBritish]: "Select your preferred locale:",
				[NoriLocale.Japanese]: "希望のロケールを選択してください："
			}),
			choices: Object.values(NoriLocale).map((locale) => ({
				label: createNoriI18nCollection({
					[NoriLocale.EnglishBritish]: locale,
					[NoriLocale.Japanese]: locale
				}),
				value: locale
			})),
			default: this.locale
		});
		return selectedLocale as NoriLocale;
	};
}
