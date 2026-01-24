import { ArgumentOption } from "@nori/command-line-interpreter/cli-schema.js";
import type { EnumValue } from "@nori/utils/enum.js";
import dotenv from "dotenv";
import { NoriLocale } from "../state-loader/state-loader-types.js";
import {
	EnvironmentVariable,
	NoriEnvironmentSchema,
	type NoriEnvironmentType,
	type OutputMode,
	type SupportedLanguage
} from "./environment-types.js";
const fs = await import("fs");

/** Manages Nori environment configuration and persistence */
export default class NoriEnvironment implements NoriEnvironmentType {
	public envFilePath: string;

	public input: {
		target: string;
	};

	public output: Partial<
		Record<
			EnumValue<typeof SupportedLanguage>,
			{
				directory: string;
				mode: EnumValue<typeof OutputMode>;
			}
		>
	>;

	public preferences: {
		preferredLocale?: NoriLocale | undefined;
	};

	public readonly isEnvFileFound: boolean;

	constructor() {
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

		this.isEnvFileFound = fs.existsSync(this.envFilePath);
	}

	public loadEnv(envPath?: string): NoriEnvironmentType {
		dotenv.config(envPath ? { path: envPath } : undefined);

		const { success, data: config, error } = NoriEnvironmentSchema.safeParse(process.env);
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
			envLines.push(`${EnvironmentVariable.OutputMode}_${upperLang}=${outputConfig.mode}`);
		}

		if (this.preferences.preferredLocale) {
			envLines.push(
				`${EnvironmentVariable.PreferredLocale}=${this.preferences.preferredLocale}`
			);
		}

		const envContent = envLines.join("\n");

		// append to end of file or create new file
		fs.writeFileSync(this.envFilePath, envContent, { encoding: "utf-8" });
	}
}
