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

  const courseCode = <string>courseCodeArg;
  const courseInfo: courseInfo | string = await getCourseInfo(courseCode);

  // If mistyped course code or course doesn't exist
  if (courseInfo === 'Oops, course does not exist!') {
    const errorDesc =
      'Either the course does not exist or you did not type the course code in the correct format';
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

  const embedDescription = `Course code: ${code} \n\n Course name: ${name} \n\n Course description: \n ${description} \n\n Like rate: ${liked}% \n\n Easy rate: ${easy}% \n\n Useful rate: ${useful}%`;

  const courseEmbed = new EmbedBuilder()
    .setColor('Green')
    .setTitle(`Information for ${code}`)
    .setDescription(embedDescription);

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
      description: 'The course code, all lowercase, no spaces. Examples: cs135, amath351',
      type: CodeyCommandOptionType.STRING,
      required: false,
    },
  ],
  subcommandDetails: {},
};
