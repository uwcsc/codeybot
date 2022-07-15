import {
  ApplicationCommandRegistries,
  ChatInputCommand,
  Command as SapphireCommand,
  container,
  Args,
  ArgType,
  RegisterBehavior,
  SapphireClient
} from '@sapphire/framework';
import { Message, MessageEmbed, MessagePayload, TextChannel, WebhookEditMessageOptions } from 'discord.js';
import { APIMessage } from 'discord-api-types/v9';
import { isMessageInstance } from '@sapphire/discord.js-utilities';
import {
  SlashCommandBuilder,
  SlashCommandStringOption,
  SlashCommandIntegerOption,
  SlashCommandBooleanOption,
  SlashCommandUserOption,
  SlashCommandChannelOption,
  SlashCommandRoleOption,
  SlashCommandMentionableOption,
  SlashCommandNumberOption,
  SlashCommandAttachmentOption
} from '@discordjs/builders';

export type SapphireMessageRequest = APIMessage | Message<boolean>;
export type SapphireMessageResponse = string | MessagePayload | WebhookEditMessageOptions | MessageEmbed;

export type SapphireMessageExecuteType = (
  client: SapphireClient<boolean>,
  // Message is for normal commands, ChatInputInteraction is for slash commands
  messageFromUser: Message | SapphireCommand.ChatInputInteraction,
  initialMessageFromBot?: SapphireMessageRequest,
  // Command arguments
  args?: CodeyCommandArguments
) => Promise<SapphireMessageResponse>;

// Type of response the Codey command will send
export enum CodeyCommandResponseType {
  STRING,
  EMBED
}

// Command options
/** The type of the codey command option */
export enum CodeyCommandOptionType {
  STRING = 'string',
  INTEGER = 'integer',
  BOOLEAN = 'boolean',
  USER = 'user',
  CHANNEL = 'channel',
  ROLE = 'role',
  MENTIONABLE = 'mentionable',
  NUMBER = 'number',
  ATTACHMENT = 'attachment'
}

/** We use this for convenience to put all the different types of SlashCommandOptions into one */
type SlashCommandOption =
  | SlashCommandStringOption
  | SlashCommandIntegerOption
  | SlashCommandBooleanOption
  | SlashCommandUserOption
  | SlashCommandChannelOption
  | SlashCommandRoleOption
  | SlashCommandMentionableOption
  | SlashCommandNumberOption
  | SlashCommandAttachmentOption;

/** The codey command option */
export interface CodeyCommandOption {
  /** The name of the option */
  name: string;
  /** The description of the option */
  description: string;
  /** The type of the option */
  type: CodeyCommandOptionType;
  /** Whether the option is required */
  required: boolean;
}

/** Sets the command option in the slash command builder */
const setCommandOption = (builder: SlashCommandBuilder, option: CodeyCommandOption): SlashCommandBuilder => {
  let commandOption: SlashCommandOption;
  switch (option.type) {
    case CodeyCommandOptionType.STRING:
      commandOption = new SlashCommandStringOption();
      commandOption.setName(option.name);
      commandOption.setDescription(option.description);
      commandOption.setRequired(option.required);
      return <SlashCommandBuilder>builder.addStringOption(commandOption);
    case CodeyCommandOptionType.INTEGER:
      commandOption = new SlashCommandIntegerOption();
      commandOption.setName(option.name);
      commandOption.setDescription(option.description);
      commandOption.setRequired(option.required);
      return <SlashCommandBuilder>builder.addIntegerOption(commandOption);
    case CodeyCommandOptionType.BOOLEAN:
      commandOption = new SlashCommandBooleanOption();
      commandOption.setName(option.name);
      commandOption.setDescription(option.description);
      commandOption.setRequired(option.required);
      return <SlashCommandBuilder>builder.addBooleanOption(commandOption);
    case CodeyCommandOptionType.USER:
      commandOption = new SlashCommandUserOption();
      commandOption.setName(option.name);
      commandOption.setDescription(option.description);
      commandOption.setRequired(option.required);
      return <SlashCommandBuilder>builder.addUserOption(commandOption);
    case CodeyCommandOptionType.CHANNEL:
      commandOption = new SlashCommandChannelOption();
      commandOption.setName(option.name);
      commandOption.setDescription(option.description);
      commandOption.setRequired(option.required);
      return <SlashCommandBuilder>builder.addChannelOption(commandOption);
    case CodeyCommandOptionType.ROLE:
      commandOption = new SlashCommandRoleOption();
      commandOption.setName(option.name);
      commandOption.setDescription(option.description);
      commandOption.setRequired(option.required);
      return <SlashCommandBuilder>builder.addRoleOption(commandOption);
    case CodeyCommandOptionType.MENTIONABLE:
      commandOption = new SlashCommandMentionableOption();
      commandOption.setName(option.name);
      commandOption.setDescription(option.description);
      commandOption.setRequired(option.required);
      return <SlashCommandBuilder>builder.addMentionableOption(commandOption);
    case CodeyCommandOptionType.NUMBER:
      commandOption = new SlashCommandNumberOption();
      commandOption.setName(option.name);
      commandOption.setDescription(option.description);
      commandOption.setRequired(option.required);
      return <SlashCommandBuilder>builder.addNumberOption(commandOption);
    case CodeyCommandOptionType.ATTACHMENT:
      commandOption = new SlashCommandAttachmentOption();
      commandOption.setName(option.name);
      commandOption.setDescription(option.description);
      commandOption.setRequired(option.required);
      return <SlashCommandBuilder>builder.addAttachmentOption(commandOption);
    default:
      throw new Error(`Unknown option type.`);
  }
};

/** The possible types of the value of a command option */
export type CodeyCommandArgumentValueType = string | number | boolean | undefined;
/** A standardized dictionary that stores the arguments of the command */
export type CodeyCommandArguments = { [key: string]: CodeyCommandArgumentValueType };

/** Details for the codey command (or subcommand) */
export class CodeyCommandDetails {
  /** The name of the command */
  name!: string;
  /** The aliases of the command (for regular commands) */
  aliases: string[] = [];
  /** A short description of the command (shown in the slash command menu) */
  description: string = `Codey command for ${this.name}`;
  /** A longer description of the command (shown in the help menu for the command) */
  detailedDescription: string = this.description;

  /** The message to display when the command is executing (for slash commands) */
  messageWhenExecutingCommand!: string;
  /** The function to be called to execute the command */
  executeCommand!: SapphireMessageExecuteType;
  /** The message to display if the command fails */
  messageIfFailure: string = 'Codey backend error - contact a mod for assistance';
  /** A flag to indicate if the command response is ephemeral (ie visible to others) */
  isCommandResponseEphemeral: boolean = true;
  /** Type of response the Codey command sends */
  codeyCommandResponseType: CodeyCommandResponseType = CodeyCommandResponseType.STRING;

  /** Options for the Codey command */
  options: CodeyCommandOption[] = [];
  /** Subcommands under the CodeyCommand */
  subcommandDetails: { [name: string]: CodeyCommandDetails } = {};
}

/** The codey command class */
export class CodeyCommand extends SapphireCommand {
  /** The details of the command */
  details!: CodeyCommandDetails;

  // Get slash command builder
  public configureSlashCommandBuilder(builder: SlashCommandBuilder): SlashCommandBuilder {
    builder.setName(this.details.name);
    builder.setDescription(this.details.description);
    for (const commandOption of this.details.options) {
      setCommandOption(builder, commandOption);
    }
    return builder;
  }

  // Register application commands
  public override registerApplicationCommands(registry: ChatInputCommand.Registry): void {
    // This ensures any new changes are made to the slash commands are made
    ApplicationCommandRegistries.setDefaultBehaviorWhenNotIdentical(RegisterBehavior.Overwrite);
    // We need to do this because TS is weird
    registry.registerChatInputCommand((builder) =>
      this.configureSlashCommandBuilder(<SlashCommandBuilder>(<unknown>builder))
    );
  }

  // Regular command
  public async messageRun(message: Message, commandArgs: Args): Promise<Message<boolean>> {
    const { client } = container;
    const initialMessageFromBot: SapphireMessageRequest = await message.channel.send({
      content: this.details.messageWhenExecutingCommand
    });

    // Get command arguments
    const args: CodeyCommandArguments = {};
    for (const commandOption of this.details.options!) {
      args[commandOption.name] = <CodeyCommandArgumentValueType>(
        await commandArgs.pick(<keyof ArgType>commandOption.type)
      );
    }

    try {
      const successResponse = await this.details.executeCommand(client, message, initialMessageFromBot, args);
      switch (this.details.codeyCommandResponseType) {
        case CodeyCommandResponseType.EMBED:
          return await message.channel.send({ embeds: [<MessageEmbed>successResponse] });
        case CodeyCommandResponseType.STRING:
          return await message.channel.send(<string>successResponse);
      }
    } catch (e) {
      console.log(e);
      return await message.channel.send(this.details.messageIfFailure);
    }
  }

  // Slash command
  public async chatInputRun(interaction: SapphireCommand.ChatInputInteraction): Promise<APIMessage | Message<boolean>> {
    const { client } = container;
    const initialMessageFromBot: SapphireMessageRequest = await interaction.reply({
      content: this.details.messageWhenExecutingCommand,
      ephemeral: this.details.isCommandResponseEphemeral, // whether user sees message or not
      fetchReply: true
    });

    // Get command arguments
    const args: CodeyCommandArguments = Object.assign(
      {},
      ...this.details.options
        .map((commandOption) => commandOption.name)
        .map((commandOptionName) => ({ [commandOptionName]: interaction.options.get(commandOptionName)?.value }))
    );

    if (isMessageInstance(initialMessageFromBot)) {
      try {
        const successResponse = await this.details.executeCommand(client, interaction, initialMessageFromBot, args);
        switch (this.details.codeyCommandResponseType) {
          case CodeyCommandResponseType.EMBED:
            const currentChannel = (await client.channels.fetch(interaction.channelId)) as TextChannel;
            return currentChannel.send({ embeds: [<MessageEmbed>successResponse] });
          case CodeyCommandResponseType.STRING:
            return interaction.editReply(<string>successResponse);
        }
      } catch (e) {
        console.log(e);
        return interaction.editReply(this.details.messageIfFailure);
      }
    }
    return interaction.editReply(this.details.messageIfFailure);
  }
}
