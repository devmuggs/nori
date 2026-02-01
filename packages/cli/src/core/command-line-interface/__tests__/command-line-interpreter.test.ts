import NoriEnvironment from "../../environment/environment-loader.js";
import { InputManager } from "../../input-manager/index.js";
import CommandLineInterface from "../index.js";

const environment = new NoriEnvironment();
const inputManager = new InputManager(environment);

describe("Command Line Interface", () => {
	it("should correctly parse command and arguments", () => {
		const testArgs = [
			"node",
			"script.js",
			"init",
			"--verbose",
			"--log-level=debug",
			"--version 1"
		];
		process.argv = testArgs;

		const testCli = new CommandLineInterface(inputManager);

		expect(testCli.command).toBe("base");
		expect(testCli.args).toEqual({
			verbose: true,
			"log-level": "debug",
			version: 1,
			watch: false,
			force: false,
			help: false,
			init: true,
			kind: "base"
		});
	});
});
