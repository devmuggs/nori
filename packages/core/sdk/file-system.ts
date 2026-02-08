import axios from "axios";
import z from "zod";

const pathStringToStack = (path: string): string[] => {
	const segments = path.split("/").filter((segment) => segment.length > 0);
	const stack: string[] = [];
	for (const segment of segments) {
		if (segment === ".") continue;
		if (segment === "..") {
			stack.pop();
		} else {
			stack.push(segment);
		}
	}
	return stack;
};

export type ListDirectoryQuery = z.infer<typeof ListDirectoryQuerySchema>;
export const ListDirectoryQuerySchema = z.object({
	q: z.string().regex(/.*/).optional(),
	["show-hidden"]: z.enum(["true", "false"]).optional().default("false"),
	["allowed-extensions"]: z
		.string()
		.transform((val) => val.split(",").map((ext) => ext.trim()))
		.optional()
});

export type FileSystemResponse = z.infer<typeof FileSystemResponseSchema>;
export const FileSystemResponseSchema = z.object({
	dir: z.string(),
	children: z.array(
		z.object({
			name: z.string(),
			isDirectory: z.boolean()
		})
	)
});

const FileSystem = {
	helpers: {
		pathStringToStack
	},

	schemas: {
		listDirectory: {
			query: ListDirectoryQuerySchema,
			response: FileSystemResponseSchema
		}
	},

	listDirectory: async (query: ListDirectoryQuery): Promise<FileSystemResponse> => {
		const request = await axios.get("http://localhost:3080/file-system/list-directory", {
			params: {
				...query,
				"allowed-extensions": query["allowed-extensions"]?.join(",") || ""
			}
		});

		const responseParse = FileSystemResponseSchema.parse(request.data);
		return responseParse;
	},

	readFile: async (path: string): Promise<Blob> => {
		const request = await axios.get("http://localhost:3080/file-system/read-file", {
			params: { path },
			responseType: "blob"
		});
		return request.data;
	}
};

export default FileSystem;
