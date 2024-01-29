import { container } from '@sapphire/framework';
import { EmbedBuilder } from 'discord.js';
import _ from 'lodash';
import {
  availableDomains,
  getAvailableDomainsString,
  getInterviewerDomainsString,
  getInterviewers,
  Interviewer,
} from '../../components/interviewer';
import { DEFAULT_EMBED_COLOUR } from '../../utils/embeds';
import {
  CodeyCommandDetails,
  CodeyCommandOptionType,
  SapphireMessageExecuteType,
  SapphireMessageResponse,
} from '../../codeyCommand';

const RESULTS_PER_PAGE = 6;

const getInterviewerDisplayInfo = async (interviewer: Interviewer): Promise<string> => {
  const { client } = container;
  const user = await client.users.fetch(interviewer['user_id']);
  const userDomainsAddIn = await getInterviewerDomainsString(interviewer['user_id']);
  if (userDomainsAddIn === '') {
    return `${user} | [Calendar](${interviewer['link']})\n\n`;
  } else {
    return `${user} | [Calendar](${interviewer['link']}) | ${userDomainsAddIn}\n\n`;
  }
};

const interviewerListExecuteCommand: SapphireMessageExecuteType = async (
  _client,
  _messageFromUser,
  args,
): Promise<SapphireMessageResponse> => {
  const domain: string | undefined = <string>args['domain'];
  if (domain && !(domain.toLowerCase() in availableDomains)) {
    return `You entered an invalid domain. Please enter one of ${getAvailableDomainsString()}.`;
  }

  // Query interviewers
  const interviewers = await getInterviewers(domain);
  // Shuffles interviewers to load balance
  const shuffledInterviewers = _.shuffle(interviewers);
  // Only show up to page limit
  const interviewersToShow = shuffledInterviewers.slice(0, RESULTS_PER_PAGE);
  // Get information from each interviewer
  const interviewersInfo = await Promise.all(
    interviewersToShow.map((interviewer) => getInterviewerDisplayInfo(interviewer)),
  );

  // If there's no data, then interviewersInfo is an array of undefined, which messed things up
  // Thus need to display something else instead of interviewersInfo.join()
  const embedDescription =
    interviewersInfo[0] === undefined ? 'No data to display' : interviewersInfo.join('');

  // Construct embed for display
  const title = domain
    ? `Available Interviewers for ${availableDomains[domain]}`
    : 'Available Interviewers';
  const outEmbed = new EmbedBuilder()
    .setColor(DEFAULT_EMBED_COLOUR)
    .setTitle(title)
    .setDescription(embedDescription);
  return { embeds: [outEmbed] };
};

export const interviewerListCommandDetails: CodeyCommandDetails = {
  name: 'list',
  aliases: ['ls'],
  description: 'List all interviewers or those under a specific domain',
  detailedDescription: `**Examples:**
\`${container.botPrefix}interviewer list\`
\`${container.botPrefix}interviewer list backend\``,

  isCommandResponseEphemeral: false,
  messageWhenExecutingCommand: 'Listing interviewers...',
  executeCommand: interviewerListExecuteCommand,
  messageIfFailure: 'Could not list interviewers',
  options: [
    {
      name: 'domain',
      description: 'The domain to be examined',
      type: CodeyCommandOptionType.STRING,
      required: false,
    },
  ],
  subcommandDetails: {},
};
