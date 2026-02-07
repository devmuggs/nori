import fs from "fs/promises";
import yaml from "yaml";

const ingest = async (path: string) => {
	const fileContent = await fs.readFile(path, "utf-8");
	return yaml.parse(fileContent);
};

const dump = async (path: string, data: unknown) => {
	const yamlContent = yaml.stringify(data);
	await fs.writeFile(path, yamlContent, "utf-8");
};

const Yaml = {
	ingest,
	dump
};

export default Yaml;
