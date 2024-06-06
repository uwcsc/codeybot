import { container } from '@sapphire/framework';
import { CodeyCommandDetails, getUserFromMessage } from '../../codeyCommand';
import { EmbedBuilder } from 'discord.js';
import { PaginationBuilder } from '../../utils/pagination';
import { SapphireMessageExecuteType, SapphireMessageResponse } from '../../codeyCommand';
import { Colors } from 'discord.js';

const PaginationTestExecuteCommand: SapphireMessageExecuteType = async (
  _client,
  messageFromUser,
  _args,
): Promise<SapphireMessageResponse> => {
  const message = messageFromUser;
  const author = getUserFromMessage(message).id;

  const embedData: { title: string; description: string; color: number }[] = [
    {
      title: 'Page 1',
      description: 'Hey there! This is the content of Page 1 💙',
      color: 0xff0000,
    },
    {
      title: 'Page 2',
      description: 'Hey there! This is the content of Page 2 🎉',
      color: 0x00ff00,
    },
    {
      title: 'Page 3',
      description: 'Hey there! This is the content of Page 3 👽',
      color: 0x0000ff,
    },
    {
      title: 'Page 4',
      description: 'Hey there! This is the content of Page 4 🎃',
      color: 0xff00ff,
    },
    {
      title: 'Page 5',
      description: 'Hey there! This is the content of Page 5 🎄',
      color: 0xffff00,
    },
  ];

  const embeds: EmbedBuilder[] = embedData.map((data) =>
    new EmbedBuilder()
      .setColor(Colors.Blue)
      .setTitle(data.title)
      .setDescription(data.description)
      .setColor(data.color),
  );

  try {
    await PaginationBuilder(message, author, embeds, 10000);
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
