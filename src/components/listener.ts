import { CommandoMessage } from "discord.js-commando";
import { applyBonusByUserId } from "./coin";


export const listener = (message: CommandoMessage, event = 'client', data: { [key: string]: string } = {}): void => {
    applyBonusByUserId(message.author.id);
};

