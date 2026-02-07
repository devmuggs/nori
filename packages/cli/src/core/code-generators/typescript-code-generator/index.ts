import {
	LanguageCode,
	LanguageCodeMeta,
	ParamType,
	ParamTypeMeta,
	type NoriYaml,
	type YamlCollectionEntry,
	type YamlCollectionEntryParams,
	type YamlI18nString,
	type YamlI18nStringOrString
} from "@nori/core";

/*

The point of the code generator is to take a NoriYaml collections object, and generate the actual code that
will be used in the user's codebase.

For TypeScript, this means generating .ts files with type definitions and functions to retrieve localized strings.

The resulting file should look something like this:

```typescript
import type { LanguageCode } from "nori-cli/core/locales/locale-enums.js";

export interface NoriI18nCollection extends Readonly<Record<LanguageCode, string>> {
	_meta: {
		kind: "noriI18nCollection";
	};
}

const nori = {
    {{ description (can't write here because it will break our comment block) }}
	letsGetStarted: (params: { topic: string }): NoriI18nCollection => ({
		_meta: {
			kind: "noriI18nCollection"
		},
		[LanguageCode.EnglishBritish]: `Let's get started with ${params.topic}.`,
		[LanguageCode.Japanese]: `さあ、${params.topic}を始めましょう！`
	}),
	greeting: (): NoriI18nCollection => ({
		_meta: {
			kind: "noriI18nCollection"
		},
		[LanguageCode.EnglishBritish]: "Hello!",
		[LanguageCode.Japanese]: "こんにちは！"
	}),
	farewell: (): NoriI18nCollection => ({
		_meta: {
			kind: "noriI18nCollection"
		},
		[LanguageCode.EnglishBritish]: "Goodbye!",
		[LanguageCode.Japanese]: "さようなら！"
	})
};

export default nori;
```

Lets break this into smaller steps:

1. Keep the headers simple, just the imports and interface definition for NoriI18nCollection.

2. For each collection (e.g., "root", "client"), create a corresponding object in the generated code.

3. For each key in the collection (e.g. 'lets-get-started', 'greeting'), we need to do the following
   - Convert the key to camelCase for the function name.
   - Construct a function definition that takes parameters if there are any defined in the params object.
   - The function should return an object of type NoriI18nCollection, with the localized strings filled in.

4. Handle parameter interpolation by using template literals in TypeScript.

5. Finally, export the entire structure as a single object for easy import and use in the user's codebase.

*/

export class TypeScriptCodeGenerator {
	generate(noriYaml: NoriYaml): string {
		const lines: string[] = [];

		lines.push(TypeScriptCodeGenerator.generateHeader());

		for (const [collectionName, collectionEntries] of Object.entries(noriYaml.collections)) {
			lines.push(`\n/** Collection: ${collectionName} */`);
			lines.push(`${collectionName}: {`);
			const entries: string[] = [];

			for (const [key, entry] of Object.entries(collectionEntries)) {
				entries.push(TypeScriptCodeGenerator.generateFunctionDefinition(key, entry));
			}

			lines.push(entries.join(",\n"));
			lines.push("},\n");
		}

		lines.push(TypeScriptCodeGenerator.generateFooter());

		return lines.join("\n");
	}

	public static generateHeader(): string {
		return `


type LanguageCode = (typeof LanguageCode)[keyof typeof LanguageCode];
const LanguageCode = Object.freeze({
${Object.values(LanguageCode)
	.map((code) => `\t${LanguageCodeMeta.reverseLookup(code)}: "${code}",`)
	.join("\n")}
});


export interface NoriI18nCollection extends Readonly<Record<LanguageCode, string>> {
	_meta: {
		kind: "noriI18nCollection";
	};
}

const createNoriI18nCollection = (
	collection: Readonly<Record<LanguageCode, string>>
): NoriI18nCollection => {
	return Object.freeze({
		...collection,
		_meta: {
			kind: "noriI18nCollection" as const
		}
	});
};

const createNoriI18nCollectionGenerator = <TParams extends Record<string, any>>(
	generator: (params: TParams) => NoriI18nCollection
): ((params: TParams) => NoriI18nCollection) => {
	return generator;
};


const nori = Object.freeze({
`;
	}

	public static generatePropertyKey(key: string): string {
		return key
			.split("-")
			.map((part, index) =>
				index === 0
					? part.toLowerCase()
					: part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
			)
			.join("");
	}

	public static generateDescriptionComment(
		description: YamlI18nStringOrString | undefined
	): string {
		if (!description) {
			return "";
		}

		if (typeof description === "string") {
			return `/**\n * ${description}\n */\n`;
		} else {
			const lines = Object.entries(description).map(
				([lang, desc]) => ` * - ${lang}: ${desc}`
			);
			return `/**\n${lines.join("\n")}\n */`;
		}
	}

	public static typeMapping = ParamTypeMeta.derive({
		[ParamType.String]: "string",
		[ParamType.Number]: "number",
		[ParamType.Boolean]: "boolean"
	});

	public static generateFunctionCallParams(
		params: YamlCollectionEntryParams | undefined,
		tabLevel = 0
	): string {
		if (!params || Object.keys(params).length === 0) {
			return "";
		}

		const lines: string[] = ["{"];

		for (const param in params) {
			const config = params[param];
			if (!config) continue;

			const defaultString =
				config.default !== undefined ? ` = ${JSON.stringify(config.default)}` : "";

			lines.push(`${param}${defaultString},`);
		}

		lines.push("}");

		return lines.join("\n");
	}

	public static generateFunctionCallParamType(
		params: YamlCollectionEntryParams | undefined
	): string {
		if (!params || Object.keys(params).length === 0) {
			return "";
		}

		const lines: string[] = [];

		Object.entries(params).forEach(([paramName, paramOptions]) => {
			const tsType = TypeScriptCodeGenerator.typeMapping[paramOptions.type];
			const optionalFlag =
				paramOptions.optional || paramOptions.default !== undefined ? "?" : "";

			const descriptionComment = TypeScriptCodeGenerator.generateDescriptionComment(
				paramOptions.description
			);

			if (descriptionComment) lines.push(descriptionComment);

			lines.push(`${paramName}${optionalFlag}: ${tsType};`);
		});

		return `{\n${lines.join("\n")}\n}`;
	}

	public static generateI18nBody(i18n: YamlI18nString): string {
		const localeEntries = Object.entries(i18n).map(([langCode, text]) => {
			const languageCodeEnum = LanguageCodeMeta.reverseLookup(langCode as LanguageCode);
			const interpolatedText = TypeScriptCodeGenerator.formatInterpolatedStrings(text);
			return `[LanguageCode.${languageCodeEnum}]: ${interpolatedText}`;
		});

		return localeEntries.join(",\n");
	}

	public static formatInterpolatedStrings(template: string): string {
		// Replace {{param}} with ${param} for template literals
		const formatted = template.replace(/{{(.*?)}}/g, (_, p1) => `\${ ${p1.trim()} }`);
		return `\`${formatted}\``;
	}

	public static generateRecordValue(entry: YamlCollectionEntry): string {
		const lines: string[] = [];
		const { params, locales } = entry;

		const hasParams = params && Object.keys(params).length > 0;
		const paramList = TypeScriptCodeGenerator.generateFunctionCallParams(params);
		const paramType = TypeScriptCodeGenerator.generateFunctionCallParamType(params);

		let nextLine = hasParams
			? `createNoriI18nCollectionGenerator((${paramList}: ${paramType}) => `
			: "";

		nextLine += `createNoriI18nCollection({`;

		lines.push(nextLine);

		lines.push(TypeScriptCodeGenerator.generateI18nBody(locales));

		if (hasParams) {
			lines.push(`})),`);
		} else {
			lines.push(`})`);
		}

		return lines.join("\n");
	}

	public static generateRecordEntry(key: string, entry: YamlCollectionEntry): string {
		const descriptionComment = TypeScriptCodeGenerator.generateDescriptionComment(
			entry.description
		);
		const propertyKey = TypeScriptCodeGenerator.generatePropertyKey(key);
		const recordValue = TypeScriptCodeGenerator.generateRecordValue(entry);

		return `${descriptionComment}${propertyKey}: ${recordValue}`;
	}

	public static generateFunctionDefinition(key: string, entry: YamlCollectionEntry): string {
		return TypeScriptCodeGenerator.generateRecordEntry(key, entry);
	}

	public static generateFooter(): string {
		return `});

export default nori;
`;
	}
}
