import { Message } from 'discord.js';
import { CommandoClient, CommandoMessage } from 'discord.js-commando';
import { BaseCommand } from '../../utils/commands';
import { availableDomains, getAvailableDomainsString, getInterviewer, toggleDomain } from '../../components/interview';
import { parseDomainArg, validateDomainArg } from './utils';

class InterviewerDomainCommand extends BaseCommand {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'interviewer-domain',
      aliases: ['int-domain', 'intdomain', 'interviewerdomain'],
      group: 'interviews',
      memberName: 'domain',
      args: [
        {
          key: 'domain',
          prompt: `enter one of ${getAvailableDomainsString()}.`,
          type: 'string',
          validate: validateDomainArg,
          parse: parseDomainArg
        }
      ],
      description: 'Adds or removes a domain from your interviewer profile.',
      examples: [`${client.commandPrefix}interviewer-domain frontend`, `${client.commandPrefix}interviewerdomain pm`]
    });
  }

  async onRun(message: CommandoMessage, args: { domain: string }): Promise<Message> {
    const { domain } = args;
    const { id } = message.author;

    // check if user signed up to be interviewer
    if (!(await getInterviewer(id))) {
      return message.reply(
        `you don't seem to have signed up yet, please sign up using \`${this.client.commandPrefix}interviewer-signup <calendarUrl>\`!`
      );
    }

    // Add or remove domain to/from interviewer
    const inDomain = await toggleDomain(id, domain);
    return message.reply(
      inDomain
        ? `you have been successfully removed from ${availableDomains[domain]}`
        : `you have been successfully added to ${availableDomains[domain]}`
    );
  }
}

export default InterviewerDomainCommand;
