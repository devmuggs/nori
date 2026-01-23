export const envLoader = (
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
