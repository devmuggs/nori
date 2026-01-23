import { NoriConfig, OutputMode, SupportedLanguage } from "@nori/core-types.js";

export const noriConfig = new NoriConfig({
	envFilePath: ".env",

	input: {
		target: "./nori.yaml"
	},

	output: {
		[SupportedLanguage.TypeScript]: {
			directory: "../../web-client/.nori",
			mode: OutputMode.Monolithic
		},
		[SupportedLanguage.Python]: {
			directory: "../../flask-server/.nori",
			mode: OutputMode.Monolithic
		}
	}
});

export default noriConfig;
