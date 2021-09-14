import { VoiceState } from 'discord.js';
import { controlMentorMenteeCalls } from '../components/bootcamp';
const BOOTCAMP_GUILD_ID: string = process.env.BOOTCAMP_GUILD_ID || '.';

function onVoiceStateUpdate(oldMember: VoiceState, newMember: VoiceState): void {
  if (oldMember.guild.id === BOOTCAMP_GUILD_ID) {
    controlMentorMenteeCalls(oldMember, newMember);
  }
}

export default onVoiceStateUpdate;
