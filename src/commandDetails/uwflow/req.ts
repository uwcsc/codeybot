import { container } from '@sapphire/framework';
import {
  CodeyCommandDetails,
  CodeyCommandOptionType,
  SapphireMessageExecuteType,
  SapphireMessageResponse,
} from '../../codeyCommand';
import { courseReqs, getCourseReqs } from '../../components/uwflow';
import { EmbedBuilder } from 'discord.js';

const uwflowReqExecuteCommand: SapphireMessageExecuteType = async (
  _client,
  _messageFromUser,
  args,
): Promise<SapphireMessageResponse> => {
  const courseCodeArg = <string>args['course_code'];

  // Standardize the course code (i.e. cs 135, CS135, CS 135 becomes cs135 for the GraphQL query)
  const courseCode = <string>courseCodeArg.split(' ').join('').toLowerCase();

  const result: courseReqs | number = await getCourseReqs(courseCode);

  // If mistyped course code or course doesn't exist
  if (result === -1) {
    const errorDesc = 'Oops, that course does not exist!';
    const courseEmbed = new EmbedBuilder()
      .setColor('Red')
      .setTitle(`Information for ${courseCode.toUpperCase()}`)
      .setDescription(errorDesc);
    return { embeds: [courseEmbed] };
  }

  const requisites = <courseReqs>result;

  const code = requisites.code.toUpperCase();
  const antireqs = requisites.antireqs;
  const prereqs = requisites.prereqs;
  const coreqs = requisites.coreqs;

  const courseEmbed = new EmbedBuilder()
    .setColor('Green')
    .setTitle(`Requisites for ${code}`)
    .addFields(
      { name: 'Course code', value: code, inline: false },
      { name: 'Antirequisites', value: antireqs, inline: false },
      { name: 'Prerequisites', value: prereqs, inline: false },
      { name: 'Corequisites', value: coreqs, inline: false },
    );

  return { embeds: [courseEmbed] };
};

export const uwflowReqCommandDetails: CodeyCommandDetails = {
  name: 'req',
  aliases: ['requisite'],
  description: 'Get course requisites',
  detailedDescription: `**Examples:**
\`${container.botPrefix}uwflow req cs135\`
\`${container.botPrefix}uwflow requisite cs246\``,

  isCommandResponseEphemeral: false,
  messageWhenExecutingCommand: 'Getting information from UWFlow:',
  executeCommand: uwflowReqExecuteCommand,
  options: [
    {
      name: 'course_code',
      description: 'The course code. Examples: cs135, cs 135, CS135, CS 135',
      type: CodeyCommandOptionType.STRING,
      required: true,
    },
  ],
  subcommandDetails: {},
};
