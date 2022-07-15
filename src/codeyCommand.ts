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

export class CodeyCommand extends SapphireCommand {
  // The message to display whilst the command is executing
  messageWhenExecutingCommand!: string;
  // The function to be called when the command is executing
  executeCommand!: SapphireMessageExecuteType;
  // The message to display if the command fails
  messageIfFailure = 'Codey backend error - contact a mod for assistance';

  isCommandResponseEphemeral = true;
  // Type of response Codey command sends
  codeyCommandResponseType: CodeyCommandResponseType = CodeyCommandResponseType.STRING;

  // Command options
  commandOptions: CodeyCommandOption[] = [];

  // Get slash command builder
  public configureSlashCommandBuilder(builder: SlashCommandBuilder): SlashCommandBuilder {
    builder.setName(this.name);
    builder.setDescription(this.description);
    for (const commandOption of this.commandOptions) {
      setCommandOption(builder, commandOption);
    }
    return builder;
  }

  // Register application commands
  public override registerApplicationCommands(registry: ChatInputCommand.Registry): void {
    // This ensures any new changes are made to the slash commands are made
    ApplicationCommandRegistries.setDefaultBehaviorWhenNotIdentical(RegisterBehavior.Overwrite);
    // We need to do this because TS is weird
    registry.registerChatInputCommand(builder => this.configureSlashCommandBuilder(<SlashCommandBuilder> <unknown> builder));
  }

  // Regular command
  public async messageRun(message: Message, commandArgs: Args): Promise<Message<boolean>> {
    const { client } = container;
    const initialMessageFromBot: SapphireMessageRequest = await message.channel.send({
      content: this.messageWhenExecutingCommand
    });

    // Get command arguments
    const args: CodeyCommandArguments = {};
    for (const commandOption of this.commandOptions) {
      args[commandOption.name] = <CodeyCommandArgumentValueType>(
        await commandArgs.pick(<keyof ArgType>commandOption.type)
      );
    }

    try {
      const successResponse = await this.executeCommand(client, message, initialMessageFromBot, args);
      switch (this.codeyCommandResponseType) {
        case CodeyCommandResponseType.EMBED:
          return await message.channel.send({ embeds: [<MessageEmbed>successResponse] });
        case CodeyCommandResponseType.STRING:
          return await message.channel.send(<string>successResponse);
      }
    } catch (e) {
      console.log(e);
      return await message.channel.send(this.messageIfFailure);
    }
  }

  // Slash command
  public async chatInputRun(interaction: SapphireCommand.ChatInputInteraction): Promise<APIMessage | Message<boolean>> {
    const { client } = container;
    const initialMessageFromBot: SapphireMessageRequest = await interaction.reply({
      content: this.messageWhenExecutingCommand,
      ephemeral: this.isCommandResponseEphemeral, // whether user sees message or not
      fetchReply: true
    });

    // Get command arguments
    const args: CodeyCommandArguments = Object.assign(
      {},
      ...this.commandOptions
        .map((commandOption) => commandOption.name)
        .map((commandOptionName) => ({ [commandOptionName]: interaction.options.get(commandOptionName)?.value }))
    );

    if (isMessageInstance(initialMessageFromBot)) {
      try {
        const successResponse = await this.executeCommand(client, interaction, initialMessageFromBot, args);
        switch (this.codeyCommandResponseType) {
          case CodeyCommandResponseType.EMBED:
            const currentChannel = (await client.channels.fetch(interaction.channelId)) as TextChannel;
            return currentChannel.send({ embeds: [<MessageEmbed>successResponse] });
          case CodeyCommandResponseType.STRING:
            return interaction.editReply(<string>successResponse);
        }
      } catch (e) {
        console.log(e);
        return interaction.editReply(this.messageIfFailure);
      }
    }
    return interaction.editReply(this.messageIfFailure);
  }
}
