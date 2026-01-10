import fs from "fs/promises";
import yaml from "yaml";

export const readYamlFile = async (path: string) => {
	const fileContent = await fs.readFile(path, "utf-8");
	return yaml.parse(fileContent);
};
