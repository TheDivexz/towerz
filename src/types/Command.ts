import { CommandInteractionOptionResolver } from "discord.js";
import { PermissionResolvable } from "discord.js";
import { GuildMember } from "discord.js";
import { ChatInputApplicationCommandData } from "discord.js";
import { CommandInteraction } from "discord.js";
import { ExtendedClient } from "../structures/Client";


export interface ExtendedInteraction extends CommandInteraction {
    member: GuildMember;
}

interface RunOptions {
    client: ExtendedClient;
    interaction: ExtendedInteraction;
    args: CommandInteractionOptionResolver;
}

type RunFunction = (options: RunOptions) => any;

export type CommandType = {
    userPermissions?: PermissionResolvable[];
    run: RunFunction;
} & ChatInputApplicationCommandData;