import { CodeyUserError } from './../../codeyUserError';
import { Args, container } from '@sapphire/framework';
import { Subcommand } from '@sapphire/plugin-subcommands';
import { Message, EmbedBuilder } from 'discord.js';
import _ from 'lodash';
import { getEmojiByName } from '../../components/emojis';
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
  upsertInterviewer,
} from '../../components/interviewer';
import { DEFAULT_EMBED_COLOUR } from '../../utils/embeds';

const RESULTS_PER_PAGE = 6;

export class InterviewerCommand extends Subcommand {
  public constructor(context: Subcommand.Context, options: Subcommand.Options) {
    super(context, {
      ...options,
      name: 'interviewers',
      aliases: ['int'],
      description: 'Handle interviewer functions.',
      detailedDescription: `**Examples:**
\`${container.botPrefix}interviewer\`
\`${container.botPrefix}interviewer frontend\``,
      subcommands: [
        { name: 'clear', messageRun: 'clear' },
        { name: 'domain', messageRun: 'domain' },
        { name: 'pause', messageRun: 'pause' },
        { name: 'profile', messageRun: 'profile' },
        { name: 'resume', messageRun: 'resume' },
        { name: 'signup', messageRun: 'signup' },
        { name: 'signup', messageRun: 'signup' },
        { name: 'list', messageRun: 'list', default: true },
      ],
    });
  }

  public async clear(message: Message): Promise<Message | void> {
    try {
      const { id } = message.author;

      // check if user signed up to be interviewer
      if (!(await getInterviewer(id))) {
        throw new CodeyUserError(
          message,
          `you don't seem to have signed up yet, please sign up using \`${container.botPrefix}interviewer signup <calendarUrl>\`!`,
        );
      }

      // clear interviewer data
      await clearProfile(id);
      return message.reply('your interviewer profile has been cleared!');
    } catch (e) {
      if (e instanceof CodeyUserError) {
        e.sendToUser();
      }
    }
  }

  async domain(message: Message, args: Args): Promise<Message> {
    const domain = await args.rest('string').catch(() => `Err`);
    if (!(domain.toLowerCase() in availableDomains))
      throw new CodeyUserError(
        message,
        `you entered an invalid domain. Please enter one of ${getAvailableDomainsString()}.`,
      );
    const { id } = message.author;
    // check if user signed up to be interviewer
    if (!(await getInterviewer(id))) {
      throw new CodeyUserError(
        message,
        `you don't seem to have signed up yet, please sign up using \`${container.botPrefix}interviewer signup <calendarUrl>\`!`,
      );
    }

    // Add or remove domain to/from interviewer
    const inDomain = await toggleDomain(id, domain);
    return message.reply(
      inDomain
        ? `you have been successfully removed from ${availableDomains[domain]}`
        : `you have been successfully added to ${availableDomains[domain]}`,
    );
  }

  async pause(message: Message): Promise<Message> {
    const { id } = message.author;

    // check if user signed up to be interviewer
    if (!(await getInterviewer(id))) {
      throw new CodeyUserError(
        message,
        `you don't seem to have signed up yet, please sign up using \`${container.botPrefix}interviewer signup <calendarUrl>\`!`,
      );
    }

    // pause interviewer data
    await pauseProfile(id);
    return message.reply(
      `your interviewer profile has been paused! You will not appear in interviewer queries anymore, until you run \`${container.botPrefix}interviewer resume\`.`,
    );
  }

  async profile(message: Message): Promise<Message> {
    const { id } = message.author;

    // check if user signed up to be interviewer
    const interviewer = await getInterviewer(id);
    if (!interviewer) {
      throw new CodeyUserError(
        message,
        `you don't seem to have signed up yet, please sign up using \`${container.botPrefix}interviewer signup <calendarUrl>\`!`,
      );
    }

    // get domains
    const domains = await getDomains(id);

    //build output embed
    const profileEmbed = new EmbedBuilder()
      .setColor(DEFAULT_EMBED_COLOUR)
      .setTitle('Interviewer Profile');
    profileEmbed.addFields([
      { name: '**Link**', value: interviewer.link },
      { name: '**Domains**', value: _.isEmpty(domains) ? 'None' : getDomainsString(domains) },
    ]);
    return message.channel.send({ embeds: [profileEmbed] });
  }

  async resume(message: Message): Promise<Message> {
    const { id } = message.author;

    // check if user signed up to be interviewer
    if (!(await getInterviewer(id))) {
      throw new CodeyUserError(
        message,
        `you don't seem to have signed up yet, please sign up using \`${container.botPrefix}interviewer signup <calendarUrl>\`!`,
      );
    }

    // resume interviewer data
    await resumeProfile(id);
    return message.reply('your interviewer profile has been resumed!');
  }

  private async getInterviewerDisplayInfo(interviewer: Interviewer) {
    const { client } = container;
    const user = await client.users.fetch(interviewer['user_id']);
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
      throw new CodeyUserError(
        message,
        `you entered an invalid domain. Please enter one of ${getAvailableDomainsString()}.`,
      );
    // query interviewers
    const interviewers = await getInterviewers(domain);
    // shuffles interviewers to load balance
    const shuffledInterviewers = _.shuffle(interviewers);
    // only show up to page limit
    const interviewersToShow = shuffledInterviewers.slice(0, RESULTS_PER_PAGE);
    // get information from each interviewer
    const interviewersInfo = await Promise.all(
      interviewersToShow.map((interviewer) => this.getInterviewerDisplayInfo(interviewer)),
    );

    // construct embed for display
    const title = domain
      ? `Available Interviewers for ${availableDomains[domain]}`
      : 'Available Interviewers';
    const outEmbed = new EmbedBuilder().setColor(DEFAULT_EMBED_COLOUR).setTitle(title);
    outEmbed.setDescription(interviewersInfo.join());
    return message.channel.send({ embeds: [outEmbed] });
  }

  async signup(message: Message, args: Args): Promise<Message> {
    // get calendar URL from the 1st capture group
    const calendarUrl = await args.pick('string').catch(() => '');
    const { id } = message.author;
    //parses link and checks for validity
    const parsedUrl = parseLink(calendarUrl);
    if (!parsedUrl) {
      throw new CodeyUserError(
        message,
        `I don't seem to recognize your meeting link. Be sure to use calendly or x.ai.`,
      );
    }

    // Add or update interviewer info
    await upsertInterviewer(id, parsedUrl);
    return message.reply(
      `your info has been updated. Thanks for helping out! ${getEmojiByName(
        'codey_love',
      )?.toString()}`,
    );
  }
}
