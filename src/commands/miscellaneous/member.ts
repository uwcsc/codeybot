import { Command, container } from '@sapphire/framework';
import {
  CodeyCommand,
  CodeyCommandDetails,
  CodeyCommandOptionType,
  CodeyCommandResponseType,
  SapphireMessageExecuteType,
  SapphireMessageResponse
} from '../../codeyCommand';
import { getEmojiByName } from '../../components/emojis';
import { Message, MessageEmbed } from 'discord.js';
import fetch from 'node-fetch';

const MEMBER_API = 'https://csclub.uwaterloo.ca/~a3thakra/csc/adi-member-json-api/api/members.json';

interface memberStatus {
  name: string;
  id: string;
  program: string;
}

type UWIdType = string | undefined;

/*
 * Get member embed
 */
export const getMemberEmbed = async (uwid: UWIdType): Promise<MessageEmbed> => {
  const title = 'CSC Membership Information';
  if (uwid === undefined) {
    return new MessageEmbed().setColor('RED').setTitle(title).setDescription('Please provide a UW ID!');
  }

  const members = (await (await fetch(MEMBER_API)).json()).members as memberStatus[];
  const foundMember = members.filter((m) => m.id == uwid).length > 0;

  if (foundMember) {
    return new MessageEmbed()
      .setColor('GREEN')
      .setTitle(title)
      .setDescription(`You're a CSC member! Hooray! ${getEmojiByName('codeyLove')}`);
  }

  const NOT_MEMBER_DESCRIPTION = `You're not a CSC member! ${getEmojiByName('codeySad')}

Being a CSC member comes with gaining access to CSC machines, cloud, email, web hosting, and more! Additional details can be found here https://csclub.uwaterloo.ca/resources/services/

To sign up, you can follow the instructions here! https://csclub.uwaterloo.ca/get-involved/`;
  return new MessageEmbed().setColor('RED').setTitle(title).setDescription(NOT_MEMBER_DESCRIPTION);
};

const executeCommand: SapphireMessageExecuteType = async (
  _client,
  messageFromUser,
  args,
  _initialMessageFromBot
): Promise<SapphireMessageResponse> => {
  let uwid: UWIdType;
  if (messageFromUser instanceof Message) {
    const { content } = messageFromUser;
    const messageArgs = content.split(' ').filter((m) => m != '.member');
    if (messageArgs.length == 1) uwid = messageArgs[0];
  } else if ('uwid' in args) {
    uwid = args['uwid'] as string;
  }
  const memberEmbed = await getMemberEmbed(uwid);
  return { embeds: [memberEmbed] };
};

const helpCommandDetails: CodeyCommandDetails = {
  name: 'member',
  aliases: [],
  description: 'Get CSC Member information',
  detailedDescription: `**Examples:**
\`${container.botPrefix}member [id]\``,

  isCommandResponseEphemeral: false,
  messageWhenExecutingCommand: 'Getting Member Info...',
  executeCommand: executeCommand,
  messageIfFailure: 'Could not retrieve URL to the wiki page.',
  codeyCommandResponseType: CodeyCommandResponseType.EMBED,

  options: [
    {
      name: 'uwid',
      description: 'A UW alphanumerical ID',
      type: CodeyCommandOptionType.STRING,
      required: true
    }
  ],
  subcommandDetails: {}
};

export class MiscellaneousMemberCommand extends CodeyCommand {
  details = helpCommandDetails;

  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      aliases: helpCommandDetails.aliases,
      description: helpCommandDetails.description,
      detailedDescription: helpCommandDetails.detailedDescription
    });
  }
}
