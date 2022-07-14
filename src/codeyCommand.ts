import { ApplicationCommandRegistries, ChatInputCommand, Command as SapphireCommand, container, Args, ArgType, RegisterBehavior, SapphireClient } from '@sapphire/framework';
import { Message, MessageEmbed, MessagePayload, TextChannel, WebhookEditMessageOptions } from 'discord.js';
import { APIMessage } from 'discord-api-types/v9';
import { isMessageInstance } from '@sapphire/discord.js-utilities';
import { SlashCommandBuilder, SlashCommandStringOption, SlashCommandIntegerOption, SlashCommandBooleanOption,
  SlashCommandUserOption, SlashCommandChannelOption, SlashCommandRoleOption,
  SlashCommandMentionableOption, SlashCommandNumberOption, SlashCommandAttachmentOption} from '@discordjs/builders';

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

type SlashCommandOption = SlashCommandStringOption | SlashCommandIntegerOption | SlashCommandBooleanOption
| SlashCommandUserOption | SlashCommandChannelOption | SlashCommandRoleOption
| SlashCommandMentionableOption | SlashCommandNumberOption | SlashCommandAttachmentOption;

export interface CodeyCommandOption {
  name: string;
  description: string;
  type: CodeyCommandOptionType;
  required: boolean;
}

const setCommandOption = (builder: SlashCommandBuilder, option: CodeyCommandOption): SlashCommandBuilder => {
  // TODO: implement other command option types
  let commandOption;
  switch (option.type) {
    case CodeyCommandOptionType.STRING:
      commandOption = new SlashCommandStringOption();
      commandOption.setName(option.name);
      commandOption.setDescription(option.description);
      commandOption.setRequired(option.required);
      return <SlashCommandBuilder> builder.addStringOption(commandOption);
    case CodeyCommandOptionType.INTEGER:
      commandOption = new SlashCommandIntegerOption();
      commandOption.setName(option.name);
      commandOption.setDescription(option.description);
      commandOption.setRequired(option.required);
      return <SlashCommandBuilder> builder.addIntegerOption(commandOption);
    default:
      throw new Error(`Unknown option type.`)
  }
}

export type CodeyCommandArgumentValueType = string | number | boolean | undefined;
export type CodeyCommandArguments = {[key: string]: CodeyCommandArgumentValueType};

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
  public getSlashCommandBuilder(): SlashCommandBuilder {
    const builder = new SlashCommandBuilder();
    builder.setName(this.name);
    builder.setDescription(this.description);
    for (let commandOption of this.commandOptions) {
      setCommandOption(builder, commandOption);
    }
    return builder;
  }

  // Register application commands
  public override registerApplicationCommands(registry: ChatInputCommand.Registry): void {
    // This ensures any new changes are made to the slash commands are made
    ApplicationCommandRegistries.setDefaultBehaviorWhenNotIdentical(RegisterBehavior.Overwrite);
    registry.registerChatInputCommand(this.getSlashCommandBuilder());
  }

  // Regular command
  // TODO: implement options for regular commands
  public async messageRun(message: Message, commandArgs: Args): Promise<Message<boolean>> {
    const { client } = container;
    const initialMessageFromBot: SapphireMessageRequest = await message.channel.send({
      content: this.messageWhenExecutingCommand
    });

    // Get command arguments
    const args: CodeyCommandArguments = {};
    for (let commandOption of this.commandOptions) {
      args[commandOption.name] = <CodeyCommandArgumentValueType> await commandArgs.pick(<keyof ArgType> commandOption.type);
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
    const args: CodeyCommandArguments = Object.assign({},
      ...this.commandOptions
      .map(commandOption => commandOption.name)
      .map(commandOptionName => ({[commandOptionName]: interaction.options.get(commandOptionName)?.value})));

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
