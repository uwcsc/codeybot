import { Message, MessageEmbed } from 'discord.js';
import { CommandoClient, CommandoMessage } from 'discord.js-commando';
import { BaseCommand } from '../../utils/commands';

import {default as resumes} from '../resumes/resumes.json';

import { availableDomains } from '../../components/interview';

const RESUME_EMBED_COLOUR = '#77bb00';

/*
* Send embed for getting an example resume
*/
const getResumeEmbed = (domain: string, term: string, resumes: any): MessageEmbed => {
  try {
    // get link to resume (just first one in the "list" for now)
    const resumeLink = resumes[domain][term][0].url;
    const domainName = availableDomains[domain];

    return new MessageEmbed()
      .setColor(RESUME_EMBED_COLOUR)
      .setTitle(`Example Resume For ${domainName}`)
      .setDescription(`An example resume for ${domainName} for work term ${term}`)
      .addFields({
        name: 'Resume Link',
        value: resumeLink
      });
  } catch (e) {
    return new MessageEmbed()
      .setColor(RESUME_EMBED_COLOUR)
      .setTitle(`No resume found!`)
      .setDescription(`Sorry, we could not find a resume in the category you are looking for. Please try again.`)
      .addFields({
        name: 'Sorry!',
        value: 'No resumes exist for this combination of category and term.'
      });
  }
};

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

  async onRun(message: CommandoMessage, args: { field: string; term: string; quality: string }): Promise<Message> {
    return message.channel.send(getResumeEmbed(args.field, args.term, resumes));
  }
}

export default GetResumeCommand;
