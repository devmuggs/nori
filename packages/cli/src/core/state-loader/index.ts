import fs from "fs/promises";
import path from "path";
import { environment } from "../environment-loader.js";
import logger from "../logger.js";
import { INoriCollection, IYamlSchema, type INoriEntry } from "./state-loader-schemas.js";
import { NoriLocale } from "./state-loader-types.js";
import { readYamlFile } from "./utils.js";

export class NoriEntry {
	public readonly id: string;
	public readonly params: INoriEntry["params"];
	public readonly locales: INoriEntry["locales"];

	constructor(id: string, { params, locales }: INoriEntry) {
		logger.trace(
			`Creating NoriEntry with params: ${JSON.stringify(
				params
			)} and locales: ${JSON.stringify(locales)}`
		);

		this.id = id;
		this.params = params ?? {};
		this.locales = locales;
	}

	public toString(): string {
		const paramsCount = this.params ? Object.keys(this.params).length : 0;
		const localesCount = this.locales ? Object.keys(this.locales).length : 0;
		return `${this.id} - NoriEntry(params=${paramsCount}, locales=${localesCount}/${
			Object.keys(NoriLocale).length
		})`;
	}
}

export class NoriCollection {
	public readonly id: string;
	public readonly collections: Map<string, NoriCollection> = new Map();
	public readonly entries: Map<string, NoriEntry> = new Map();

	constructor(id: string, params: INoriCollection) {
		this.id = id;

		if (params.collections) {
			this.collections = new Map(
				Object.entries(params.collections).map(([key, value]) => [
					key,
					new NoriCollection(key, value as INoriCollection)
				])
			);
		}

		if (params.entries) {
			this.entries = new Map(
				Object.entries(params.entries).map(([key, value]) => [
					key,
					new NoriEntry(`${id}.${key}`, value as INoriEntry)
				])
			);
		}
	}

	public toString(): string {
		return `NoriCollection(${this.collections.size} collections, ${this.entries.size} entries)`;
	}
}

export class NoriManager {
	public static collections: Map<string, NoriCollection> = new Map();

	public static async loadFromYaml(filePath: string = environment.NoriYamlPath): Promise<void> {
		if (!filePath) {
			throw new Error("No YAML file path provided. Set NORI_YAML_PATH environment variable.");
		}

		const resolvedPath = path.resolve(filePath);
		const stat = await fs.stat(resolvedPath);
		if (!stat.isFile()) {
			throw new Error(`Path ${resolvedPath} is not a file.`);
		}
		const data = await readYamlFile(resolvedPath);
		const parsedData = IYamlSchema.parse(data);

		this.collections = new Map<string, NoriCollection>();
		if (!parsedData.collections) {
			logger.warn("No collections found in the YAML file.");
			return;
		}

		for (const [key, value] of Object.entries(parsedData.collections)) {
			this.collections.set(key, new NoriCollection(key, value as INoriCollection));
		}
	}

	public static toString(): string {
		return `NoriManager(collections=${JSON.stringify(Array.from(this.collections.entries()))})`;
	}

	public static getCollectionById(id: string): NoriCollection | undefined {
		return this.collections.get(id);
	}

	public static debugPrint() {
		const collectionStack: Array<NoriCollection> = [];

		const outputStrings: string[] = [`NoriManager State:`];

		while (collectionStack.length > 0 || this.collections.size > 0) {
			let currentCollection: NoriCollection;
			if (collectionStack.length > 0) {
				currentCollection = collectionStack.pop() as NoriCollection;
			} else {
				const firstKey = this.collections.keys().next().value;
				if (!firstKey) break;
				currentCollection = this.collections.get(firstKey) as NoriCollection;
				this.collections.delete(firstKey);
			}

			outputStrings.push(`Collection: ${currentCollection.id}`);

			for (const [entryId, entry] of currentCollection.entries) {
				outputStrings.push(`  Entry: ${entry.toString()}`);
			}
			collectionStack.push(...currentCollection.collections.values());
		}

		logger.debug(outputStrings.join("\n"));
	}
}
