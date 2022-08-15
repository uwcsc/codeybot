import { ApplyOptions } from '@sapphire/decorators';
import { Args, container } from '@sapphire/framework';
import { SubCommandPluginCommand, SubCommandPluginCommandOptions } from '@sapphire/plugin-subcommands';
import { Message, MessageEmbed } from 'discord.js';
import _ from 'lodash';
import { getEmojiByName } from '../../components/emojis';
import {
  getDomains,
  getDomainsString,
  getInterviewer,
  parseLink,
  pauseProfile,
  resumeProfile,
  upsertInterviewer
} from '../../components/interviewer';
import { EMBED_COLOUR } from '../../utils/embeds';

@ApplyOptions<SubCommandPluginCommandOptions>({
  aliases: ['interviewers', 'int'],
  description: 'Handles interviewer functions',
  detailedDescription: `**Examples:**
\`${container.botPrefix}interviewer\`
\`${container.botPrefix}interviewer frontend\``,
  subCommands: ['clear', 'domain', 'pause', 'profile', 'resume', 'signup', { input: 'list', default: true }]
})
export class InterviewerCommand extends SubCommandPluginCommand {
  async pause(message: Message): Promise<Message> {
    const { id } = message.author;

    // check if user signed up to be interviewer
    if (!(await getInterviewer(id))) {
      return message.reply(
        `you don't seem to have signed up yet, please sign up using \`${container.botPrefix}interviewer signup <calendarUrl>\`!`
      );
    }

    // pause interviewer data
    await pauseProfile(id);
    return message.reply(
      `your interviewer profile has been paused! You will not appear in interviewer queries anymore, until you run \`${container.botPrefix}interviewer resume\`.`
    );
  }

  async profile(message: Message): Promise<Message> {
    const { id } = message.author;

    // check if user signed up to be interviewer
    const interviewer = await getInterviewer(id);
    if (!interviewer) {
      return message.reply(
        `you don't seem to have signed up yet, please sign up using \`${container.botPrefix}interviewer signup <calendarUrl>\`!`
      );
    }

    // get domains
    const domains = await getDomains(id);

    //build output embed
    const profileEmbed = new MessageEmbed().setColor(EMBED_COLOUR).setTitle('Interviewer Profile');
    profileEmbed.addField('**Link**', interviewer.link);
    profileEmbed.addField('**Domains**', _.isEmpty(domains) ? 'None' : getDomainsString(domains));
    return message.channel.send({ embeds: [profileEmbed] });
  }

  async resume(message: Message): Promise<Message> {
    const { id } = message.author;

    // check if user signed up to be interviewer
    if (!(await getInterviewer(id))) {
      return message.reply(
        `you don't seem to have signed up yet, please sign up using \`${container.botPrefix}interviewer signup <calendarUrl>\`!`
      );
    }

    // resume interviewer data
    await resumeProfile(id);
    return message.reply('your interviewer profile has been resumed!');
  }
  async signup(message: Message, args: Args): Promise<Message> {
    // get calendar URL from the 1st capture group
    const calendarUrl = await args.pick('string').catch(() => '');
    const { id } = message.author;
    //parses link and checks for validity
    const parsedUrl = parseLink(calendarUrl);
    if (!parsedUrl) {
      return message.reply(`I don't seem to recognize your meeting link. Be sure to use calendly or x.ai.`);
    }

    // Add or update interviewer info
    await upsertInterviewer(id, parsedUrl);
    return message.reply(
      `your info has been updated. Thanks for helping out! ${getEmojiByName('codeyLove')?.toString()}`
    );
  }
}
