import { container, SapphireClient } from '@sapphire/framework';
import { CodeyCommandDetails, getUserFromMessage } from '../../codeyCommand';
import { EmbedBuilder, ButtonInteraction, ComponentType } from 'discord.js';
import { PaginationBuilder } from '../../utils/pagination';
import { Command as SapphireCommand } from '@sapphire/framework';
import { SapphireMessageExecuteType, SapphireMessageResponse } from '../../codeyCommand';  
import {
    Colors,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    Message
  } from 'discord.js';
const PaginationTestExecuteCommand: SapphireMessageExecuteType = async (
    _client,
    messageFromUser,
    _args,
  ): Promise<SapphireMessageResponse> => {
    const message = messageFromUser;
    const author = getUserFromMessage(message).id;
    
    const embedData = [
      { title: 'Page 1', description: 'Content of Page 1 💙', color: 0xFF0000 },
      { title: 'Page 2', description: 'Content of Page 2 🎉', color: 0x00FF00 },
      { title: 'Page 3', description: 'Content of Page 3 👽', color: 0x0000FF }
    ];

    const embeds = embedData.map(data =>
      new EmbedBuilder()
        .setColor(Colors.Blue)
        .setTitle(data.title)
        .setDescription(data.description)
        .setColor(data.color)
    );
    const msg = await message.reply({
        embeds: [embeds[0]],
        fetchReply: true
      });  
    
    const reactFilter = (reaction: ButtonInteraction) => {
        return reaction.user.id === author;
    };

    try {
      await PaginationBuilder(msg, reactFilter, embeds);
    } catch (error) {
      await message.reply('Error or timeout occurred during navigation.');
    }
};

export const paginationTestCommandDetails: CodeyCommandDetails = {
  name: 'pg',
  aliases: ['pagination', 'paginationtest', 'pgtest'],
  description: 'Test the pagination feature.',
  detailedDescription: `**Examples:**
  \`${container.botPrefix}pg\`
  \`${container.botPrefix}pagination\`
  \`${container.botPrefix}pagination\`
  \`${container.botPrefix}pgtest\``,

  isCommandResponseEphemeral: false,
  messageWhenExecutingCommand: 'Testing pagination...',
  executeCommand: PaginationTestExecuteCommand,
  messageIfFailure: 'Could not test pagination.',
  options: [],
  subcommandDetails: {},
};
