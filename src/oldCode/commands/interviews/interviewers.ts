import { Message, MessageEmbed } from 'discord.js';
import { CommandoClient, CommandoMessage } from 'discord.js-commando';
import _ from 'lodash';

import { BaseCommand } from '../../utils/commands';
import {
  availableDomains,
  getAvailableDomainsString,
  getInterviewers,
  Interviewer,
  getInterviewerDomainsString
} from '../../components/interview';
import { EMBED_COLOUR } from '../../utils/embeds';
import { parseDomainArg, validateDomainArg } from './utils';

const RESULTS_PER_PAGE = 6;

class InterviewersCommand extends BaseCommand {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'interviewers',
      aliases: [
        'ints',
        'int',
        'interviewer',
        'interviewers-list',
        'interviewerslist',
        'interviewer-list',
        'interviewerlist'
      ],
      group: 'interviews',
      memberName: 'interviewers',
      args: [
        {
          key: 'domain',
          prompt: `enter one of ${getAvailableDomainsString()}.`,
          type: 'string',
          default: '',
          validate: validateDomainArg,
          parse: parseDomainArg
        }
      ],
      description: 'Shows you a list of available interviewers.',
      examples: [`${client.commandPrefix}interviewers`, `${client.commandPrefix}interviewers backend`]
    });
  }

  private async getInterviewerDisplayInfo(interviewer: Interviewer) {
    const user = await this.client.users.fetch(interviewer['user_id']);
    const userDomainsAddIn = await getInterviewerDomainsString(interviewer['user_id']);
    if (userDomainsAddIn === '') {
      return `${user} | [Calendar](${interviewer['link']})\n\n`;
    } else {
      return `${user} | [Calendar](${interviewer['link']}) | ${userDomainsAddIn}\n\n`;
    }
  }

  async onRun(message: CommandoMessage, args: { domain: string }): Promise<Message> {
    const { domain } = args;

    // query interviewers
    const interviewers = await getInterviewers(args.domain);
    // shuffles interviewers to load balance
    const shuffledInterviewers = _.shuffle(interviewers);
    // only show up to page limit
    const interviewersToShow = shuffledInterviewers.slice(0, RESULTS_PER_PAGE);
    // get information from each interviewer
    const interviewersInfo = await Promise.all(
      interviewersToShow.map((interviewer) => this.getInterviewerDisplayInfo(interviewer))
    );

    // construct embed for display
    const title = domain ? `Available Interviewers for ${availableDomains[domain]}` : 'Available Interviewers';
    const outEmbed = new MessageEmbed().setColor(EMBED_COLOUR).setTitle(title);
    outEmbed.setDescription(interviewersInfo.join());
    return message.channel.send(outEmbed);
  }
}

export default InterviewersCommand;
