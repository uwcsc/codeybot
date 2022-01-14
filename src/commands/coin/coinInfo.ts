import { Message, MessageEmbed } from 'discord.js';
import { CommandoClient, CommandoMessage } from 'discord.js-commando';
import { BaseCommand } from '../../utils/commands';
import { EMBED_COLOUR } from '../../utils/embeds';

class CoinInfo extends BaseCommand {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'coin-info',
      aliases: ['ci', 'coininfo', 'codeycoin info'],
      group: 'coin',
      memberName: 'coin-info',
      description: 'Info about Codey Coin, including ways to get and how to spend Codey Coins.',
      examples: [`${client.commandPrefix}coin-info`, `${client.commandPrefix}ci`, `${client.commandPrefix}coininfo`]
    });
  }
  infoEmbed = new MessageEmbed()
    .setColor(EMBED_COLOUR)
    .setTitle('🪙 About Codey Coin 🪙')
    .setThumbnail('') // Thumbnail, if needed?
    .setDescription('Codey Coin is a virtual currency... (what it is, maybe some rules around it) \n')
    .addFields(
      {
        name: 'How Can I Obtain Codey Coins?',
        value:
          'You can obtain Codey Coins by participating in Discord activities, such as:\n' +
          ' • Attending CSC Events\n' +
          ' • Daily bonus: your first message of the day will grant some Codey Coins\n' +
          ' • Activity bonus: your first message of every minute will grant some Codey Coins.'
      },
      {
        name: 'What Can I Do With Codey Coins?',
        value:
          'You can use Codey coins to:\n' +
          ' • Play Casino games such as Blackjack:\n' +
          ' • Buy CSC Swag (more info to come!)'
      }
    );

  async onRun(message: CommandoMessage): Promise<Message> {
    // show embed
    return message.channel.send(this.infoEmbed);
  }
}

export default CoinInfo;
