import { NoriSDK } from "@nori/core";
import type { FileSystemResponse } from "@nori/core/sdk/file-system";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { ChevronLeft } from "lucide-react";
import { useState, type FC } from "react";
import { Button } from "../ui/button";
import { Field, FieldGroup, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";

const requestFileSystem = async (options: {
	path: string;
	showHidden: boolean;
	extensions?: string[];
}): Promise<FileSystemResponse | null> => {
	try {
		return await NoriSDK.fileSystem.listDirectory({
			q: options.path,
			"show-hidden": options.showHidden ? "true" : "false",
			"allowed-extensions": options.extensions || []
		});
	} catch (error) {
		console.error("Error selecting directory:", error);
		return null;
	}
};

const Preview: FC<{
	path: string;
	showHidden: boolean;
	onClick: (node: { name: string; isDirectory: boolean }) => void;
	extensions?: string[];
}> = ({ path, showHidden, onClick, extensions }) => {
	const { isLoading, error, data } = useQuery({
		queryKey: ["file-system", path, showHidden, extensions],
		queryFn: () => requestFileSystem({ path, showHidden, extensions })
	});

	if (isLoading) return <div>Loading...</div>;
	if (error) return <div>Error loading file system.</div>;

	const parentDirectory = NoriSDK.fileSystem.helpers
		.pathStringToStack(data?.dir || "")
		.slice(0, -1)
		.join("/");

	return (
		<div className=" border p-4 rounded-md">
			<div className="flex gap-2 w-full items-center mb-4">
				<Button
					type="button"
					variant="outline"
					onClick={() => onClick({ name: parentDirectory, isDirectory: true })}
				>
					<ChevronLeft size={16} />
				</Button>
				<Input className="rounded-md outline p-2 w-full" value={data?.dir} readOnly />
			</div>
			<ul
				className={clsx(
					"[&>li]:cursor-pointer [&>li]:p-2 [&>li]:hover:bg-accent-foreground/20 [&>li]:rounded-md",
					"ml-4 flex flex-col gap-2 my-4 [&>li]:odd:bg-accent/50 [&>li]:even:bg-transparent p-2 border rounded-md max-h-96 overflow-y-auto"
				)}
			>
				{data?.children.map((child) => (
					<li
						key={child.name}
						onClick={() => {
							onClick({
								name: `${data?.dir}/${child.name}`,
								isDirectory: child.isDirectory
							});
						}}
					>
						{child.name}
						{child.isDirectory ? "/" : ""}
					</li>
				))}
			</ul>
		</div>
	);
};

export const FileBrowser: FC<{ extensions?: string[]; onSelect: (path: string) => void }> = ({
	extensions,
	onSelect
}) => {
	const [pathStack, setPathStack] = useState<string[]>([]);
	const [settings, setSettings] = useState<{ showHiddenFiles: boolean }>({
		showHiddenFiles: false
	});

	const currentPath = pathStack[pathStack.length - 1] || "";

	const addPath = (path: string) => {
		const newPath = NoriSDK.fileSystem.helpers.pathStringToStack(path).join("/");
		setPathStack((prev) => [...prev, newPath]);
	};

	const handleClick = (node: { name: string; isDirectory: boolean }) => {
		if (node.isDirectory) {
			addPath(node.name);
		} else {
			onSelect(node.name);
		}
	};

	return (
		<div>
			<h1 className="text-2xl font-bold mb-4">File Browser</h1>
			<div className="mb-4">
				<FieldGroup>
					<Field orientation="horizontal">
						<Switch
							id="show-hidden-files"
							checked={settings.showHiddenFiles}
							onCheckedChange={(checked) =>
								setSettings({ ...settings, showHiddenFiles: checked ?? false })
							}
						/>
						<FieldLabel htmlFor="show-hidden-files">Show Hidden Files</FieldLabel>
					</Field>
				</FieldGroup>
			</div>

			<Preview
				path={currentPath}
				showHidden={settings.showHiddenFiles}
				onClick={handleClick}
				extensions={extensions}
			/>
		</div>
	);
};
