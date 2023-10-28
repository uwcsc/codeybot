import { container } from '@sapphire/framework';
import { Message, EmbedBuilder } from 'discord.js';
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
const getMemberEmbed = async (uwid: UwIdType): Promise<EmbedBuilder> => {
  const title = 'CSC Membership Information';
  const NOT_MEMBER_DESCRIPTION = `Being a CSC member comes with gaining access to CSC machines, cloud, email, web hosting, and more! Additional details can be found here! https://csclub.uwaterloo.ca/resources/services/
  
  To sign up, you can follow the instructions here! https://csclub.uwaterloo.ca/get-involved/`;
  
  if (!uwid) {
    return new EmbedBuilder()
      .setColor('Blue')
      .setTitle(title)
      .setDescription(NOT_MEMBER_DESCRIPTION);
  }

  const members = (await (await fetch(MEMBER_API)).json()).members as memberStatus[];
  const foundMember = members.filter((m) => m.id == uwid).length > 0;

  if (foundMember) {
    return new EmbedBuilder()
      .setColor('Green')
      .setTitle(title)
      .setDescription(`You're a CSC member! Hooray! ${getEmojiByName('codey_love')}`);
  }

  return new EmbedBuilder().setColor('Red').setTitle(title).setDescription(NOT_MEMBER_DESCRIPTION);
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
