import { container } from '@sapphire/framework';
import { CodeyCommandDetails, getUserFromMessage } from '../../codeyCommand';
import { EmbedBuilder } from 'discord.js';
import { PaginationBuilder, PaginationBuilderFromText } from '../../utils/pagination';
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
    //await PaginationBuilder(message, author, embeds);

    // await PaginationBuilderFromText(
    //   message,
    //   author,
    //   `Lorem Ipsum is simply dummy text of the printing and typesetting industry. \ 
    //   Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make \ 
    //   a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, \ 
    //   remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions \ 
    //   of Lorem Ipsum. Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, \ 
    //   consectetur, from a \ 
    //   Lorem \ 
    //   Ipsum passage, and going through the cites of the word in classical literature, \ 
    //   discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and \ 
    //   1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes of Good and Evil) by Cicero, \ 
    //   written in 45 BC. This book is a treatise on the theory of ethics, \ 
    //   very popular \ 
    //   during the Renaissance. The first \ 
    //   line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line in section 1.10.32.`,
    // );

    // await PaginationBuilderFromText(message, author, "") // no content test case

    // too much content test case, spaces are necessary after slash!!
    await PaginationBuilderFromText(message, author, `Lorem Ipsum is simply dummy text of the printing and typesetting industry. \ 
      Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make \ 
      a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, \ 
      remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions \ 
      remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions \ 
      remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions \ 
      remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions \ 
      remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions \ 
      remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions \ 
      remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions \ 
      remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions \ 
      remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions \ 
      remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions \ 
      remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions \ 
      remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions \ 
      remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions \ 
      of Lorem Ipsum. Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, \ 
      consectetur, from a \ 
      Lorem \ 
      Ipsum passage, and going through the cites of the word in classical literature, \ 
      discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and \ 
      1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes of Good and Evil) by Cicero, \ 
      written in 45 BC. This book is a treatise on the theory of ethics, \ 
      very popular \ 
      during the Renaissance. The first \ 
      line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line in section 1.10.32.`);
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
