import { useState } from "react";
import type { Project } from "../workspace-types";

const defaultValues: Project = { id: "", name: "", description: "", configuration: {} };
export type UseProjectFormReturn = ReturnType<typeof useProjectForm>;
export const useProjectForm = (options: {
	defaultValues?: Project;
	onCancel: () => void;
	onSubmit: (project: Project) => void;
}) => {
	const { onCancel, onSubmit } = options;

	const [values, setValues] = useState<Project>(options.defaultValues || defaultValues);

	return {
		values,
		reset: (fields?: Project) => setValues(fields || defaultValues),
		onChange: setValues,

		handleCancel: () => {
			onCancel();
			setValues(defaultValues);
		},

		handleSubmit: () => {
			onSubmit({
				id: values.id || crypto.randomUUID(),
				name: values.name,
				description: values.description,
				configuration: values.configuration
			});
			setValues(defaultValues);
		}
	};
};
