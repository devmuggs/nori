import { LanguageCode, LanguageCodeMeta } from "../../locales/locale-enums.js";
import { ParamType, ParamTypeMeta } from "../../state/state-enums.js";
import type {
	NoriYaml,
	YamlCollectionEntry,
	YamlCollectionEntryParams,
	YamlI18nString,
	YamlI18nStringOrString
} from "../../state/state-schemas.js";
import type { ICodeGenerator } from "../index.js";

export class PythonCodeGenerator implements ICodeGenerator {
	generate(noriYaml: NoriYaml): string {
		const lines: string[] = [];

		lines.push(PythonCodeGenerator.generateHeader());

		for (const [collectionName, collectionEntries] of Object.entries(noriYaml.collections)) {
			lines.push("");
			lines.push(`class ${PythonCodeGenerator.sanitizePythonIdentifier(collectionName)}:`);
			lines.push(`    """Collection: ${collectionName}"""`);

			for (const [key, entry] of Object.entries(collectionEntries)) {
				lines.push("");
				lines.push(PythonCodeGenerator.generateFunctionDefinition(key, entry));
			}
		}

		lines.push("");

		return lines.join("\n");
	}

	// ---------------------------------------------------------------------------
	//  Header / Footer
	// ---------------------------------------------------------------------------

	public static generateHeader(): string {
		const enumMembers = Object.values(LanguageCode)
			.map((code) => {
				const key = LanguageCodeMeta.reverseLookup(code) as string;
				return `    ${PythonCodeGenerator.toScreamingSnake(key)} = "${code}"`;
			})
			.join("\n");

		return `from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum


class LanguageCode(StrEnum):
${enumMembers}


@dataclass(frozen=True)
class NoriI18nCollection:
${Object.values(LanguageCode)
	.map((code) => {
		const key = LanguageCodeMeta.reverseLookup(code) as string;
		return `    ${PythonCodeGenerator.toSnakeCase(key)}: str = ""`;
	})
	.join("\n")}

    def get(self, lang: LanguageCode) -> str:
        return getattr(self, lang.name.lower())


def _col(**kwargs: str) -> NoriI18nCollection:
    return NoriI18nCollection(**kwargs)`;
	}

	// ---------------------------------------------------------------------------
	//  Key / identifier helpers
	// ---------------------------------------------------------------------------

	/** Convert a kebab-case YAML key to snake_case for Python. */
	public static generatePropertyKey(key: string): string {
		return key.replace(/-/g, "_").toLowerCase();
	}

	/** Convert a PascalCase enum key (e.g. "EnglishBritish") to snake_case. */
	public static toSnakeCase(key: string): string {
		return key.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();
	}

	/** Convert a PascalCase enum key to SCREAMING_SNAKE_CASE for Python enums. */
	public static toScreamingSnake(key: string): string {
		return key.replace(/([a-z])([A-Z])/g, "$1_$2").toUpperCase();
	}

	/**
	 * Ensure a string is a valid Python identifier.
	 * Replaces hyphens with underscores and prefixes with `_` if it starts with
	 * a digit.
	 */
	public static sanitizePythonIdentifier(name: string): string {
		let result = name.replace(/-/g, "_");
		if (/^\d/.test(result)) {
			result = `_${result}`;
		}
		return result;
	}

	// ---------------------------------------------------------------------------
	//  Docstrings / comments
	// ---------------------------------------------------------------------------

	public static generateDescriptionComment(
		description: YamlI18nStringOrString | undefined
	): string {
		if (!description) {
			return "";
		}

		if (typeof description === "string") {
			return `      """${description}"""`;
		}

		const lines = Object.entries(description).map(([lang, desc]) => `        ${lang}: ${desc}`);
		return `      """\n${lines.join("\n")}\n      """`;
	}

	// ---------------------------------------------------------------------------
	//  Type mapping
	// ---------------------------------------------------------------------------

	public static typeMapping = ParamTypeMeta.derive({
		[ParamType.String]: "str",
		[ParamType.Number]: "int | float",
		[ParamType.Boolean]: "bool"
	});

	// ---------------------------------------------------------------------------
	//  Parameter generation
	// ---------------------------------------------------------------------------

	/**
	 * Generates the parameter list for a Python function signature.
	 *
	 * Parameters with defaults come after those without, respecting Python
	 * syntax rules. A bare `*` is always emitted to force keyword-only args.
	 */
	public static generateFunctionParams(params: YamlCollectionEntryParams | undefined): string {
		if (!params || Object.keys(params).length === 0) {
			return "";
		}

		const required: string[] = [];
		const optional: string[] = [];

		for (const [paramName, config] of Object.entries(params)) {
			const pyType = PythonCodeGenerator.typeMapping[config.type];

			if (config.default !== undefined) {
				optional.push(
					`${paramName}: ${pyType} = ${PythonCodeGenerator.pythonLiteral(config.default)}`
				);
			} else if (config.optional) {
				optional.push(`${paramName}: ${pyType} | None = None`);
			} else {
				required.push(`${paramName}: ${pyType}`);
			}
		}

		return `*, ${[...required, ...optional].join(", ")}`;
	}

	/**
	 * Converts a JS value to a Python literal representation.
	 */
	public static pythonLiteral(value: unknown): string {
		if (typeof value === "string") {
			return `"${value}"`;
		}
		if (typeof value === "boolean") {
			return value ? "True" : "False";
		}
		if (typeof value === "number") {
			return String(value);
		}
		return "None";
	}

	// ---------------------------------------------------------------------------
	//  Locale body
	// ---------------------------------------------------------------------------

	public static generateI18nBody(i18n: YamlI18nString): string {
		return Object.entries(i18n)
			.map(([langCode, text]) => {
				const key = LanguageCodeMeta.reverseLookup(langCode as LanguageCode) as string;
				const pyKey = PythonCodeGenerator.toSnakeCase(key);
				const formatted = PythonCodeGenerator.formatInterpolatedStrings(text);
				return `          ${pyKey}=${formatted},`;
			})
			.join("\n");
	}

	/**
	 * Replace `{{param}}` with `{param}` for Python f-strings.
	 *
	 * If the template contains interpolation placeholders it returns an
	 * `f"…"` string; otherwise a plain `"…"` string.
	 */
	public static formatInterpolatedStrings(template: string): string {
		const hasInterpolation = /{{.*?}}/.test(template);
		const formatted = template.replace(/{{(.*?)}}/g, (_, p1) => `{${p1.trim()}}`);
		return hasInterpolation ? `f"${formatted}"` : `"${formatted}"`;
	}

	// ---------------------------------------------------------------------------
	//  Function / record generation
	// ---------------------------------------------------------------------------

	public static generateFunctionDefinition(key: string, entry: YamlCollectionEntry): string {
		const fnName = PythonCodeGenerator.generatePropertyKey(key);
		const params = PythonCodeGenerator.generateFunctionParams(entry.params);
		const paramsPart = params ? `self${params ? `, ${params}` : ""}` : "";

		const signature = `    @staticmethod\n    def ${fnName}(${params}) -> NoriI18nCollection:`;

		const docstring = PythonCodeGenerator.generateDescriptionComment(entry.description);
		const body = PythonCodeGenerator.generateI18nBody(entry.locales);

		const parts: string[] = [signature];

		if (docstring) {
			parts.push(docstring);
		}

		parts.push(`      return _col(`);
		parts.push(body);
		parts.push(`      )`);

		return parts.join("\n");
	}
}
