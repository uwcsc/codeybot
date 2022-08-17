import _ from 'lodash';
import { container } from '@sapphire/framework';
import {
  CodeyCommandDetails,
  CodeyCommandResponseType,
  SapphireMessageExecuteType,
  SapphireMessageResponse,
  getUserFromMessage
} from '../../codeyCommand';

import { EMBED_COLOUR } from '../../utils/embeds';
import { MessageEmbed } from 'discord.js';

import { getInterviewer, getDomains, getDomainsString } from '../../components/interviewer';

const interviewerProfileExecuteCommand: SapphireMessageExecuteType = async (
  _client,
  messageFromUser,
  _args
): Promise<SapphireMessageResponse> => {
  const id = getUserFromMessage(messageFromUser).id;

  // check if user signed up to be interviewer
  const interviewer = await getInterviewer(id);
  if (!interviewer) {
    return `You don't seem to have signed up yet, please sign up using \`${container.botPrefix}interviewer signup <calendarUrl>\`!`;
  }

  // get domains
  const domains = await getDomains(id);

  //build output embed
  const profileEmbed = new MessageEmbed().setColor(EMBED_COLOUR).setTitle('Interviewer Profile');
  profileEmbed.addField('**Link**', interviewer.link);
  profileEmbed.addField('**Domains**', _.isEmpty(domains) ? 'None' : getDomainsString(domains));
  return { embeds: [profileEmbed] };
};

export const interviewerProfileCommandDetails: CodeyCommandDetails = {
  name: 'profile',
  aliases: ['profile'],
  description: 'Modify profile data',
  detailedDescription: `**Examples:**
\`${container.botPrefix}interviewer profile\``,
  isCommandResponseEphemeral: false,
  messageWhenExecutingCommand: 'Modifying profile',
  executeCommand: interviewerProfileExecuteCommand,
  codeyCommandResponseType: CodeyCommandResponseType.EMBED,
  options: [],
  subcommandDetails: {}
};
