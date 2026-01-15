import { LogLevels } from "consola";
import z from "zod";
import { SupportedCodeGenerator } from "../code-generators/index.js";
import { type EnumValue, Enum } from "../utils/enum.js";

export type GlobalCliOption = EnumValue<typeof GlobalCliOption>;
export const [GlobalCliOption] = Enum({
	Verbose: "verbose",
	Env: "env",
	LogLevel: "log-level"
});

export type GlobalCliOptions = z.infer<typeof GlobalCliOptionsSchema>;
export const GlobalCliOptionsSchema = z.object({
	[GlobalCliOption.Verbose]: z.string().optional().default("false"),
	[GlobalCliOption.Env]: z.string().optional(),
	[GlobalCliOption.LogLevel]: z.enum(Object.keys(LogLevels)).optional().default("info")
});

export type NoriCommand = EnumValue<typeof NoriCommand>;
export const [NoriCommand] = Enum({
	Init: "--init",
	Generate: "generate"
});

export type GenerateOptions = z.infer<typeof GenerateOptionsSchema>;
export const GenerateOptionsSchema = GlobalCliOptionsSchema.extend({
	kind: z.literal(NoriCommand.Generate),
	target: z.enum(SupportedCodeGenerator).optional().default("typescript"),
	output: z.string().optional().default("./nori-generated.ts"),
	force: z.string().optional().default("false")
});

export type NoriCommandSchemasType = typeof NoriCommandSchemas;
export const NoriCommandSchemas = {
	[NoriCommand.Init]: GlobalCliOptionsSchema,
	[NoriCommand.Generate]: GenerateOptionsSchema
} as const;
