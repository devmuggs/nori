import { LanguageCode } from "../../../locales/locale-enums.js";
import type {
	NoriYaml,
	YamlCollectionEntry,
	YamlCollectionEntryParams
} from "../../../state/state-schemas.js";
import { PythonCodeGenerator } from "../index.js";

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
				description: "A friendly farewell message.",
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

describe("PythonCodeGenerator", () => {
	it("generates a property key from kebab-case", () => {
		expect(PythonCodeGenerator.generatePropertyKey("lets-get-started")).toBe(
			"lets_get_started"
		);
		expect(PythonCodeGenerator.generatePropertyKey("greeting")).toBe("greeting");
	});

	it("converts PascalCase to snake_case", () => {
		expect(PythonCodeGenerator.toSnakeCase("EnglishBritish")).toBe("english_british");
		expect(PythonCodeGenerator.toSnakeCase("Japanese")).toBe("japanese");
	});

	it("converts PascalCase to SCREAMING_SNAKE_CASE", () => {
		expect(PythonCodeGenerator.toScreamingSnake("EnglishBritish")).toBe("ENGLISH_BRITISH");
		expect(PythonCodeGenerator.toScreamingSnake("Japanese")).toBe("JAPANESE");
	});

	it("sanitizes Python identifiers", () => {
		expect(PythonCodeGenerator.sanitizePythonIdentifier("my-collection")).toBe("my_collection");
		expect(PythonCodeGenerator.sanitizePythonIdentifier("3things")).toBe("_3things");
		expect(PythonCodeGenerator.sanitizePythonIdentifier("normal")).toBe("normal");
	});

	it("generates a description docstring from a string", () => {
		const description = "A friendly greeting message.";
		expect(PythonCodeGenerator.generateDescriptionComment(description)).toBe(
			`    """A friendly greeting message."""`
		);
	});

	it("generates a description docstring from an i18n object", () => {
		const description = {
			[LanguageCode.EnglishBritish]: "A friendly greeting message.",
			[LanguageCode.Japanese]: "親しみやすい挨拶メッセージ。"
		};
		expect(PythonCodeGenerator.generateDescriptionComment(description)).toBe(
			`    """\n    en-GB: A friendly greeting message.\n    ja-JP: 親しみやすい挨拶メッセージ。\n    """`
		);
	});

	it("generates function params with required and optional args", () => {
		const result = PythonCodeGenerator.generateFunctionParams(params);
		expect(result).toBe(`*, topic: str, count: int | float = 5`);
	});

	it("returns empty string for no params", () => {
		expect(PythonCodeGenerator.generateFunctionParams(undefined)).toBe("");
		expect(PythonCodeGenerator.generateFunctionParams({})).toBe("");
	});

	it("converts JS literals to Python literals", () => {
		expect(PythonCodeGenerator.pythonLiteral("guest")).toBe(`"guest"`);
		expect(PythonCodeGenerator.pythonLiteral(true)).toBe("True");
		expect(PythonCodeGenerator.pythonLiteral(false)).toBe("False");
		expect(PythonCodeGenerator.pythonLiteral(42)).toBe("42");
		expect(PythonCodeGenerator.pythonLiteral(null)).toBe("None");
	});

	it("formats interpolated strings as f-strings", () => {
		expect(PythonCodeGenerator.formatInterpolatedStrings("Hello {{name}}!")).toBe(
			`f"Hello {name}!"`
		);
	});

	it("formats plain strings without f prefix", () => {
		expect(PythonCodeGenerator.formatInterpolatedStrings("Hello!")).toBe(`"Hello!"`);
	});

	it("generates the i18n body", () => {
		const locales = {
			[LanguageCode.EnglishBritish]: "Let's get started with {{topic}}.",
			[LanguageCode.Japanese]: "さあ、{{topic}}を始めましょう！"
		};
		const result = PythonCodeGenerator.generateI18nBody(locales);
		expect(result).toBe(
			`        english_british=f"Let's get started with {topic}.",\n` +
				`        japanese=f"さあ、{topic}を始めましょう！",`
		);
	});

	it("generates a full function definition with params", () => {
		const entry: YamlCollectionEntry = {
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

		const result = PythonCodeGenerator.generateFunctionDefinition("my-greeting", entry);

		expect(result).toContain("def my_greeting");
		expect(result).toContain('displayName: str = "guest"');
		expect(result).toContain("-> NoriI18nCollection:");
		expect(result).toContain("return _col(");
		expect(result).toContain('english_british=f"Hello {displayName}!"');
		expect(result).toContain('japanese=f"{displayName}, こんにちは！"');
	});

	it("generates a full function definition without params", () => {
		const entry: YamlCollectionEntry = {
			description: "A greeting.",
			locales: {
				[LanguageCode.EnglishBritish]: "Hello!",
				[LanguageCode.Japanese]: "こんにちは！"
			}
		};

		const result = PythonCodeGenerator.generateFunctionDefinition("greeting", entry);

		expect(result).toContain("def greeting() -> NoriI18nCollection:");
		expect(result).toContain('"""A greeting."""');
		expect(result).toContain('english_british="Hello!"');
	});

	it("generates a complete module from NoriYaml", () => {
		const generator = new PythonCodeGenerator();
		const output = generator.generate(demo);

		// Header checks
		expect(output).toContain("from __future__ import annotations");
		expect(output).toContain("class LanguageCode(StrEnum):");
		expect(output).toContain('ENGLISH_BRITISH = "en-GB"');
		expect(output).toContain('JAPANESE = "ja-JP"');
		expect(output).toContain("class NoriI18nCollection:");
		expect(output).toContain("def _col(**kwargs: str) -> NoriI18nCollection:");

		// Collection classes
		expect(output).toContain("class root:");
		expect(output).toContain('"""Collection: root"""');
		expect(output).toContain("def lets_get_started");
		expect(output).toContain("topic: str");

		expect(output).toContain("class client:");
		expect(output).toContain('"""Collection: client"""');
		expect(output).toContain("def greeting() -> NoriI18nCollection:");
		expect(output).toContain("def farewell() -> NoriI18nCollection:");
	});
});
