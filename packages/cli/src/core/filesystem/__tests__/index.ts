import fs from "fs";
import os from "os";
import path from "path";

import { FileSystem } from "../index.js";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "fs-test-"));
const fileSystem = new FileSystem();

describe("FileSystem", () => {
	it("should write, read, and check existence of a file", () => {
		const testFilePath = path.join(tempDir, "test.txt");

		// Initially, the file should not exist
		expect(fileSystem.exists(testFilePath)).toBe(false);

		// Write to the file
		fileSystem.writeFile(testFilePath, "Hello, World!", { mode: "overwrite" });

		// Now, the file should exist
		expect(fileSystem.exists(testFilePath)).toBe(true);

		// Read the file content
		const content = fileSystem.readFile(testFilePath);
		expect(content).toBe("Hello, World!");
	});

	it("should append to a file", () => {
		const testFilePath = path.join(tempDir, "append.txt");

		// Write initial content
		fileSystem.writeFile(testFilePath, "First Line\n", { mode: "overwrite" });

		// Append content
		fileSystem.writeFile(testFilePath, "Second Line\n", { mode: "append" });

		// Read the file content
		const content = fileSystem.readFile(testFilePath);
		expect(content).toBe("First Line\nSecond Line\n");
	});

	it("should prepend to a file", () => {
		const testFilePath = path.join(tempDir, "prepend.txt");

		// Write initial content
		fileSystem.writeFile(testFilePath, "Last Line\n", { mode: "overwrite" });

		// Prepend content
		fileSystem.writeFile(testFilePath, "First Line\n", { mode: "prepend" });

		// Read the file content
		const content = fileSystem.readFile(testFilePath);
		expect(content).toBe("First Line\nLast Line\n");
	});
});
