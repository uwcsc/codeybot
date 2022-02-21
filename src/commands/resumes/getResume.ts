import { Message, MessageEmbed } from 'discord.js';
import { CommandoClient, CommandoMessage } from 'discord.js-commando';
import { BaseCommand } from '../../utils/commands';

import { default as resumes } from './resumes.json';

import { availableDomains } from '../../components/interview';

const RESUME_EMBED_COLOUR = '#77bb00';

interface Resume {
  url: string;
  author: string;
}

/*
 * Send embed for getting an example resume
 */
const getResumeEmbed = (
  domain: string,
  term: number,
  quality: string,
  resumes: { [key: string]: { [key: number]: { [key: string]: Resume[] } } }
): MessageEmbed => {
  try {
    // get link to resume (just first one in the "list" for now)
    const resumeLink = resumes[domain][term][quality][0].url;
    // get domain name
    const domainName = availableDomains[domain];

    return new MessageEmbed()
      .setColor(RESUME_EMBED_COLOUR)
      .setTitle(`Example Resume For ${domainName}`)
      .setDescription(`An example ${quality} resume for ${domainName} for work term ${term}`)
      .addFields({
        name: 'Resume Link',
        value: resumeLink
      });
  } catch (e) {
    // if error, we return a list of all the possible categories
    let categoryString = '';
    for (const [key, name] of Object.entries(availableDomains)) {
      categoryString += `⚙  ${key} - **${name}**\n`;
    }
    return new MessageEmbed()
      .setColor(RESUME_EMBED_COLOUR)
      .setTitle(`No resume found!`)
      .setDescription(
        `Sorry, we could not find a resume in the category you are looking for. Please check the available categories down below and try again.`
      )
      .addFields(
        {
          name: 'Fields',
          value: categoryString
        },
        {
          name: 'Term',
          value: '1, 2, 3, 4, 5 or 6'
        },
        {
          name: 'Quality',
          value: '✅ Good\n❌ Bad\n'
        }
      );
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

  async onRun(message: CommandoMessage, args: { field: string; term: number; quality: string }): Promise<Message> {
    // load resumes from json file
    // logger.info(resumes);
    return message.channel.send(getResumeEmbed(args.field, args.term, args.quality, resumes));
  }
}

export default GetResumeCommand;
