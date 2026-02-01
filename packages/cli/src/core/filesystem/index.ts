import fs from "fs";

export class FileSystem {
	constructor() {}

	public exists(path: string): boolean {
		return fs.existsSync(path);
	}

	public readFile(filePath: string, encoding: BufferEncoding = "utf-8"): string {
		return fs.readFileSync(filePath, { encoding });
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
		if (mode === "overwrite") {
			fs.writeFileSync(filePath, data, { encoding });
		} else if (mode === "append") {
			fs.appendFileSync(filePath, data, { encoding });
		} else if (mode === "prepend") {
			const existingData = this.exists(filePath) ? this.readFile(filePath, encoding) : "";
			fs.writeFileSync(filePath, data + existingData, { encoding });
		}
	}
}
