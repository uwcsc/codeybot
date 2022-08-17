import { getEmojiByName } from '../../components/emojis';
import { MessageEmbed } from 'discord.js';
import fetch from 'node-fetch';

const MEMBER_API = 'https://csclub.uwaterloo.ca/~a3thakra/csc/adi-member-json-api/api/members.json';

interface memberStatus {
  name: string;
  id: string;
  program: string;
}

export type UWIdType = string | undefined;

/*
 * Get member embed
 */
export const getMemberEmbed = async (uwid: UWIdType): Promise<MessageEmbed> => {
  const title = 'CSC Membership Information';
  if (!uwid) {
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
