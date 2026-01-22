import { LogLevels } from "consola";
import z from "zod";

import { ArgumentOption, Command } from "./cli-types.js";

const fileString = z.string().refine(
	(value) => {
		// regex to match valid file paths (basic)
		const filePathRegex = /^(\/|\.\/|\.\.\/)?([\w-]+(\/|\\))*[\w-]+\.[\w]+$/;
		return filePathRegex.test(value);
	},
	{ error: "Invalid file path format" }
);

export type ArgSchemaBaseType = z.infer<typeof ArgSchemaBase>;
export const ArgSchemaBase = z
	.object({
		kind: z.literal("base"),
		[ArgumentOption.LogLevel]: z.enum(LogLevels).default(LogLevels.info),
		[ArgumentOption.Verbose]: z.boolean().default(false),
		[ArgumentOption.Version]: z.boolean().default(false),
		[ArgumentOption.ConfigPath]: fileString.optional(),
		[ArgumentOption.Help]: z.boolean().default(false),
		[ArgumentOption.Init]: z.boolean().default(false)
	})
	.partial();

export type GenerateArgs = z.infer<typeof GenerateArgSchema>;
export const GenerateArgSchema = ArgSchemaBase.extend({
	[ArgumentOption.OutputDir]: fileString.default("./nori-generated"),
	[ArgumentOption.Force]: z.boolean().default(false),
	[ArgumentOption.Watch]: z.boolean().default(false)
})
	.partial()
	.extend({
		kind: z.literal(Command.Generate)
	});

export type ArgSchemasType = typeof ArgSchemas;
export const ArgSchemas = {
	[Command.Generate]: GenerateArgSchema
} as const;

export type ArgSchema = z.infer<typeof ArgSchema>;
export const ArgSchema = z.discriminatedUnion("kind", [GenerateArgSchema, ArgSchemaBase]);
