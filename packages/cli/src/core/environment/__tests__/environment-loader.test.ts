import { jest } from "@jest/globals";
import logger from "../../logger.js";
import { EnvironmentVariable } from "../environment-enums.js";
import NoriEnvironment from "../environment-loader.js";

const env = new NoriEnvironment();

describe("Environment Loader", () => {
	it("should load environment variables from a .env file", () => {
		const testKey = EnvironmentVariable.EnvFilePath;
		const testValue = "test_value";

		// Simulate loading environment variable
		process.env[testKey] = testValue;
		const loadedValue = env.loadEnvValue(testKey, {
			defaultValue: "default_value"
		});

		expect(loadedValue).toBe(testValue);
	});

	it("should use default value if environment variable is not set", () => {
		const testKey = EnvironmentVariable.PreferredLocale;
		const defaultValue = "en-GB";
		delete process.env[testKey]; // Ensure the env variable is not set

		const loadedValue = env.loadEnvValue(testKey, {
			defaultValue: defaultValue
		});

		expect(loadedValue).toBe(defaultValue);
	});

	it("should throw an error if environment variable is not set and no default is provided", () => {
		const testKey = EnvironmentVariable.InputTarget;
		delete process.env[testKey]; // Ensure the env variable is not set

		expect(() => {
			env.loadEnvValue(testKey);
		}).toThrow(`Environment variable ${testKey} is not set.`);
	});

	it("should mask secret environment variables in logs", () => {
		const testKey = EnvironmentVariable.EnvFilePath;
		const testValue = "super_secret_value";

		// Simulate loading environment variable
		process.env[testKey] = testValue;

		const consoleSpy = jest.spyOn(logger, "debug").mockImplementation(() => {});

		env.loadEnvValue(testKey, { isSecret: true });

		expect(consoleSpy).toHaveBeenCalledWith(`Loaded environment variable ${testKey}: ******`);

		consoleSpy.mockRestore();
	});

	it("should allow for subscribing to onChange callbacks", () => {
		const callback = jest.fn();
		env.registerOnChangeCallback(callback);

		// Simulate an environment change
		env.updateEnvVariable(EnvironmentVariable.EnvFilePath, "new_value");

		expect(callback).toHaveBeenCalled();
	});
});
