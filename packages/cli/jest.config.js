/** @type {import("jest").Config} **/
export default {
	testEnvironment: "node",
	extensionsToTreatAsEsm: [],
	moduleNameMapper: {
		"^(\\.{1,2}/.*)\\.js$": "$1"
	},
	transform: {
		"^.+\\.tsx?$": [
			"ts-jest",
			{
				useESM: false,
				tsconfig: "./tsconfig.jest.json"
			}
		]
	}
};
