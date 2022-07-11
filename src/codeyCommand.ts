import { ChatInputCommand, Command as SapphireCommand, container, SapphireClient } from '@sapphire/framework';
import { Message, MessageEmbed, MessagePayload, TextChannel, WebhookEditMessageOptions } from 'discord.js';
import { APIMessage } from 'discord-api-types/v9';
import { isMessageInstance } from '@sapphire/discord.js-utilities';

export type SapphireMessageRequest = APIMessage | Message<boolean>;
export type SapphireMessageResponse = string | MessagePayload | WebhookEditMessageOptions | MessageEmbed;

export type SapphireMessageExecuteType = (
  client: SapphireClient<boolean>,
  // Message is for normal commands, ChatInputInteraction is for slash commands
  messageFromUser: Message | SapphireCommand.ChatInputInteraction,
  initialMessageFromBot: SapphireMessageRequest
) => SapphireMessageResponse;

// Can modify this as needed
export type CodeyCommandOptions = {
  name: string;
  aliases: string[];
  description: string;
  detailedDescription: string;
};

// Type of response the Codey command will send
export enum CodeyCommandResponseType {
  STRING,
  EMBED
}

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

  commandOptions!: CodeyCommandOptions;

  // Register application commands
  public override registerApplicationCommands(registry: ChatInputCommand.Registry): void {
    registry.registerChatInputCommand((builder) => builder.setName(this.name).setDescription(this.description));
  }

  // Regular command
  public async messageRun(message: Message): Promise<Message<boolean>> {
    const { client } = container;
    const initialMessageFromBot: SapphireMessageRequest = await message.channel.send(this.messageWhenExecutingCommand);
    try {
      const successResponse = this.executeCommand(client, message, initialMessageFromBot);
      switch (this.codeyCommandResponseType) {
        case CodeyCommandResponseType.EMBED:
          return initialMessageFromBot.edit({ embeds: [<MessageEmbed>successResponse] });
        case CodeyCommandResponseType.STRING:
          return initialMessageFromBot.edit(<string>successResponse);
      }
    } catch (e) {
      console.log(e);
      return initialMessageFromBot.edit(this.messageIfFailure);
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
    if (isMessageInstance(initialMessageFromBot)) {
      try {
        const successResponse = this.executeCommand(client, interaction, initialMessageFromBot);
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
