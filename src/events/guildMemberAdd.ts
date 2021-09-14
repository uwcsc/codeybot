import { GuildMember } from 'discord.js';
import { checkIfMentor } from '../components/bootcamp';
const BOOTCAMP_GUILD_ID: string = process.env.BOOTCAMP_GUILD_ID || '.';

function onGuildMemberAdd(member: GuildMember): void {
  if (member.guild.id === BOOTCAMP_GUILD_ID) {
    checkIfMentor(member);
  }
}

export default onGuildMemberAdd;
