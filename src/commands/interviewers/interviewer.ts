import { SubCommandPluginCommand, SubCommandPluginCommandOptions } from '@sapphire/plugin-subcommands';
import type { Args, CommandOptions } from '@sapphire/framework';
import { Message, MessageEmbed } from 'discord.js';
import { EMBED_COLOUR } from '../../utils/embeds';
import {
  availableDomains,
  clearProfile,
  getAvailableDomainsString,
  getDomains,
  getDomainsString,
  getInterviewer,
  getInterviewerDomainsString,
  getInterviewers,
  Interviewer,
  parseLink,
  pauseProfile,
  resumeProfile,
  toggleDomain,
  upsertInterviewer
} from '../../components/interview';
import { BOT_PREFIX } from '../../bot';
import { getEmojiByName } from '../../components/emojis';
import _ from 'lodash';
import { container } from '@sapphire/pieces';
import { ApplyOptions } from '@sapphire/decorators';

const RESULTS_PER_PAGE = 6;

@ApplyOptions<SubCommandPluginCommandOptions>({
  aliases: ['interviewers'],
  description: 'Handles interviewer functions',
  detailedDescription: `**Examples:**\n\`${container.client.options.defaultPrefix}interviewer frontend\``,
  subCommands: ['clear', 'domain', 'pause', 'profile', 'resume', 'signup', { input: 'list', default: true }]
})
export class InterviewerCommand extends SubCommandPluginCommand {
  public async clear(message: Message): Promise<Message> {
    const { id } = message.author;

    // check if user signed up to be interviewer
    if (!(await getInterviewer(id))) {
      return message.reply(
        `you don't seem to have signed up yet, please sign up using \`${BOT_PREFIX}interviewer signup <calendarUrl>\`!`
      );
    }

    // clear interviewer data
    await clearProfile(id);
    return message.reply('your interviewer profile has been cleared!');
  }

  async domain(message: Message, args: Args): Promise<Message> {
    const domain = await args.rest('string').catch(() => `Err`);
    if (!(domain.toLowerCase() in availableDomains))
      return message.reply(`you entered an invalid domain. Please enter one of ${getAvailableDomainsString()}.`);
    const { id } = message.author;
    // check if user signed up to be interviewer
    if (!(await getInterviewer(id))) {
      return message.reply(
        `you don't seem to have signed up yet, please sign up using \`${BOT_PREFIX}interviewer signup <calendarUrl>\`!`
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

  async pause(message: Message): Promise<Message> {
    const { id } = message.author;

    // check if user signed up to be interviewer
    if (!(await getInterviewer(id))) {
      return message.reply(
        `you don't seem to have signed up yet, please sign up using \`${BOT_PREFIX}interviewer signup <calendarUrl>\`!`
      );
    }

    // pause interviewer data
    await pauseProfile(id);
    return message.reply(
      `your interviewer profile has been paused! You will not appear in interviewer queries anymore, until you run \`${BOT_PREFIX}interviewer resume\`.`
    );
  }

  async profile(message: Message): Promise<Message> {
    const { id } = message.author;

    // check if user signed up to be interviewer
    const interviewer = await getInterviewer(id);
    if (!interviewer) {
      return message.reply(
        `you don't seem to have signed up yet, please sign up using \`${BOT_PREFIX}interviewer signup <calendarUrl>\`!`
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
        `you don't seem to have signed up yet, please sign up using \`${BOT_PREFIX}interviewer signup <calendarUrl>\`!`
      );
    }

    // resume interviewer data
    await resumeProfile(id);
    return message.reply('your interviewer profile has been resumed!');
  }

  private async getInterviewerDisplayInfo(interviewer: Interviewer) {
    const user = await this.container.client.users.fetch(interviewer['user_id']);
    const userDomainsAddIn = await getInterviewerDomainsString(interviewer['user_id']);
    if (userDomainsAddIn === '') {
      return `${user} | [Calendar](${interviewer['link']})\n\n`;
    } else {
      return `${user} | [Calendar](${interviewer['link']}) | ${userDomainsAddIn}\n\n`;
    }
  }

  async list(message: Message, args: Args): Promise<Message> {
    const domain = await args.pick('string').catch(() => '');
    if (domain !== '' && !(domain.toLowerCase() in availableDomains))
      return message.reply(`you entered an invalid domain. Please enter one of ${getAvailableDomainsString()}.`);
    // query interviewers
    const interviewers = await getInterviewers(domain);
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
    return message.channel.send({ embeds: [outEmbed] });
  }

  async signup(message: Message, args: Args): Promise<Message> {
    // get calendar URL from the 1st capture group
    const calendarUrl = args.next();
    const { id } = message.author;
    console.log('test' + calendarUrl);
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
