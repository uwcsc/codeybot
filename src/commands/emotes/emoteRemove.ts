import { Guild, GuildEmoji, Message, MessageReaction } from 'discord.js';
import { CommandoClient, CommandoGuild, CommandoMessage } from 'discord.js-commando';
import { AdminCommand } from '../../utils/commands';
import logger, { logError } from '../../components/logger';

class EmoteRemoveCommand extends AdminCommand {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'emote-remove',
      aliases: ['emotes-clean', 'emojis-clean', 'emoji-remove', 'emotes-remove', 'emojis-remove'],
      group: 'emotes',
      memberName: 'remove',
      args: [
        {
          key: 'confirm',
          prompt: 'React to your message above and press any key to continue!',
          type: 'string'
        },
      ],
      description: 'Deletes multiple emotes from the server via reactions.',
      examples: [`${client.commandPrefix}emote I want a new Discord channel named #hobbies!`],
      details: `This command will forward a emoteion to the CSC executives. \
Please note that your emoteion is not anonymous, your Discord username and ID will be recorded. \
If you don't want to make a emoteion in public, you could use this command via a DM to Codey instead.`
    });
  }

  async onRun(message: CommandoMessage, args: { confirm: string }): Promise<Message> {
    const { confirm } = args;

    // const url = "https://cdn.discordapp.com/attachments/830289643512791060/865073321142124544/1609410151273.jpg"

    let guild = message.guild;
    
    let reactions: MessageReaction[] = [];
    message.reactions.cache.forEach((reaction) => {
      reactions.push(reaction);
    });

    let emojis: GuildEmoji[] = [];
    guild.emojis.cache.forEach((emoji) => {
      emojis.push(emoji);
    });

    for (const reaction of reactions) {
      const name = reaction.emoji.name;
      for (const emoji of emojis) {
        if (name == emoji.name) {
          try {
            emoji.delete()
            message.say(`Emote removed: ${name}`);
          } catch (error) {
            message.say(`Failed to remove emote: ${error}`);
            throw error;
          }
        }
      }
    }

    return message.reply(message.reactions.cache.size + " emotes have been delete this server");
  }
}

export default EmoteRemoveCommand;
