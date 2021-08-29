import { Message } from 'discord.js';
import { CommandoClient, CommandoGuild, CommandoMessage } from 'discord.js-commando';
import { AdminCommand } from '../../utils/commands';


class EmoteCommand extends AdminCommand {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'emote',
      group: 'emotes',
      memberName: 'emote',
      args: [
        {
          key: 'name',
          prompt: 'what is the name of your emote?',
          type: 'string'
        },
        {
          key: 'url',
          prompt: 'what\'s the url of the image?',
          type: 'string'
        }
      ],
      description: 'Adds an emote to the server.',
      examples: [`${client.commandPrefix}emote I want a new Discord channel named #hobbies!`],
      details: `This command will forward a emoteion to the CSC executives. \
Please note that your emoteion is not anonymous, your Discord username and ID will be recorded. \
If you don't want to make a emoteion in public, you could use this command via a DM to Codey instead.`
    });
  }

  async onRun(message: CommandoMessage, args: { name: string, url: string }): Promise<Message> {
    const { name, url } = args;

    // const url = "https://cdn.discordapp.com/attachments/830289643512791060/865073321142124544/1609410151273.jpg"

    let guild = message.guild;

    let emote;

    try {
      emote = await guild.emojis.create(url, name);
      message.say(`Emote created: ${emote}`);
    } catch (error) {
      message.say(`Failed to create emote: ${error}`);
      throw error;
    }
        
    return message.reply(name + ' is a great name for this emoji');
  }
}

export default EmoteCommand;
