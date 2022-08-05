import { container } from '@sapphire/framework';
import { MessageEmbed } from 'discord.js';
import {
  CodeyCommandDetails,
  CodeyCommandResponseType,
  SapphireMessageExecuteType,
  SapphireMessageResponse
} from '../../codeyCommand';
import { EMBED_COLOUR } from '../../utils/embeds';

// Get information about coin
const infoEmbed = new MessageEmbed()
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
      • Buy virtual CSC Swag in the server (more info to come!)`
    }
  );

const coinInfoExecuteCommand: SapphireMessageExecuteType = async (
  _client,
  _messageFromUser,
  _args
): Promise<SapphireMessageResponse> => {
  return infoEmbed;
};

export const coinInfoCommandDetails: CodeyCommandDetails = {
  name: 'info',
  aliases: ['information, i'],
  description: 'Get info about CodeyCoin.',
  detailedDescription: `**Examples:**
\`${container.botPrefix}coin info\`
\`${container.botPrefix}coin information\`
\`${container.botPrefix}coin i\``,

  isCommandResponseEphemeral: false,
  messageWhenExecutingCommand: 'Getting information about coin:',
  executeCommand: coinInfoExecuteCommand,
  codeyCommandResponseType: CodeyCommandResponseType.EMBED,

  options: [],
  subcommandDetails: {}
};
