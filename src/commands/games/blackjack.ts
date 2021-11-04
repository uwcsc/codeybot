import { Message, MessageEmbed } from 'discord.js';
import { CommandoClient, CommandoMessage } from 'discord.js-commando';
import { BaseCommand } from '../../utils/commands';
import { getCoinBalanceByUserId } from '../../components/coin';
import { blackjackGamesByUser, BlackjackHand, CardSuit, startGame } from '../../components/games/blackjack';

class BlackjackCommand extends BaseCommand {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'blackjack',
      aliases: ['bj'],
      group: 'games',
      memberName: 'blackjack',
      description: 'Start a Blackjack game to win some Codey coins!',
      examples: [`${client.commandPrefix}blackjack 100`, `${client.commandPrefix}bj 100`],
      args: [
        {
          key: 'amount',
          prompt: `enter the amount you want to bet.`,
          type: 'integer',
          default: 1
        }
      ]
    });
  }

  getSuitEmoji(suit: string): string {
    switch (suit) {
      case CardSuit.SPADES:
        return '♠️';
      case CardSuit.HEARTS:
        return '♥️';
      case CardSuit.CLUBS:
        return '♣️';
      case CardSuit.DIAMONDS:
        return '♦️';
      default:
        return '';
    }
  }

  getHandDisplayString(hand: BlackjackHand): string {
    return hand.map((card) => `${card.text}${this.getSuitEmoji(card.suite)}`).join(' ');
  }

  getPlayerDisplayString(hand: BlackjackHand, value: number[]): string {
    const handStr = `Hand: ${this.getHandDisplayString(hand)}`;
    const valueStr = `Value: ${value.join(' or ')}`;
    return `${handStr}\n${valueStr}`;
  }

  async onRun(message: CommandoMessage, args: { amount: number }): Promise<Message> {
    const { amount } = args;
    const { author } = message;

    const gameInProgress = blackjackGamesByUser.has(author.id);
    if (gameInProgress) {
      return message.reply('please finish your current game before starting another one!');
    }

    const game = startGame(amount);

    const embed = new MessageEmbed().setTitle('Blackjack');

    embed.addField('Stage', game.stage);
    embed.addField('Bet', game.bet);
    embed.addField('Dealer', this.getPlayerDisplayString(game.dealerCards, game.dealerValue));
    embed.addField('Player', this.getPlayerDisplayString(game.playerCards, game.playerValue));

    return message.reply(embed);
  }
}

export default BlackjackCommand;
