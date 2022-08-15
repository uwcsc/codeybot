import { container } from '@sapphire/framework';
import {
  CodeyCommandDetails,
  CodeyCommandResponseType,
  SapphireMessageExecuteType,
  SapphireMessageResponse,
} from '../../codeyCommand';

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
  const domain = <string>args['string'];

  if (domain !== '' && !(domain.toLowerCase() in availableDomains))
    return `you entered an invalid domain. Please enter one of ${getAvailableDomainsString()}.`;
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

export const interviewerListCommandDetails: CodeyCommandDetails = {
  name: 'list',
  aliases: ['list'],
  description: 'List all interviewers',
  detailedDescription: `TODO`,
  isCommandResponseEphemeral: false,
  messageWhenExecutingCommand: 'Listing interviewers',
  executeCommand: interviewerListExecuteCommand,
  codeyCommandResponseType: CodeyCommandResponseType.STRING,
  options: [],
  subcommandDetails: {}
};
