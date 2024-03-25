import { container } from '@sapphire/framework';
import {
  CodeyCommandDetails,
  CodeyCommandOptionType,
  SapphireMessageExecuteType,
  SapphireMessageResponse,
} from '../../codeyCommand';
import { courseInfo, getCourseInfo } from '../../components/uwflow';
import { EmbedBuilder } from 'discord.js';

const uwflowInfoExecuteCommand: SapphireMessageExecuteType = async (
  _client,
  _messageFromUser,
  args,
): Promise<SapphireMessageResponse> => {
  const courseCodeArg = <string | undefined>args['course_code'];

  // If no argument is passed, return default information
  if (courseCodeArg === undefined) {
    const defaultEmbed = new EmbedBuilder()
      .setColor('Blue')
      .setTitle('General Information')
      .setDescription('UWFlow is a website where students can view course reviews and ratings.');
    return { embeds: [defaultEmbed] };
  }

  // Standardize the course code (i.e. cs 135, CS135, CS 135 becomes cs135 for the GraphQL query)
  const courseCode = <string>courseCodeArg.split(' ').join('').toLowerCase();

  const courseInfo: courseInfo | string = await getCourseInfo(courseCode);

  // If mistyped course code or course doesn't exist
  if (courseInfo === 'Oops, course does not exist!') {
    const errorDesc = 'Oops, that course does not exist!';
    const courseEmbed = new EmbedBuilder()
      .setColor('Red')
      .setTitle(`Information for ${courseCode.toUpperCase()}`)
      .setDescription(errorDesc);
    return { embeds: [courseEmbed] };
  }

  const actualCourseInfo = <courseInfo>courseInfo;

  const code = actualCourseInfo.code.toUpperCase();
  const name = actualCourseInfo.name;
  const description = actualCourseInfo.description;
  const liked = (actualCourseInfo.liked * 100).toFixed(2);
  const easy = (actualCourseInfo.easy * 100).toFixed(2);
  const useful = (actualCourseInfo.useful * 100).toFixed(2);

  const courseEmbed = new EmbedBuilder()
    .setColor('Green')
    .setTitle(`Information for ${code}`)
    .addFields(
      { name: 'Course code', value: code, inline: false },
      { name: 'Course name', value: name, inline: false },
      { name: 'Course description', value: description, inline: false },
      { name: 'Like ratings', value: `${liked}%`, inline: true },
      { name: 'Easy ratings', value: `${easy}%`, inline: true },
      { name: 'Useful ratings', value: `${useful}%`, inline: true },
    );

  return { embeds: [courseEmbed] };
};

export const uwflowInfoCommandDetails: CodeyCommandDetails = {
  name: 'info',
  aliases: ['information', 'i'],
  description: 'Get info about courses using UWFlow.',
  detailedDescription: `**Examples:**
\`${container.botPrefix}uwflow info cs135\`
\`${container.botPrefix}uwflow information cs246\`
\`${container.botPrefix}uwflow i cs240\``,

  isCommandResponseEphemeral: false,
  messageWhenExecutingCommand: 'Getting information about UWFlow:',
  executeCommand: uwflowInfoExecuteCommand,
  options: [
    {
      name: 'course_code',
      description: 'The course code. Examples: cs135, cs 135, CS135, CS 135',
      type: CodeyCommandOptionType.STRING,
      required: false,
    },
  ],
  subcommandDetails: {},
};
