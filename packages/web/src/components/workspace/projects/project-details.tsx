import type { FC } from "react";
import type { Project } from "../workspace-types";

export const ProjectDetails: FC<{ project: Project }> = ({ project }) => {
	return <div>{JSON.stringify(project, undefined, 2)}</div>;
};
