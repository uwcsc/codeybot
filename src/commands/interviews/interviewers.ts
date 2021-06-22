import { Message, MessageEmbed } from 'discord.js';
import { Argument, CommandoClient, CommandoMessage } from 'discord.js-commando';
import _ from 'lodash';

import { BaseCommand } from '../../utils/commands';
import { availableDomains, getDomainString, getInterviewers, Interviewer } from '../../components/interview';
import { EMBED_COLOUR } from '../../utils/embeds';

const RESULTS_PER_PAGE = 6;

const validateDomainArg = (value: string, _message: CommandoMessage, _arg: Argument) => {
  // this argument is optional
  if (value === '') return true;
  // validate if this is one of the available domains
  if (value in availableDomains) return true;
  return `you entered an invalid domain, please enter one of ${getDomainString(availableDomains)}.`;
};

class InterviewersCommand extends BaseCommand {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'interviewers',
      aliases: ['interviewer', 'interviewer-list', 'interviewers-list'],
      group: 'interviews',
      memberName: 'interviewers',
      args: [
        {
          key: 'domain',
          prompt: `enter one of ${getDomainString(availableDomains)}.`,
          type: 'string',
          default: '',
          validate: validateDomainArg
        }
      ],
      description: 'Shows you a list of available interviewers.',
      examples: ['.interviewer signup calendly.com/codey/mock-interview']
    });
  }

  private async getInterviewerDisplayInfo(interviewer: Interviewer) {
    const userTag = (await this.client.users.fetch(interviewer['user_id'])).tag;
    return '**' + userTag + '** | [Calendar](' + interviewer['link'] + ')\n\n';
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
