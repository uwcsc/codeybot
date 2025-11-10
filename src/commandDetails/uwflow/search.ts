import { container } from '@sapphire/framework';
import {
  CodeyCommandDetails,
  CodeyCommandOptionType,
  SapphireMessageExecuteType,
  SapphireMessageResponse,
} from '../../codeyCommand';
import { searchResults, getSearchResults } from '../../components/uwflow';
import { EmbedBuilder } from 'discord.js';

const uwflowSearchExecuteCommand: SapphireMessageExecuteType = async (
  _client,
  _messageFromUser,
  args,
): Promise<SapphireMessageResponse> => {
  const courseArg = <string>args['course'];
  const min = <number>args['min'];
  const max = <number>args['max'];

  // Standardize the course initials (i.e. CS becomes cs for the GraphQL query)
  const course = courseArg.toLowerCase();

  const results: searchResults[] | number = await getSearchResults(course, min, max);

  // If mistyped course initials or course doesn't exist
  if (results === -1) {
    const errorDesc = 'UWFlow returned no data';
    const courseEmbed = new EmbedBuilder()
      .setColor('Red')
      .setTitle(`Information for query of ${course.toUpperCase()} courses in range ${min} - ${max}`)
      .setDescription(errorDesc);
    return { embeds: [courseEmbed] };
  }

  const resultArray = <searchResults[]>results;
  // If no courses fit the range
  if (resultArray.length < 1) {
    const desc = 'No courses suit the query';
    const embed = new EmbedBuilder()
      .setColor('Orange')
      .setTitle(`Information for query of ${course} courses in range ${min} - ${max}`)
      .setDescription(desc);
    return { embeds: [embed] };
  }

  const courseArray: string[] = [];
  for (const result of resultArray) {
    courseArray.push(result.code);
  }

  const desc = courseArray.join(', ');

  const resultEmbed = new EmbedBuilder()
    .setColor('Green')
    .setTitle(`Information for query of ${course} courses in range ${min} - ${max}`)
    .setDescription(desc);

  return { embeds: [resultEmbed] };
};

export const uwflowSearchCommandDetails: CodeyCommandDetails = {
  name: 'search',
  aliases: [],
  description: 'Search for courses in specified range',
  detailedDescription: `**Examples:**
\`${container.botPrefix}uwflow search CS 100 200\`
\`${container.botPrefix}uwflow search cs 100 200\``,

  isCommandResponseEphemeral: false,
  messageWhenExecutingCommand: 'Getting information from UWFlow:',
  executeCommand: uwflowSearchExecuteCommand,
  options: [
    {
      name: 'course',
      description: 'The initials of the course. Examples: CS, cs, MATH, math',
      type: CodeyCommandOptionType.STRING,
      required: true,
    },
    {
      name: 'min',
      description: 'The minimum code of the course',
      type: CodeyCommandOptionType.INTEGER,
      required: true,
    },
    {
      name: 'max',
      description: 'The maximum code of the course',
      type: CodeyCommandOptionType.INTEGER,
      required: true,
    },
  ],
  subcommandDetails: {},
};
