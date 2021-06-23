import { Message, MessageEmbed } from 'discord.js';
import { CommandoClient, CommandoMessage } from 'discord.js-commando';
import _ from 'lodash';

import { BaseCommand } from '../../utils/commands';
import { getDomains, getDomainsString, getInterviewer } from '../../components/interview';
import { EMBED_COLOUR } from '../../utils/embeds';

class InterviewerClearCommand extends BaseCommand {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'interviewer-profile',
      group: 'interviews',
      memberName: 'profile',
      description: 'Shows your interviewer profile.',
      examples: ['.interviewer-profile']
    });
  }

  async onRun(message: CommandoMessage): Promise<Message> {
    const { id } = message.author;

    // check if user signed up to be interviewer
    const interviewer = await getInterviewer(id);
    if (!interviewer) {
      return message.reply(
        "You don't seem to have signed up yet, please sign up using `.interviewer-signup <calendarUrl>`!"
      );
    }

    // get domains
    const domains = await getDomains(id);

    //build output embed
    const profileEmbed = new MessageEmbed().setColor(EMBED_COLOUR).setTitle('Interviewer Profile');
    profileEmbed.addField('**Link**', interviewer.link);
    profileEmbed.addField('**Domains**', _.isEmpty(domains) ? 'None' : getDomainsString(domains));
    return message.channel.send(profileEmbed);
  }
}

export default InterviewerClearCommand;
