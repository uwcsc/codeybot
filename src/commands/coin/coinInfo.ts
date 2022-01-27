import { Message, MessageEmbed } from 'discord.js';
import { CommandoClient, CommandoMessage } from 'discord.js-commando';
import { BaseCommand } from '../../utils/commands';
import { EMBED_COLOUR } from '../../utils/embeds';

class CoinInfo extends BaseCommand {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'coin-info',
      aliases: ['ci', 'coininfo'],
      group: 'coin',
      memberName: 'coin-info',
      description: 'Info about Codey coin, including ways to get and how to spend Codey coins.',
      examples: [`${client.commandPrefix}coin-info`, `${client.commandPrefix}ci`, `${client.commandPrefix}coininfo`]
    });
  }
  infoEmbed = new MessageEmbed()
    .setColor(EMBED_COLOUR)
    .setTitle('🪙   About Codey Coin   🪙')
    .setThumbnail('https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/240/twitter/282/coin_1fa99.png') // Thumbnail, if needed?
    .setDescription(`Codey coins are rewarded for being active in CSC's events and discord!`)
    .addFields(
      {
        name: '🪙   How Can I Obtain Codey Coins?',
        value: `Earn Codey coins by:
          • Participating in CSC events
          • Being active on Discord
          ---Daily bonus - your first message of the day on CSC's Discord will grant some Codey coins
          ---Activity bonus - your first message of every 5 minutes on CSC's Discord will grant some Codey coins`
      },
      {
        name: '🪙   What Can I Do With Codey Coins?',
        value: `Use Codey coins to:
          • Play Casino games such as Blackjack
          • Buy CSC Swag (more info to come!)`
      }
    );

  async onRun(message: CommandoMessage): Promise<Message> {
    // show embed
    return message.channel.send(this.infoEmbed);
  }
}

export default CoinInfo;
