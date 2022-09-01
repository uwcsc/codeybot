import { container } from '@sapphire/framework';
import { Message, MessageEmbed } from 'discord.js';
import fetch from 'node-fetch';
import {
  CodeyCommandDetails,
  CodeyCommandOptionType,
  SapphireMessageExecuteType,
  SapphireMessageResponse,
} from '../../codeyCommand';
import { getEmojiByName } from '../../components/emojis';

const MEMBER_API = 'https://csclub.uwaterloo.ca/api/members.json';

interface memberStatus {
  name: string;
  id: string;
  program: string;
}

type UwIdType = string | undefined;

/*
 * Get member embed
 */
const getMemberEmbed = async (uwid: UwIdType): Promise<MessageEmbed> => {
  const title = 'CSC Membership Information';
  if (!uwid) {
    return new MessageEmbed()
      .setColor('RED')
      .setTitle(title)
      .setDescription('Please provide a UW ID!');
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

Being a CSC member comes with gaining access to CSC machines, cloud, email, web hosting, and more! Additional details can be found here! https://csclub.uwaterloo.ca/resources/services/

To sign up, you can follow the instructions here! https://csclub.uwaterloo.ca/get-involved/`;
  return new MessageEmbed().setColor('RED').setTitle(title).setDescription(NOT_MEMBER_DESCRIPTION);
};

const memberExecuteCommand: SapphireMessageExecuteType = async (
  _client,
  messageFromUser,
  args,
): Promise<SapphireMessageResponse> => {
  let uwId: UwIdType;
  if (messageFromUser instanceof Message) {
    const { content } = messageFromUser;
    const messageArgs = content.split(' ').filter((m) => m != '.member');
    if (messageArgs.length == 1) uwId = messageArgs[0];
  } else if ('uwid' in args) {
    uwId = args['uwid'] as string;
  }
  const memberEmbed = await getMemberEmbed(uwId);
  return { embeds: [memberEmbed] };
};

export const memberCommandDetails: CodeyCommandDetails = {
  name: 'member',
  aliases: [],
  description: 'Get CSC membership information of a user.',
  detailedDescription: `**Examples:**
\`${container.botPrefix}member [id]\``,

  isCommandResponseEphemeral: true,
  messageWhenExecutingCommand: 'Getting CSC membership information...',
  executeCommand: memberExecuteCommand,
  messageIfFailure: 'Could not retrieve CSC membership information.',
  options: [
    {
      name: 'uwid',
      description: 'The Quest ID of the user.',
      type: CodeyCommandOptionType.STRING,
      required: true,
    },
  ],
  subcommandDetails: {},
};
