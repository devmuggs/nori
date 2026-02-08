import { useFileWatcher } from "@/hooks/use-file-watcher";
import {
	codeGeneratorFactory,
	Enum,
	NoriSDK,
	NoriYamlSchema,
	SupportedCodeGenerator,
	SupportedCodeGeneratorMeta,
	type EnumValue,
	type NoriYaml
} from "@nori/core";
import { useCallback, useEffect, useMemo, useRef, useState, type FC } from "react";
import { codeToHtml } from "shiki";
import yaml from "yaml";

import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue
} from "@/components/ui/select";
import clsx from "clsx";
import { useActiveProject } from "../workspace-store";

type ExtensionToLanguage = EnumValue<typeof ExtensionToLanguage>;
const [ExtensionToLanguage, ExtensionToLanguageMeta] = Enum({
	ts: "typescript",
	tsx: "tsx",
	js: "javascript",
	jsx: "jsx",
	py: "python",
	rb: "ruby",
	yml: "yaml",
	yaml: "yaml",
	json: "json",
	md: "markdown",
	html: "html",
	css: "css",
	scss: "scss",
	txt: "text"
});

// Component to display highlighted code with preserved scroll position
const CodePreview: FC<{ code: string; language: string }> = ({ code, language }) => {
	const [highlightedCode, setHighlightedCode] = useState<string>("");

	const containerRef = useRef<HTMLDivElement | null>(null);
	const scrollPositionRef = useRef(0);

	// Highlight code when it changes
	useEffect(() => {
		// Save scroll position before updating content
		const preElement = containerRef.current?.querySelector("pre");
		if (preElement) {
			scrollPositionRef.current = preElement.scrollTop;
		}

		const highlight = async () => {
			const html = await codeToHtml(code, {
				lang: language,
				theme: "github-dark"
			});
			setHighlightedCode(html);
		};

		highlight();
	}, [code, language]);

	// Attach scroll listener
	useEffect(() => {
		const preElement = containerRef.current?.querySelector("pre");
		if (!preElement) return;

		const handleScroll = () => {
			scrollPositionRef.current = preElement.scrollTop;
		};

		preElement.addEventListener("scroll", handleScroll, { passive: true });
		return () => preElement.removeEventListener("scroll", handleScroll);
	}, [highlightedCode]);

	// Restore scroll position after content changes
	useEffect(() => {
		const preElement = containerRef.current?.querySelector("pre");
		if (preElement && scrollPositionRef.current > 0) {
			preElement.scrollTop = scrollPositionRef.current;
		}
	}, [highlightedCode]);

	return (
		<div
			dangerouslySetInnerHTML={{ __html: highlightedCode }}
			className="rounded-md overflow-hidden border-muted-foreground [&_pre]:p-4! [&_pre]:m-0! [&_pre]:max-h-96 [&_pre]:overflow-auto [&_pre]:wrap-break-all! [&_pre]:whitespace-pre-wrap"
		/>
	);
};

// Handles fetching and reload of the file content
export const WatchedFilePreview: FC<{
	filePath: string;
	className?: string;
	onLoad?: (fileContent: string) => void;
}> = ({ filePath, onLoad, className }) => {
	const [blobUrl, setBlobUrl] = useState<string | null>(null);
	const [fileContent, setFileContent] = useState<string>("");
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [error, setError] = useState<Error | null>(null);

	const extension = filePath.split(".").pop() || "";
	const language = ExtensionToLanguage[extension as keyof typeof ExtensionToLanguage] || "text";

	const fetchSourceFile = useCallback(
		async (path: string) => {
			setIsLoading(true);
			setError(null);

			try {
				const fileBlob = await NoriSDK.fileSystem.readFile(path);
				const text = await fileBlob.text();
				setFileContent(text);
				onLoad?.(text);
				setBlobUrl(URL.createObjectURL(fileBlob));
			} catch (err) {
				setError(err as Error);
			} finally {
				setIsLoading(false);
			}
		},
		[onLoad]
	);

	useEffect(() => {
		if (!filePath) return;
		fetchSourceFile(filePath);
	}, [filePath, language, fetchSourceFile]);

	useFileWatcher(filePath, () => {
		fetchSourceFile(filePath);
	});

	if (isLoading) {
		return <p>Loading file...</p>;
	}

	if (error) {
		return <p className="text-red-500">Error loading file: {error.message}</p>;
	}

	if (ExtensionToLanguageMeta.evaluateIsValue(extension)) {
		return <CodePreview code={fileContent} language={language} />;
	}

	if (
		blobUrl &&
		(extension === "png" ||
			extension === "jpg" ||
			extension === "jpeg" ||
			extension === "gif" ||
			extension === "webp")
	) {
		return (
			<img
				className={clsx("max-w-full h-auto rounded-md ", className)}
				src={blobUrl}
				alt="Project Source"
			/>
		);
	}

	return <p>Unsupported file type for preview.</p>;
};

export const ProjectSourceFilePreview: FC<{
	sourceFilePath: string | undefined;
	onLoad?: (fileContent: string) => void;
}> = ({ sourceFilePath, onLoad }) => {
	return (
		<div className="mt-4">
			<h2 className="text-lg font-semibold mb-2">Source File Preview:</h2>

			{sourceFilePath ? (
				<WatchedFilePreview filePath={sourceFilePath} onLoad={onLoad} />
			) : (
				<p className="text-gray-500">No source file path specified.</p>
			)}
		</div>
	);
};

export const ProjectDetails: FC = () => {
	const project = useActiveProject();
	const [yamlString, setYamlString] = useState<string | null>(null);
	const [outputLanguage, setOutputLanguage] = useState<SupportedCodeGenerator>(
		SupportedCodeGenerator.TypeScript
	);

	const Nori: NoriYaml | Error = useMemo(() => {
		try {
			return NoriYamlSchema.parse(yaml.parse(yamlString || ""));
		} catch (error) {
			console.error("Failed to parse YAML content.", error);
			return error as Error;
		}
	}, [yamlString]);

	const noriCodeGen: string | Error = useMemo(() => {
		if (!Nori) return Error;
		try {
			const codeGenerator = codeGeneratorFactory(outputLanguage);
			return codeGenerator.generate(Nori);
		} catch (error) {
			console.error(`Failed to generate ${outputLanguage} code.`, error);
			return error as Error;
		}
	}, [Nori, outputLanguage]);

	if (!project) {
		return <div>No active project selected.</div>;
	}

	return (
		<>
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold mb-4">{project.name}</h1>
					<p className="mb-2">{project.description}</p>
					<p className="mb-4">
						<strong>Project ID:</strong> {project.id}
					</p>
				</div>
				<WatchedFilePreview
					className="size-24"
					filePath={project.configuration.thumbnailPath || ""}
				/>
			</div>

			<ProjectSourceFilePreview
				sourceFilePath={project.configuration.sourceFilePath}
				onLoad={setYamlString}
			/>

			{Nori instanceof Error ? (
				<p className="mt-2 text-red-500">Error parsing YAML: {Nori.message}</p>
			) : (
				<p className="mt-2 text-green-500">YAML parsed successfully.</p>
			)}

			{!(noriCodeGen instanceof Error) ? (
				<div className="space-y-4 mt-6">
					<Select
						value={outputLanguage}
						onValueChange={(value) =>
							SupportedCodeGeneratorMeta.evaluateIsValue(value) &&
							setOutputLanguage(value)
						}
					>
						<SelectTrigger>
							<SelectValue placeholder="Programming Language" className="w-64" />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								{SupportedCodeGeneratorMeta.values.map((generator) => (
									<SelectItem key={generator} value={generator}>
										{SupportedCodeGeneratorMeta.reverseLookup(generator)}
									</SelectItem>
								))}
							</SelectGroup>
						</SelectContent>
					</Select>

					<CodePreview code={noriCodeGen} language={outputLanguage} />
					<p className="mt-2 text-sm text-gray-500">
						* This code is auto-generated from the Nori YAML configuration.
					</p>
				</div>
			) : (
				<p className="mt-2 text-red-500">Error generating code: {noriCodeGen.message}</p>
			)}
		</>
	);
};
