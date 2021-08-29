import { Message, MessageReaction } from 'discord.js';
import { CommandoClient, CommandoGuild, CommandoMessage } from 'discord.js-commando';
import { AdminCommand } from '../../utils/commands';
import logger, { logError } from '../../components/logger';

class EmoteCopyCommand extends AdminCommand {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'emote-copy',
      aliases: ['emotes', 'emojis', 'emoji-copy', 'emotes-copy', 'emojis-copy'],
      group: 'emotes',
      memberName: 'copy',
      args: [
        {
          key: 'confirm',
          prompt: 'React to your message above and press any key to continue!',
          type: 'string'
        },
      ],
      description: 'Copies multiple emotes to the server via reactions.',
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


    for (const reaction of reactions) {
      let emote;
      let url = `https://cdn.discordapp.com/emojis/${reaction.emoji.id}.png`;

      // logger.info(reaction)

      try {
        emote = await guild.emojis.create(url, reaction.emoji.name);
        message.say(`Emote added: ${emote}`);
      } catch (error) {
        message.say(`Failed to create emote: ${error}`);
        throw error;
      }
    }

    return message.reply(message.reactions.cache.size + " emotes have been copied over to this server");
  }
}

export default EmoteCopyCommand;
