import {
  Collection,
  IntegrationEditData,
  Message,
  MessageCollector,
  MessageEmbed,
  MessageReaction,
  ReactionCollector,
  ReactionEmoji,
  Snowflake,
  User
} from 'discord.js';
import { CommandoClient, CommandoMessage } from 'discord.js-commando';
import { BaseCommand } from '../../utils/commands';
import { getCoinBalanceByUserId } from '../../components/coin';
import {
  BlackjackAction,
  blackjackGamesByUser,
  BlackjackHand,
  BlackjackStage,
  CardSuit,
  endGame,
  GameState,
  performGameAction,
  startGame
} from '../../components/games/blackjack';
import { EBADF } from 'constants';

class BlackjackCommand extends BaseCommand {
  private amount: number;
  private playerId: string;
  private channelId: string;

  constructor(client: CommandoClient) {
    super(client, {
      name: 'blackjack',
      aliases: ['blj', 'bj'],
      group: 'games',
      memberName: 'blackjack',
      description: 'Start a Blackjack game to win some Codey coins!',
      examples: [`${client.commandPrefix}blackjack 100`, `${client.commandPrefix}blj 100`],
      args: [
        {
          key: 'amount',
          prompt: `enter the amount you want to bet.`,
          type: 'integer',
          default: 1
        }
      ]
    });

    this.amount = 0;
    this.playerId = '';
    this.channelId = '';
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

  private getHandDisplayString(hand: BlackjackHand): string {
    return hand.map((card) => `${card.text}${this.getSuitEmoji(card.suite)}`).join(' ');
  }

  private getPlayerDisplayString(hand: BlackjackHand, value: number[]): string {
    const handStr = `Hand: ${this.getHandDisplayString(hand)}`;
    const valueStr = `Value: ${value.join(' or ')}`;
    return `${handStr}\n${valueStr}`;
  }

  private reactFilter(reaction: MessageReaction, user: User, authorId: string): boolean {
    return ['🇸', '🇭', '🇶'].includes(reaction.emoji.name) && user.id === authorId;
  }

  private async performActionFromReaction(
    collected: Collection<string | Snowflake, MessageReaction>,
    gameMessage: Message
  ): Promise<GameState | null> {
    const reaction = collected.first();
    if (reaction) await gameMessage.reactions.resolve(reaction)?.users.remove(this.playerId);
    switch (reaction?.emoji.name) {
      case '🇸':
        return performGameAction(this.playerId, BlackjackAction.STAND);
      case '🇭':
        return performGameAction(this.playerId, BlackjackAction.HIT);
      case '🇶':
        return performGameAction(this.playerId, BlackjackAction.QUIT);
      default:
        return null;
    }
  }

  private getEmbedColourFromGame(game: GameState): string {
    if (game.stage === BlackjackStage.DONE && game.amountWon === 0) {
      return 'RED';
    } else if (game.stage === BlackjackStage.DONE && game.amountWon > 0) {
      return 'GREEN';
    }
    return 'YELLOW';
  }

  private getEmbedFromGame(game: GameState): MessageEmbed {
    const embed = new MessageEmbed().setTitle('Blackjack');
    embed.setColor(this.getEmbedColourFromGame(game));
    embed.addField('Bet', game.bet);
    embed.addField('Player', this.getPlayerDisplayString(game.playerCards, game.playerValue));
    embed.addField('Dealer', this.getPlayerDisplayString(game.dealerCards, game.dealerValue));

    return embed;
  }

  private async handlePlayerAction(gameMessage: Message) {
    const reactFilter = (reaction: MessageReaction, user: User) => this.reactFilter(reaction, user, this.playerId);
    const reactCollector = await gameMessage.awaitReactions(reactFilter, { max: 1, time: 60000 });
    return await this.performActionFromReaction(reactCollector, gameMessage);
  }

  async onRun(message: CommandoMessage, args: { amount: number }): Promise<Message> {
    const { amount } = args;
    const { author, channel } = message;
    this.amount = amount;
    this.playerId = author.id;
    this.channelId = channel.id;

    let game = startGame(amount, author.id, channel.id);
    if (!game) {
      endGame(this.playerId);
      return message.reply('please finish your current game before starting another one!');
    }
    const msg = await message.reply(this.getEmbedFromGame(game));
    msg.react('🇸');
    msg.react('🇭');
    msg.react('🇶');

    while (game?.stage != BlackjackStage.DONE) {
      game = await this.handlePlayerAction(msg);
      if (!game) {
        endGame(this.playerId);
        return message.reply("something went wrong, please try again later! Don't worry, you didn't lose any coins.");
      }
      await msg.edit(this.getEmbedFromGame(game));
    }

    endGame(this.playerId);
    return msg;
  }
}

export default BlackjackCommand;
