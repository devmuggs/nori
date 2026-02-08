export type ProjectConfiguration = {
	sourceFilePath: string;
	outputFilePath: string;
	options: Record<string, unknown>;
};

export type Project = {
	id: string;
	name: string;
	description?: string;
	configuration: Partial<ProjectConfiguration>;
};

export type EditableProjectFields = Omit<Project, "id">;
