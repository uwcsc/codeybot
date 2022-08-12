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
import { Message, MessagePayload, TextChannel, User, WebhookEditMessageOptions } from 'discord.js';
import { APIMessage } from 'discord-api-types/v9';
import { isMessageInstance } from '@sapphire/discord.js-utilities';
import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
  SlashCommandSubcommandsOnlyBuilder
} from '@discordjs/builders';

export type SapphireMessageRequest = APIMessage | Message<boolean>;
export type SapphireMessageResponse = string | MessagePayload | WebhookEditMessageOptions;

export type SapphireMessageExecuteType = (
  client: SapphireClient<boolean>,
  // Message is for normal commands, ChatInputInteraction is for slash commands
  messageFromUser: Message | SapphireCommand.ChatInputInteraction,
  // Command arguments
  args: CodeyCommandArguments,
  initialMessageFromBot?: SapphireMessageRequest
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
const setCommandOption = (
  builder: SlashCommandBuilder | SlashCommandSubcommandBuilder,
  option: CodeyCommandOption
): SlashCommandBuilder | SlashCommandSubcommandBuilder => {
  switch (option.type) {
    case CodeyCommandOptionType.STRING:
      return <SlashCommandBuilder>(
        builder.addStringOption((commandOption) =>
          commandOption.setName(option.name).setDescription(option.description).setRequired(option.required)
        )
      );
    case CodeyCommandOptionType.INTEGER:
      return <SlashCommandBuilder>(
        builder.addIntegerOption((commandOption) =>
          commandOption.setName(option.name).setDescription(option.description).setRequired(option.required)
        )
      );
    case CodeyCommandOptionType.BOOLEAN:
      return <SlashCommandBuilder>(
        builder.addBooleanOption((commandOption) =>
          commandOption.setName(option.name).setDescription(option.description).setRequired(option.required)
        )
      );
    case CodeyCommandOptionType.USER:
      return <SlashCommandBuilder>(
        builder.addUserOption((commandOption) =>
          commandOption.setName(option.name).setDescription(option.description).setRequired(option.required)
        )
      );
    case CodeyCommandOptionType.CHANNEL:
      return <SlashCommandBuilder>(
        builder.addChannelOption((commandOption) =>
          commandOption.setName(option.name).setDescription(option.description).setRequired(option.required)
        )
      );
    case CodeyCommandOptionType.ROLE:
      return <SlashCommandBuilder>(
        builder.addRoleOption((commandOption) =>
          commandOption.setName(option.name).setDescription(option.description).setRequired(option.required)
        )
      );
    case CodeyCommandOptionType.MENTIONABLE:
      return <SlashCommandBuilder>(
        builder.addMentionableOption((commandOption) =>
          commandOption.setName(option.name).setDescription(option.description).setRequired(option.required)
        )
      );
    case CodeyCommandOptionType.NUMBER:
      return <SlashCommandBuilder>(
        builder.addNumberOption((commandOption) =>
          commandOption.setName(option.name).setDescription(option.description).setRequired(option.required)
        )
      );
    case CodeyCommandOptionType.ATTACHMENT:
      return <SlashCommandBuilder>(
        builder.addAttachmentOption((commandOption) =>
          commandOption.setName(option.name).setDescription(option.description).setRequired(option.required)
        )
      );
    default:
      throw new Error(`Unknown option type.`);
  }
};

/** The possible types of the value of a command option */
export type CodeyCommandArgumentValueType = string | number | boolean | User | undefined;
/** A standardized dictionary that stores the arguments of the command */
export type CodeyCommandArguments = { [key: string]: CodeyCommandArgumentValueType };

/** Details for the codey command (or subcommand) */
export class CodeyCommandDetails {
  /** The name of the command */
  name!: string;
  /** The aliases of the command (for regular commands) */
  aliases: string[] = [];
  /** A short description of the command (shown in the slash command menu) */
  description = `Codey command for ${this.name}`;
  /** A longer description of the command (shown in the help menu for the command) */
  detailedDescription: string = this.description;

  // The following can all technically be nullable, because the actual command might not be used
  // Rather, the command might just be a "folder" for subcommands.
  /** The message to display when the command is executing (for slash commands) */
  messageWhenExecutingCommand?: string;
  /** The function to be called to execute the command */
  executeCommand?: SapphireMessageExecuteType;
  /** The message to display if the command fails */
  messageIfFailure?: string;
  /** A flag to indicate if the command response is ephemeral (ie visible to others) */
  isCommandResponseEphemeral? = true;
  /** Type of response the Codey command sends */
  codeyCommandResponseType?: CodeyCommandResponseType = CodeyCommandResponseType.STRING;

  /** Options for the Codey command */
  options: CodeyCommandOption[] = [];
  /** Subcommands under the CodeyCommand */
  subcommandDetails: { [name: string]: CodeyCommandDetails } = {};
  /** The default subcommand to execute if no subcommand is specified */
  defaultSubcommandDetails?: CodeyCommandDetails;
}

/** Sets the command subcommand in the slash command builder */
const setCommandSubcommand = (
  builder: SlashCommandBuilder,
  subcommandDetails: CodeyCommandDetails
): SlashCommandSubcommandsOnlyBuilder => {
  return builder.addSubcommand((subcommandBuilder) => {
    subcommandBuilder.setName(subcommandDetails.name);
    subcommandBuilder.setDescription(subcommandDetails.description);
    for (const commandOption of subcommandDetails.options) {
      setCommandOption(subcommandBuilder, commandOption);
    }
    return subcommandBuilder;
  });
};

/** Helper method to get user id from message */
export const getUserIdFromMessage = (message: Message | SapphireCommand.ChatInputInteraction): string => {
  if (message instanceof Message) {
    return message.author.id;
  } else {
    return message.user.id;
  }
};

const defaultBackendErrorMessage = 'Codey backend error - contact a mod for assistance';

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
    for (const subcommandName in this.details.subcommandDetails) {
      setCommandSubcommand(builder, this.details.subcommandDetails[subcommandName]);
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
  public async messageRun(message: Message, commandArgs: Args): Promise<Message<boolean> | undefined> {
    const { client } = container;

    const subcommandName = message.content.split(' ')[1];
    /** The command details object to use */
    let commandDetails = this.details.subcommandDetails[subcommandName];
    if (!commandDetails) {
      // Check whether the subcommand is an alias of another command
      for (const subcommandDetail of Object.values(this.details.subcommandDetails)) {
        if (subcommandDetail.aliases.includes(subcommandName)) {
          commandDetails = subcommandDetail;
          break;
        }
      }
      // If the subcommand is not an alias of another subcommand, use the default
      if (!commandDetails) {
        // If subcommands exist, use the default subcommand
        if (Object.keys(this.details.subcommandDetails).length !== 0) {
          commandDetails = this.details.defaultSubcommandDetails!;
        }
        // Otherwise, use the original command
        else {
          commandDetails = this.details;
        }
      }
    }

    // Move the "argument picker" by one parameter if subcommand name is defined
    if (subcommandName) {
      await commandArgs.pick('string');
    }
    const args: CodeyCommandArguments = {};
    for (const commandOption of commandDetails.options!) {
      try {
        args[commandOption.name] = <CodeyCommandArgumentValueType>(
          await commandArgs.pick(<keyof ArgType>commandOption.type)
        );
      } catch (e) {}
    }

    try {
      const successResponse = await commandDetails.executeCommand!(client, message, args);
      if (!successResponse) return;
      return await message.reply(successResponse);
    } catch (e) {
      console.log(e);
      return await message.reply(commandDetails.messageIfFailure ?? defaultBackendErrorMessage);
    }
  }

  // Slash command
  public async chatInputRun(
    interaction: SapphireCommand.ChatInputInteraction
  ): Promise<APIMessage | Message<boolean> | undefined> {
    const { client } = container;

    // Get subcommand name
    let subcommandName = '';
    try {
      subcommandName = interaction.options.getSubcommand();
    } catch (e) {}
    /** The command details object to use */
    const commandDetails = this.details.subcommandDetails[subcommandName] ?? this.details;

    const initialMessageFromBot: SapphireMessageRequest = await interaction.reply({
      content: commandDetails.messageWhenExecutingCommand,
      ephemeral: commandDetails.isCommandResponseEphemeral, // whether user sees message or not
      fetchReply: true
    });
    // Get command arguments
    const args: CodeyCommandArguments = Object.assign(
      {},
      ...commandDetails.options
        .map((commandOption) => commandOption.name)
        .map((commandOptionName) => {
          const commandInteractionOption = interaction.options.get(commandOptionName);
          let result: CodeyCommandArgumentValueType;
          if (commandInteractionOption) {
            const type = commandInteractionOption.type;
            switch (type) {
              case 'USER':
                return {
                  [commandOptionName]: commandInteractionOption.user
                };
              default:
                return {
                  [commandOptionName]: commandInteractionOption.value
                };
            }
          }

          return {
            [commandOptionName]: result
          };
        })
    );

    try {
      if (isMessageInstance(initialMessageFromBot)) {
        const successResponse = await commandDetails.executeCommand!(client, interaction, args, initialMessageFromBot);
        switch (commandDetails.codeyCommandResponseType) {
          case CodeyCommandResponseType.STRING:
            return interaction.editReply(<string>successResponse);
          default:
            const currentChannel = (await client.channels.fetch(interaction.channelId)) as TextChannel;
            return currentChannel.send(successResponse);
        }
      }
    } catch (e) {
      console.log(e);
      return await interaction.editReply(commandDetails.messageIfFailure ?? defaultBackendErrorMessage);
    }
  }
}
