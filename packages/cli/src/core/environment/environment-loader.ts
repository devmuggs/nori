import dotenv from "dotenv";

import type { SupportedLanguage } from "../code-generators/code-generator-enums.js";
import { ArgumentOption } from "../command-line-interface/cli-schema.js";
import { FileSystem } from "../filesystem/index.js";
import { LanguageCode } from "../locales/index.js";
import { logger } from "../logger.js";
import type { EnumValue } from "../utils/enum.js";
import { EnvironmentVariable, OutputMode } from "./environment-enums.js";
import { type NoriEnvironmentType, NoriEnvironmentSchema } from "./environment-schemas.js";

/** Manages Nori environment configuration and persistence */
export default class NoriEnvironment implements NoriEnvironmentType {
	public envFilePath: string;

	public middleware = Object.freeze({
		onChange: [] as Array<() => void>
	});

	public input: {
		target: string;
	};

	public output: Partial<
		Record<
			SupportedLanguage,
			{
				directory: string;
				// mode: EnumValue<typeof OutputMode>;
			}
		>
	>;

	public preferences: {
		preferredLocale?: LanguageCode | undefined;
	};

	public readonly isEnvFileFound: boolean;

	constructor(
		private readonly deps: { fileSystem: FileSystem } = { fileSystem: new FileSystem() }
	) {
		const argv = process.argv.slice(2);
		let envPath = process.env.NORI_ENV_PATH;

		if (argv.includes(ArgumentOption.Env)) {
			const envIndex = argv.indexOf(ArgumentOption.Env);
			if (envIndex !== -1 && argv.length > envIndex + 1) {
				envPath = argv[envIndex + 1];
			}
		}

		const config = this.loadEnv(envPath);
		this.envFilePath = config.envFilePath;
		this.input = config.input;
		this.output = config.output;
		this.preferences = config.preferences;

		this.isEnvFileFound = this.deps.fileSystem.exists(this.envFilePath);
	}

	public loadEnvValue = (
		key: EnvironmentVariable,
		options: Partial<{
			defaultValue: string;
			isSecret: boolean;
		}> = {}
	): string => {
		let value = process.env[key];

		if (value === undefined) {
			if (options.defaultValue !== undefined) {
				value = options.defaultValue;
			} else {
				throw new Error(`Environment variable ${key} is not set.`);
			}
		}

		if (!options.isSecret) {
			logger.debug(`Loaded environment variable ${key}: ${value}`);
		} else {
			logger.debug(`Loaded environment variable ${key}: ******`);
		}
		return value;
	};

	public loadEnv(envPath?: string): NoriEnvironmentType {
		dotenv.config(envPath ? { path: envPath } : undefined);

		const {
			success,
			data: config,
			error
		} = NoriEnvironmentSchema.safeParse({
			envFilePath: this.loadEnvValue(EnvironmentVariable.EnvFilePath, {
				defaultValue: ".env"
			}),
			preferences: {
				preferredLocale: this.loadEnvValue(EnvironmentVariable.PreferredLocale, {
					defaultValue: LanguageCode.EnglishBritish
				})
			},
			input: {
				target: this.loadEnvValue(EnvironmentVariable.InputTarget)
			}
		});
		if (!success) {
			throw new Error(`Failed to load environment configuration: ${error.message}`);
		}

		return config;
	}

	public persistEnv(): void {
		const envLines: string[] = [];

		envLines.push(`# Nori Environment Configuration`);
		envLines.push(`${EnvironmentVariable.EnvFilePath}=${this.envFilePath}`);
		envLines.push(`${EnvironmentVariable.InputTarget}=${this.input.target}`);

		for (const [lang, outputConfig] of Object.entries(this.output)) {
			const upperLang = lang.toUpperCase();
			envLines.push(
				`${EnvironmentVariable.OutputDirectory}_${upperLang}=${outputConfig.directory}`
			);
			// envLines.push(`${EnvironmentVariable.OutputMode}_${upperLang}=${outputConfig.mode}`);
		}

		if (this.preferences.preferredLocale) {
			envLines.push(
				`${EnvironmentVariable.PreferredLocale}=${this.preferences.preferredLocale}`
			);
		}

		const envContent = envLines.join("\n");

		try {
			this.deps.fileSystem.writeFile(this.envFilePath, envContent, {
				encoding: "utf-8",
				mode: "overwrite"
			});
		} catch (error) {
			logger.error(
				`Failed to persist environment configuration to ${this.envFilePath}: ${
					(error as Error).message
				}`
			);

			throw new Error("Failed to persist environment configuration.", { cause: error });
		}

		logger.info(`Environment configuration persisted to ${this.envFilePath}`);
	}

	public updateEnvVariable(key: EnvironmentVariable, value: string): void {
		process.env[key] = value;
		this.persistEnv();

		try {
			this.middleware.onChange.forEach((callback) => callback());
		} catch (error) {
			logger.error(`Error executing onChange callbacks: ${(error as Error).message}`);
		}
	}

	public registerOnChangeCallback(callback: () => void): void {
		this.middleware.onChange.push(callback);
	}
}
