import { Message } from 'discord.js';
import { addToMentorList } from '../components/bootcamp';
const BOOTCAMP_GUILD_ID: string = process.env.BOOTCAMP_GUILD_ID || '.';

function onMessage(message: Message): void {
  if (message?.guild?.id === BOOTCAMP_GUILD_ID) {
    addToMentorList(message);
  }
}

export default onMessage;
