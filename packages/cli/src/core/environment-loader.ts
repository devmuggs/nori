import dotenv from "dotenv";
import path from "path";

const envLoader = (
	key: string,
	options: Partial<{
		defaultValue: string;
		isSensitive: boolean;
	}> = {}
) => {
	const { defaultValue, isSensitive = false } = options;

	const value = process.env[key] ?? defaultValue ?? undefined;

	if (value === undefined) {
		throw new Error(`Environment variable "${key}" is not defined and has no default value.`);
	}

	return value;
};

export let environment = {
	NoriYamlPath: envLoader("NORI_YAML_PATH", { defaultValue: "" })
};

export const loadEnvironment = (pathToEnvFile: string) => {
	const resolvedPath = path.resolve(pathToEnvFile);
	dotenv.config({ path: resolvedPath });

	environment = {
		NoriYamlPath: envLoader("NORI_YAML_PATH", { defaultValue: "" })
	};
};
