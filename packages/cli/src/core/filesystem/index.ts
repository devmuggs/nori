import fs from "fs";
import path from "path";

export class FileSystem {
	constructor() {}

	public exists(path: string): boolean {
		return fs.existsSync(FileSystem.normalisePath(path));
	}

	public readFile(filePath: string, encoding: BufferEncoding = "utf-8"): string {
		return fs.readFileSync(FileSystem.normalisePath(filePath), { encoding });
	}

	public writeFile(
		filePath: string,
		data: string,
		options: Partial<{
			encoding: BufferEncoding;
			mode: "prepend" | "append" | "overwrite";
		}> = {}
	): void {
		const { encoding = "utf-8", mode = "append" } = options;

		const normalisedFilePath = FileSystem.normalisePath(filePath);

		if (mode === "overwrite") {
			fs.writeFileSync(normalisedFilePath, data, { encoding });
		} else if (mode === "append") {
			fs.appendFileSync(normalisedFilePath, data, { encoding });
		} else if (mode === "prepend") {
			const existingData = this.exists(normalisedFilePath)
				? this.readFile(normalisedFilePath, encoding)
				: "";
			fs.writeFileSync(normalisedFilePath, data + existingData, { encoding });
		}
	}

	public mkDir(path: string, options: Partial<{ recursive: boolean }> = {}): void {
		const { recursive = true } = options;
		const normalisedPath = FileSystem.normalisePath(path);
		fs.mkdirSync(normalisedPath, { recursive });
	}

	public remove(path: string, options: Partial<{ recursive: boolean }> = {}): void {
		const { recursive = false } = options;
		const normalisedPath = FileSystem.normalisePath(path);
		fs.rmSync(normalisedPath, { recursive, force: true });
	}

	/**
	 * Normalises file path in case it has things like double slashes etc.
	 * @param filePath
	 */
	public static normalisePath(filePath: string): string {
		const segments = filePath.split(path.sep);
		const normalisedSegments: string[] = [];

		for (const segment of segments) {
			if (segment === "" || segment === ".") {
				continue;
			} else if (segment === "..") {
				normalisedSegments.pop();
			} else {
				normalisedSegments.push(segment);
			}
		}

		return path.isAbsolute(filePath)
			? path.sep + normalisedSegments.join(path.sep)
			: normalisedSegments.join(path.sep);
	}
}
