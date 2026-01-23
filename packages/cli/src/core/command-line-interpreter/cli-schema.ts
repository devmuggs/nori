import z from "zod";

import { LogLevels } from "consola";
import { ArgumentOption, ArgumentOptionMetadata, Command } from "./cli-types.js";

export const argumentFlagValueSchema = z.boolean().default(false);
export const fileString = z.string().refine(
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
		// using derive so we get ide errors if we forget to add a new ArgumentOption here
		...ArgumentOptionMetadata.derive({
			[ArgumentOption.LogLevel]: z.enum(LogLevels).default(LogLevels.info),
			[ArgumentOption.Verbose]: argumentFlagValueSchema,
			[ArgumentOption.Version]: argumentFlagValueSchema,
			[ArgumentOption.ConfigPath]: fileString.optional(),
			[ArgumentOption.OutputDir]: fileString.optional(),
			[ArgumentOption.Force]: argumentFlagValueSchema,
			[ArgumentOption.Watch]: argumentFlagValueSchema,
			[ArgumentOption.Init]: argumentFlagValueSchema,
			[ArgumentOption.Help]: argumentFlagValueSchema,
			[ArgumentOption.Env]: fileString.optional()
		})
	})
	.partial();

export type GenerateArgs = z.infer<typeof GenerateArgSchema>;
export const GenerateArgSchema = ArgSchemaBase.extend({
	[ArgumentOption.OutputDir]: fileString.default("./nori-generated"),
	[ArgumentOption.Force]: argumentFlagValueSchema,
	[ArgumentOption.Watch]: argumentFlagValueSchema
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
