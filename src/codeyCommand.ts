import { Command as SapphireCommand, container, SapphireClient } from '@sapphire/framework';
import { Message, MessagePayload, WebhookEditMessageOptions } from 'discord.js';
import { APIMessage } from 'discord-api-types/v9';
import { isMessageInstance } from '@sapphire/discord.js-utilities';

export type SapphireMessageRequest = APIMessage | Message<boolean>;
export type SapphireMessageResponse = string | MessagePayload | WebhookEditMessageOptions;

export type SapphireMessageExecuteType = (
  client: SapphireClient<boolean>,
  messageFromUser: Message | SapphireCommand.ChatInputInteraction,
  initialMessageFromBot: SapphireMessageRequest
) => SapphireMessageResponse;

export type CodeyCommandOptions = {
  name: string;
  aliases: string[];
  description: string;
  detailedDescription: string;
};

export class CodeyCommand extends SapphireCommand {
  messageWhenExecutingCommand!: string;
  executeCommand!: SapphireMessageExecuteType;
  messageIfFailure!: SapphireMessageResponse;

  commandOptions!: CodeyCommandOptions;

  // Regular command
  public async messageRun(message: Message): Promise<Message<boolean>> {
    const { client } = container;
    const initialMessageFromBot: SapphireMessageRequest = await message.channel.send(this.messageWhenExecutingCommand);
    try {
      const successResponse = this.executeCommand(client, message, initialMessageFromBot);
      return initialMessageFromBot.edit(successResponse);
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
      ephemeral: true, // whether user sees message or not
      fetchReply: true
    });
    if (isMessageInstance(initialMessageFromBot)) {
      try {
        const successResponse = this.executeCommand(client, interaction, initialMessageFromBot);
        return interaction.editReply(successResponse);
      } catch (e) {
        console.log(e);
        return interaction.editReply(this.messageIfFailure);
      }
    }
    return interaction.editReply(this.messageIfFailure);
  }
}
