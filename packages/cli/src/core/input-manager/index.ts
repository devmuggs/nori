import { input, select } from "@inquirer/prompts";
import z from "zod";
import {
	createNoriI18nCollection,
	NoriLocale,
	type NoriI18nCollection
} from "..//state-loader/state-loader-types.js";
import type NoriEnvironment from "../environment/environment-loader.js";
import { logger } from "../logger.js";

export class InputManager {
	private locale: NoriLocale;

	constructor(private environment: NoriEnvironment) {
		this.locale = this.environment.preferences.preferredLocale || NoriLocale.EnglishBritish;
		this.environment.registerOnChangeCallback(() => {
			this.locale = this.environment.preferences.preferredLocale || NoriLocale.EnglishBritish;
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
