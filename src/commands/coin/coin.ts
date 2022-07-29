// import { ApplyOptions } from '@sapphire/decorators';
// import { Args, container } from '@sapphire/framework';
// import { SubCommandPluginCommand, SubCommandPluginCommandOptions } from '@sapphire/plugin-subcommands';
// import { Message, MessageEmbed } from 'discord.js';

import { Command, container } from '@sapphire/framework';
import { Message, Permissions, User } from 'discord.js';
import {
  CodeyCommand,
  CodeyCommandDetails,
  CodeyCommandOptionType,
  CodeyCommandResponseType,
  SapphireMessageExecuteType,
  SapphireMessageResponse
} from '../../codeyCommand';
import {
  adjustCoinBalanceByUserId,
  getCoinBalanceByUserId,
  updateCoinBalanceByUserId,
  UserCoinEvent
} from '../../components/coin';
import { EMBED_COLOUR } from '../../utils/embeds';

// Adjust coin balance
const coinAdjustExecuteCommand: SapphireMessageExecuteType = async (
  client,
  messageFromUser,
  args
): Promise<SapphireMessageResponse> => {
  if (!(<Readonly<Permissions>>messageFromUser.member?.permissions).has('ADMINISTRATOR')) return '';

  // First mandatory argument is user
  const user = <User>args['user']
  if (!user) {
    throw new Error('please enter a valid user mention or ID for balance adjustment.');
  }

  // Second mandatory argument is amount
  const amount = args['amount'];
  if (!amount) {
    throw new Error('please enter a valid amount to adjust.');
  }

  // Optional argument is reason
  const reason = args['reason'];

  // Adjust coin balance
  await adjustCoinBalanceByUserId(
    user.id,
    <number> amount,
    UserCoinEvent.AdminCoinAdjust,
    <string>(reason ? reason : ''),
    client.user?.id,
  );
  // Get new balance
  const newBalance = await getCoinBalanceByUserId(user.id);

  return `${user.username} now has ${newBalance} Codey coins 🪙.`;
}

const coinAdjustCommandDetails: CodeyCommandDetails = {
  name: 'adjust',
  aliases: [],
  description: 'Adjust the coin balance of a user.',
  detailedDescription: `**Examples:**
\`${container.botPrefix}coin adjust @Codey 100\`
\`${container.botPrefix}coin adjust @Codey -100 Codey broke.\``,

  isCommandResponseEphemeral: true,
  messageWhenExecutingCommand: 'Adjusting coin balance...',
  executeCommand: coinAdjustExecuteCommand,
  codeyCommandResponseType: CodeyCommandResponseType.STRING,

  options: [
    {
      name: 'user',
      description: 'The user to adjust the balance of,',
      type: CodeyCommandOptionType.USER,
      required: true,
    },
    {
      name: 'amount',
      description: 'The amount to adjust the balance of the specified user to,',
      type: CodeyCommandOptionType.NUMBER,
      required: true,
    },
    {
      name: 'reason',
      description: 'The reason why we are adjusting the balance,',
      type: CodeyCommandOptionType.STRING,
      required: false,
    },
  ],
  subcommandDetails: {}
};

// Get coin balance
const coinBalanceExecuteCommand: SapphireMessageExecuteType = async (
  client,
  _messageFromUser,
  _args
): Promise<SapphireMessageResponse> => {
  const balance = await getCoinBalanceByUserId(client.user?.id!);
  // Show coin balance
  return `You have ${balance} Codey coins 🪙.`;
}

const coinBalanceCommandDetails: CodeyCommandDetails = {
  name: 'balance',
  aliases: ['bal'],
  description: 'Get your coin balance.',
  detailedDescription: `**Examples:**
\`${container.botPrefix}coin bal\`
\`${container.botPrefix}coin balance\``,

  isCommandResponseEphemeral: true,
  messageWhenExecutingCommand: 'Getting your coin balance...',
  executeCommand: coinBalanceExecuteCommand,
  codeyCommandResponseType: CodeyCommandResponseType.STRING,

  options: [],
  subcommandDetails: {}
};


const coinCommandDetails: CodeyCommandDetails = {
  name: 'coin',
  aliases: [],
  description: 'Handles coin functions',
  detailedDescription: `**Examples:**
\`${container.botPrefix}coin adjust @Codey 100\`
\`${container.botPrefix}coin adjust @Codey -100 Codey broke.\`
\`${container.botPrefix}coin\`
\`${container.botPrefix}bal\`
\`${container.botPrefix}balance\`
\`${container.botPrefix}coin check @Codey\`
\`${container.botPrefix}coin c @Codey\`
\`${container.botPrefix}coin info\`
\`${container.botPrefix}coin i\`
\`${container.botPrefix}coin update @Codey 100\`
\`${container.botPrefix}coin update @Codey 0 Reset Codey's balance.\``,
  options: [],
  subcommandDetails: {
    adjust: coinAdjustCommandDetails,
    balance: coinBalanceCommandDetails,
  }
}

export class CoinCommand extends CodeyCommand {
  details=coinCommandDetails;

  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      aliases: coinCommandDetails.aliases,
      description: coinCommandDetails.description,
      detailedDescription: coinCommandDetails.detailedDescription
    });
  }
}

// export class CoinCommand extends SubCommandPluginCommand {
//   async adjust(message: Message, args: Args): Promise<Message | void> {
//     if (!message.member?.permissions.has('ADMINISTRATOR')) return;

//     // First mandatory argument is user
//     const user = await args.pick('user').catch(() => 'please enter a valid user mention or ID for balance adjustment.');
//     if (typeof user === 'string') return message.reply(user);

//     // Second mandatory argument is amount
//     const amount = await args.pick('integer').catch(() => 'please enter a valid amount to adjust.');
//     if (typeof amount === 'string') return message.reply(amount);

//     // Third optional argument is reason
//     const reason = args.finished ? '' : await args.rest('string');

//     // Adjust coin balance
//     await adjustCoinBalanceByUserId(
//       user.id,
//       amount,
//       UserCoinEvent.AdminCoinAdjust,
//       reason ? reason : null,
//       message.author.id
//     );
//     // Get new balance
//     const newBalance = await getCoinBalanceByUserId(user.id);
//     return message.reply(`${user.username} now has ${newBalance} Codey coins 🪙.`);
//   }

//   async balance(message: Message): Promise<Message> {
//     // Get coin balance
//     const balance = await getCoinBalanceByUserId(message.author.id);
//     // Show coin balance
//     return message.reply(`you have ${balance} Codey coins 🪙.`);
//   }

//   async check(message: Message, args: Args): Promise<Message> {
//     // Mandatory argument is user
//     const user = await args.rest('user').catch(() => 'please enter a valid user mention or ID for balance check.');
//     if (typeof user === 'string') return message.reply(user);

//     // Get coin balance
//     const balance = await getCoinBalanceByUserId(user.id);
//     // Show coin balance
//     return message.reply(`${user.username} has ${balance} Codey coins 🪙.`);
//   }

//   private infoEmbed = new MessageEmbed()
//     .setColor(EMBED_COLOUR)
//     .setTitle('🪙   About Codey Coin   🪙')
//     .setThumbnail('https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/240/twitter/282/coin_1fa99.png') // Thumbnail, if needed?
//     .setDescription(`Codey coins are rewarded for being active in CSC's events and discord!`)
//     .addFields(
//       {
//         name: '🪙   How Can I Obtain Codey Coins?',
//         value: `Earn Codey coins by:
//         • Participating in CSC events
//         • Being active on Discord
//         ---Daily bonus - your first message of the day on CSC's Discord will grant some Codey coins
//         ---Activity bonus - your first message of every 5 minutes on CSC's Discord will grant some Codey coins`
//       },
//       {
//         name: '🪙   What Can I Do With Codey Coins?',
//         value: `Use Codey coins to:
//         • Play Casino games such as Blackjack
//         • Buy CSC Swag (more info to come!)`
//       }
//     );

//   async information(message: Message): Promise<Message> {
//     // show embed
//     return message.channel.send({ embeds: [this.infoEmbed] });
//   }

//   async update(message: Message, args: Args): Promise<Message | void> {
//     if (!message.member?.permissions.has('ADMINISTRATOR')) return;

//     // First mandatory argument is user
//     const user = await args.pick('user').catch(() => 'please enter a valid user mention or ID for balance update.');
//     if (typeof user === 'string') return message.reply(user);

//     // Second mandatory argument is amount
//     const amount = await args.pick('integer').catch(() => 'please enter a valid new balance.');
//     if (typeof amount === 'string') return message.reply(amount);

//     // Third optional argument is reason
//     const reason = args.finished ? '' : await args.rest('string');

//     // Update coin balance
//     await updateCoinBalanceByUserId(
//       user.id,
//       amount,
//       UserCoinEvent.AdminCoinUpdate,
//       reason ? reason : null,
//       message.author.id
//     );
//     // Get new balance
//     const newBalance = await getCoinBalanceByUserId(user.id);
//     return message.reply(`${user.username} now has ${newBalance} Codey coins 🪙.`);
//   }
// }
