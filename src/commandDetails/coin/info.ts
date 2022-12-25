import { container } from '@sapphire/framework';
import { MessageEmbed } from 'discord.js';
import {
  CodeyCommandDetails,
  SapphireMessageExecuteType,
  SapphireMessageResponse,
} from '../../codeyCommand';
import { getCoinEmoji } from '../../components/emojis';
import { DEFAULT_EMBED_COLOUR } from '../../utils/embeds';

const coinInfoExecuteCommand: SapphireMessageExecuteType = async (
  _client,
  _messageFromUser,
  _args,
): Promise<SapphireMessageResponse> => {
  // Get information about coin
  const COIN = getCoinEmoji();
  const infoEmbed = new MessageEmbed()
    .setColor(DEFAULT_EMBED_COLOUR)
    .setTitle(`${COIN}   About Codey Coin   ${COIN}`)
    .setThumbnail('https://cdn.discordapp.com/emojis/937096777180516453.webp')
    .setDescription(`Codey coins are rewarded for being active in CSC's events and discord!`)
    .addFields(
      {
        name: `${COIN}   How Can I Obtain Codey Coins?`,
        value: `Earn Codey coins by:
          • Participating in CSC events
          • Being active on Discord
          ---Daily bonus - your first message of the day on CSC's Discord will grant some Codey coins
          ---Activity bonus - your first message of every 5 minutes on CSC's Discord will grant some Codey coins`,
      },
      {
        name: `${COIN}   What Can I Do With Codey Coins?`,
        value: `Use Codey coins to:
          • Play Casino games such as Blackjack
          • Buy virtual CSC Swag in the server (more info to come!)`,
      },
    );
  return { embeds: [infoEmbed] };
};

export const coinInfoCommandDetails: CodeyCommandDetails = {
  name: 'info',
  aliases: ['information, i'],
  description: 'Get info about Codey coin.',
  detailedDescription: `**Examples:**
\`${container.botPrefix}coin info\`
\`${container.botPrefix}coin information\`
\`${container.botPrefix}coin i\``,

  isCommandResponseEphemeral: false,
  messageWhenExecutingCommand: 'Getting information about coin:',
  executeCommand: coinInfoExecuteCommand,
  options: [],
  subcommandDetails: {},
};
