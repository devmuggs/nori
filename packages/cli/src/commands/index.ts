import { Command } from "../core/command-line-interface/cli-schema.js";
import type CommandLineInterface from "../core/command-line-interface/index.js";
import type NoriEnvironment from "../core/environment/environment-loader.js";
import { ConfigCommand } from "./config/index.js";
import { GenerateCommand } from "./generate/index.js";
import { HelpCommand } from "./help/index.js";
import InitCommand from "./init/index.js";

export * from "./help/index.js";

export type CommandContext = {
	environment: NoriEnvironment;
	cli: CommandLineInterface;
};

export type CommandHandler = (params: CommandContext) => Promise<void> | void;

export class ICommand {
	public execute(params: CommandContext): Promise<void> {
		throw new Error("Method not implemented.");
	}
}

const Commands: Record<Command, typeof ICommand> = {
	[Command.Help]: HelpCommand,
	[Command.Generate]: GenerateCommand,
	[Command.Init]: InitCommand,
	[Command.Config]: ConfigCommand,
	[Command.Base]: HelpCommand
};

export default Commands;
