import dotenv from "dotenv";
import path from "path";
import { NoriLocale, NoriLocaleMeta } from "./state-loader/state-loader-types.js";
const fs = await import("fs");

const envLoader = (
	key: string,
	options: Partial<{
		defaultValue: string;
		isSensitive: boolean;
		isRequired: boolean;
	}> = {}
) => {
	const { defaultValue, isSensitive = false, isRequired = false } = options;

	const value = process.env[key] ?? defaultValue ?? undefined;

	if (value === undefined && options.isRequired) {
		throw new Error(`Environment variable "${key}" is not defined and has no default value.`);
	}

	return value;
};

export let environment: {
	NoriYamlPath: string;
	PreferredLocale: NoriLocale | undefined;
} = {
	NoriYamlPath: "",
	PreferredLocale: undefined
};

// nori env path could be loaded either via CLI arg of --env or via default .env file in cwd

export const loadEnvironment = (envPath?: string) => {
	let resolvedPath = envPath ? path.resolve(envPath) : path.resolve(process.cwd(), ".env");

	dotenv.config(fs.existsSync(resolvedPath) ? { path: resolvedPath } : undefined);

	const preferredLocaleString = envLoader("NORI_PREFERRED_LOCALE");

	return {
		NoriYamlPath: envLoader("NORI_YAML_PATH", { defaultValue: "" }),
		PreferredLocale: NoriLocaleMeta.evaluateIsValue(preferredLocaleString)
			? (preferredLocaleString as NoriLocale)
			: undefined
	};
};
