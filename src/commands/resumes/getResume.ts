import { Message, MessageEmbed } from 'discord.js';
import { CommandoClient, CommandoMessage } from 'discord.js-commando';
import { BaseCommand } from '../../utils/commands';
import { RESUME_EMBED_COLOUR } from '../../utils/embeds';

class GetResumeCommand extends BaseCommand {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'get-resume-command',
      aliases: ['get-resume', 'resume'],
      group: 'resumes',
      memberName: 'get-resume',
      description: 'Get an example resume!',
      examples: [
        `${client.commandPrefix}resume web-dev 2`
      ],
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
        }
      ]
    });
  }

  getResumeEmbed = (field: string, term: number) => new MessageEmbed()
    .setColor(RESUME_EMBED_COLOUR)
    .setTitle('Example Resume')
    .setDescription(`Example resume for ${field} for work term ${term}`)
    .addFields(
        {
            name: 'Resume Link',
            value: 'https://google.com'
        }
    );
    

  async onRun(message: CommandoMessage, args: { field: string; term: number }): Promise<Message> {
    return message.channel.send(
      this.getResumeEmbed(args.field, args.term)
    );
  }
}

export default GetResumeCommand;
