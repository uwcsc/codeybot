import { Message, MessageEmbed } from 'discord.js';
import { CommandoClient, CommandoMessage } from 'discord.js-commando';
import { BaseCommand } from '../../utils/commands';
import { getResumeEmbed } from '../../utils/embeds';

import {default as resumes} from '../resumes/resumes.json';

class GetResumeCommand extends BaseCommand {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'get-resume-command',
      aliases: ['get-resume', 'resume'],
      group: 'resumes',
      memberName: 'get-resume',
      description: 'Get an example resume!',
      examples: [`${client.commandPrefix}resume web-dev 2`],
      args: [
        {
          key: 'field',
          prompt: 'The field of the resume (eg web-dev)',
          type: 'string'
        },
        {
          key: 'term',
          prompt: 'The work-term the person with the resume will be in during their co-op (eg 3)',
          type: 'integer'
        },
        {
          key: 'quality',
          prompt: 'Whether a resume is good, bad, or other fields (yet to be decided)',
          type: 'string'
        }
      ]
    });
  }

  async onRun(message: CommandoMessage, args: { field: string; term: string }): Promise<Message> {
    return message.channel.send(getResumeEmbed(args.field, args.term, resumes));
  }
}

export default GetResumeCommand;
