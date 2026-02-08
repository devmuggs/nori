import { LanguageCode } from "../../../locales/locale-enums.js";
import type {
	NoriYaml,
	YamlCollection,
	YamlCollectionEntries,
	YamlCollectionEntry,
	YamlCollectionEntryParams
} from "../../../state/state-schemas.js";
import { TypeScriptCodeGenerator } from "../index.js";

const demo: NoriYaml = {
	meta: {
		preferredLocale: LanguageCode.EnglishBritish,
		author: "tristan",
		project: {
			name: "cli",
			description: "A Nori project"
		},
		version: "1.0.0"
	},
	collections: {
		root: {
			["lets-get-started"]: {
				description: {
					[LanguageCode.EnglishBritish]: "Displayed on first step of onboarding wizard.",
					[LanguageCode.Japanese]:
						"オンボーディングウィザードの最初のステップに表示されます。"
				},
				params: {
					topic: {
						type: "string",
						description: {
							[LanguageCode.EnglishBritish]: "The topic to get started with.",
							[LanguageCode.Japanese]: "始めるトピック。"
						}
					}
				},
				locales: {
					[LanguageCode.EnglishBritish]: "Let's get started with {{topic}}.",
					[LanguageCode.Japanese]: "さあ、{{topic}}を始めましょう！"
				}
			}
		},
		client: {
			greeting: {
				description: {
					[LanguageCode.EnglishBritish]: "A friendly greeting message.",
					[LanguageCode.Japanese]: "親しみやすい挨拶メッセージ。"
				},
				locales: {
					[LanguageCode.EnglishBritish]: "Hello!",
					[LanguageCode.Japanese]: "こんにちは！"
				}
			},
			farewell: {
				description: {
					[LanguageCode.EnglishBritish]: "A friendly farewell message.",
					[LanguageCode.Japanese]: "親しみやすい別れのメッセージ。"
				},
				locales: {
					[LanguageCode.EnglishBritish]: "Goodbye!",
					[LanguageCode.Japanese]: "さようなら！"
				}
			}
		}
	}
};

const params: YamlCollectionEntryParams = {
	topic: {
		type: "string",
		description: {
			[LanguageCode.EnglishBritish]: "The topic to get started with.",
			[LanguageCode.Japanese]: "始めるトピック。"
		}
	},
	count: {
		type: "number",
		optional: true,
		description: {
			[LanguageCode.EnglishBritish]: "An optional count parameter.",
			[LanguageCode.Japanese]: "オプションのカウントパラメーター。"
		},
		default: 5
	}
};

describe("TypeScriptCodeGenerator", () => {
	it("generates a property key", () => {
		expect(TypeScriptCodeGenerator.generatePropertyKey("lets-get-started")).toBe(
			"letsGetStarted"
		);
		expect(TypeScriptCodeGenerator.generatePropertyKey("greeting")).toBe("greeting");
	});

	it("generates a description comment", () => {
		const descriptionString = "A friendly greeting message.";
		expect(TypeScriptCodeGenerator.generateDescriptionComment(descriptionString)).toBe(
			`/**\n * ${descriptionString}\n */\n`
		);

		const descriptionObject = {
			[LanguageCode.EnglishBritish]: "A friendly greeting message.",
			[LanguageCode.Japanese]: "親しみやすい挨拶メッセージ。"
		};
		expect(TypeScriptCodeGenerator.generateDescriptionComment(descriptionObject)).toBe(`/**
 * [en-GB]: A friendly greeting message.
 * [ja-JP]: 親しみやすい挨拶メッセージ。
 */`);
	});

	it("generates a params interface", () => {
		const generatedParams = TypeScriptCodeGenerator.generateFunctionCallParams(params);
		const expectedParams = `{
/**
 * [en-GB]: The topic to get started with.
 * [ja-JP]: 始めるトピック。
 */
topic,
/**
 * [en-GB]: An optional count parameter.
 * [ja-JP]: オプションのカウントパラメーター。
 */
count = 5,
}`;
		expect(generatedParams).toBe(expectedParams);
	});

	it("generates a params type", () => {
		const generatedParamType = TypeScriptCodeGenerator.generateFunctionCallParamType(params);
		const expectedParamType = `{ topic: string; count?: number; }`;
		expect(generatedParamType).toBe(expectedParamType);
	});

	it("formats strings correctly", () => {
		const template = "Let's get started with {{topic}}.";

		const result = TypeScriptCodeGenerator.formatInterpolatedStrings(template);
		expect(result).toBe("`Let's get started with ${ topic }.`");
	});

	it("generates i18n record", () => {
		const locales = {
			[LanguageCode.EnglishBritish]: "Let's get started with {{topic}}.",
			[LanguageCode.Japanese]: "さあ、{{topic}}を始めましょう！"
		};

		const result = TypeScriptCodeGenerator.generateI18nBody(locales);

		const expected = `[LanguageCode.EnglishBritish]: \`Let's get started with \${ topic }.\`,
[LanguageCode.Japanese]: \`さあ、\${ topic }を始めましょう！\``.trim();

		expect(result).toBe(expected);
	});

	it("generates full interpolated function definition (with params)", () => {
		const collectionEntry: YamlCollectionEntry = {
			params: {
				displayName: {
					type: "string",
					default: "guest",
					description: {
						[LanguageCode.EnglishBritish]: "The name to display in the greeting.",
						[LanguageCode.Japanese]: "挨拶で表示する名前。"
					}
				}
			},
			description: {
				[LanguageCode.EnglishBritish]: "A friendly greeting message.",
				[LanguageCode.Japanese]: "親しみやすい挨拶メッセージ。"
			},
			locales: {
				[LanguageCode.EnglishBritish]: "Hello {{displayName}}!",
				[LanguageCode.Japanese]: "{{displayName}}, こんにちは！"
			}
		};

		const expectedResult = `({
/**
 * [en-GB]: The name to display in the greeting.
 * [ja-JP]: 挨拶で表示する名前。
 */
displayName = "guest",
}: { displayName?: string; }): createNoriI18nCollectionGenerator => ({
	_meta: {
		kind: "noriI18nCollection"
	},
[LanguageCode.EnglishBritish]: \`Hello \${ displayName }!\`,
[LanguageCode.Japanese]: \`\${ displayName }, こんにちは！\`
}),`;

		const generatedFunction = TypeScriptCodeGenerator.generateRecordValue(collectionEntry);

		expect(generatedFunction.trim()).toBe(expectedResult.trim());
	});
});
