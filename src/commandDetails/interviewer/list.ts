import { container } from '@sapphire/framework';
import {
  CodeyCommandDetails,
  CodeyCommandOptionType,
  CodeyCommandResponseType,
  SapphireMessageExecuteType,
  SapphireMessageResponse
} from '../../codeyCommand';

import { APIApplicationCommandOptionChoice } from 'discord-api-types/v9';
import _ from 'lodash';
import {
  availableDomains,
  getAvailableDomainsString,
  Interviewer,
  getInterviewerDomainsString,
  getInterviewers
} from '../../components/interviewer';

import { MessageEmbed } from 'discord.js';

import { EMBED_COLOUR } from '../../utils/embeds';
const RESULTS_PER_PAGE = 6;

const interviewerListExecuteCommand: SapphireMessageExecuteType = async (
  _client,
  _messageFromUser,
  args
): Promise<SapphireMessageResponse> => {
  const domain = <string>args['domain'];

  if (domain !== '' && !(domain.toLowerCase() in availableDomains))
    return `You entered an invalid domain. Please enter one of ${getAvailableDomainsString()}.`;
  // query interviewers
  const interviewers = await getInterviewers(domain);
  // shuffles interviewers to load balance
  const shuffledInterviewers = _.shuffle(interviewers);
  // only show up to page limit
  const interviewersToShow = shuffledInterviewers.slice(0, RESULTS_PER_PAGE);
  // get information from each interviewer
  const interviewersInfo = await Promise.all(
    interviewersToShow.map((interviewer) => getInterviewerDisplayInfo(interviewer))
  );

  // construct embed for display
  const title = domain ? `Available Interviewers for ${availableDomains[domain]}` : 'Available Interviewers';
  const outEmbed = new MessageEmbed().setColor(EMBED_COLOUR).setTitle(title);
  outEmbed.setDescription(interviewersInfo.join());
  return { embeds: [outEmbed] };
};

const getInterviewerDisplayInfo = async (interviewer: Interviewer) => {
  const { client } = container;
  const user = await client.users.fetch(interviewer['user_id']);
  const userDomainsAddIn = await getInterviewerDomainsString(interviewer['user_id']);
  if (userDomainsAddIn === '') {
    return `${user} | [Calendar](${interviewer['link']})\n\n`;
  } else {
    return `${user} | [Calendar](${interviewer['link']}) | ${userDomainsAddIn}\n\n`;
  }
};

function generateChoices(): APIApplicationCommandOptionChoice[] {
  const retObject: APIApplicationCommandOptionChoice[] = [];
  for (const [domainValue, domainName] of Object.entries(availableDomains)) {
    retObject.push({
      name: domainName,
      value: domainValue
    });
  }
  return retObject;
}

export const interviewerListCommandDetails: CodeyCommandDetails = {
  name: 'list',
  aliases: ['list'],
  description: 'List all interviewers or those under a specific domain',
  detailedDescription: `**Examples:**
\`${container.botPrefix}interviewer list\`
\`${container.botPrefix}interviewer list backend\``,
  isCommandResponseEphemeral: false,
  messageWhenExecutingCommand: 'Listing interviewers',
  executeCommand: interviewerListExecuteCommand,
  codeyCommandResponseType: CodeyCommandResponseType.STRING,
  options: [
    {
      name: 'domain',
      description: 'The domain to be examined',
      required: false,
      type: CodeyCommandOptionType.STRING,
      choices: generateChoices()
    }
  ],
  subcommandDetails: {}
};
