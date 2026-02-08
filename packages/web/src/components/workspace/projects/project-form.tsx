import { FileBrowser } from "@/components/file-browser/file-browser";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, useCarousel } from "@/components/ui/carousel";
import { Enum } from "@nori/core";
import { type FC } from "react";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator } from "../../ui/field";
import { Input } from "../../ui/input";
import type { UseProjectFormReturn } from "./use-project-form";

const [CarouselSlides] = Enum({
	ProjectDetails: 0,
	FileBrowser: 1
});

export type ProjectFormProps = {
	controls: UseProjectFormReturn;
};
export const ProjectForm: FC<ProjectFormProps> = ({ controls }) => {
	const { values, onChange } = controls;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		controls.handleSubmit();
	};

	const onKeyDown = (e: React.KeyboardEvent) => {
		if (e.key !== "Enter") return;
		handleSubmit(e);
	};

	const { name, description, configuration = {} } = values;

	const carousel = useCarousel({ initialSlide: CarouselSlides.ProjectDetails });

	return (
		<form className="flex items-center gap-2" onSubmit={handleSubmit}>
			<Carousel>
				<CarouselContent carouselHook={carousel}>
					<CarouselItem>
						<div className="grid flex-1 gap-2">
							<FieldGroup>
								<Field>
									<FieldLabel htmlFor="project-name">Project Name</FieldLabel>
									<Input
										id="project-name"
										placeholder="my-new-project"
										value={name}
										onChange={(e) =>
											onChange({ ...values, name: e.target.value })
										}
										required
										autoComplete="off"
										autoCorrect="off"
										onKeyDown={onKeyDown}
									/>
									<FieldDescription>
										Enter the name of your new project.
									</FieldDescription>
								</Field>
								<Field>
									<FieldLabel htmlFor="project-description">
										Project Description
									</FieldLabel>
									<Input
										id="project-description"
										placeholder="A brief description of the project"
										value={description}
										onChange={(e) =>
											onChange({ ...values, description: e.target.value })
										}
										onKeyDown={onKeyDown}
										autoComplete="off"
										autoCorrect="off"
									/>
									<FieldDescription>
										Optionally, enter a description for your project.
									</FieldDescription>
								</Field>
							</FieldGroup>

							<FieldSeparator />

							{/* Input/Output files */}
							<FieldGroup>
								<Field>
									<FieldLabel htmlFor="project-source-file">
										Nori File Path
									</FieldLabel>
									<div className="flex gap-2 justify-between">
										<Input
											id="project-source-file"
											className="truncate"
											placeholder="location of your nori.yaml file"
											type="text"
											value={configuration.sourceFilePath || ""}
											onChange={(e) => {
												onChange({
													...values,
													configuration: {
														...configuration,
														sourceFilePath: e.target.value
													}
												});
											}}
											aria-invalid={!values.configuration?.sourceFilePath}
											autoComplete="off"
											autoCorrect="off"
										/>
										<Button
											type="button"
											onClick={() =>
												carousel.goToIndex(CarouselSlides.FileBrowser)
											}
										>
											Browse
										</Button>
									</div>
									<FieldDescription>
										Path to the Nori file for this project.
									</FieldDescription>
								</Field>
							</FieldGroup>
						</div>
					</CarouselItem>

					<CarouselItem>
						<FileBrowser
							extensions={[".yaml", ".yml"]}
							onSelect={(path) => {
								onChange({
									...values,
									configuration: {
										...values.configuration,
										sourceFilePath: path
									}
								});
								carousel.goToIndex(CarouselSlides.ProjectDetails);
							}}
						/>
					</CarouselItem>
				</CarouselContent>
			</Carousel>
		</form>
	);
};
