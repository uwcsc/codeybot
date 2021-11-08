import { Collection, Message, MessageEmbed, MessageReaction, Snowflake, User } from 'discord.js';
import { CommandoClient, CommandoMessage } from 'discord.js-commando';
import { BaseCommand } from '../../utils/commands';
import {
  BlackjackAction,
  BlackjackHand,
  BlackjackStage,
  CardSuit,
  endGame,
  GameState,
  performGameAction,
  startGame
} from '../../components/games/blackjack';
import { getEmojiByName } from '../../components/emojis';

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
          default: 10
        }
      ]
    });

    this.amount = 10;
    this.playerId = '';
    this.channelId = '';
  }

  getSuitEmoji(suit: string): string {
    switch (suit) {
      case CardSuit.SPADES:
        return '♤';
      case CardSuit.HEARTS:
        return '♡';
      case CardSuit.CLUBS:
        return '♧';
      case CardSuit.DIAMONDS:
        return '♢';
      default:
        return '';
    }
  }

  private getHandDisplayString(hand: BlackjackHand): string {
    return hand.map((card) => `${card.text}${this.getSuitEmoji(card.suite)}`).join(' ');
  }

  private getPlayerDisplayString(hand: BlackjackHand): string {
    return `Hand: ${this.getHandDisplayString(hand)}`;
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
    if (game.stage === BlackjackStage.DONE && game.amountWon < game.bet) {
      return 'RED';
    } else if (game.stage === BlackjackStage.DONE && game.amountWon >= game.bet) {
      return 'GREEN';
    }
    return 'YELLOW';
  }

  private getDescriptionFromGame(game: GameState): string {
    const amountDiff = Math.abs(game.amountWon - game.bet);
    if (game.stage === BlackjackStage.DONE) {
      if (game.surrendered) {
        return `You surrendered and lost ${amountDiff} Codey coin(s) ${getEmojiByName('codeySad')}.`;
      }
      if (game.amountWon < game.bet) {
        return `You lost ${amountDiff} Codey coin(s) ${getEmojiByName('codeySad')}, better luck next time!`;
      }
      if (game.amountWon >= game.bet) {
        return `You won ${amountDiff} Codey coin(s) ${getEmojiByName('codeyLove')}, keep your win streak going!`;
      }
    }
    return 'Press 🇸 to stand, 🇭 to hit, or 🇶 to quit.';
  }

  private getEmbedFromGame(game: GameState): MessageEmbed {
    const embed = new MessageEmbed().setTitle('Blackjack');
    embed.setColor(this.getEmbedColourFromGame(game));
    embed.addField(`Bet: ${game.bet} 🪙`, this.getDescriptionFromGame(game));
    embed.addField(`Player: ${game.playerValue.join(' or ')}`, this.getPlayerDisplayString(game.playerCards));
    embed.addField(`Dealer: ${game.dealerValue.join(' or ')}`, this.getPlayerDisplayString(game.dealerCards));

    return embed;
  }

  private async handlePlayerAction(gameMessage: Message) {
    const reactFilter = (reaction: MessageReaction, user: User) => this.reactFilter(reaction, user, this.playerId);
    const reactCollector = await gameMessage.awaitReactions(reactFilter, { max: 1, time: 60000, errors: ['time'] });
    return await this.performActionFromReaction(reactCollector, gameMessage);
  }

  async onRun(message: CommandoMessage, args: { amount: number }): Promise<Message> {
    const { amount } = args;
    const { author, channel } = message;
    this.amount = amount;
    this.playerId = author.id;
    this.channelId = channel.id;

    // intialize the game
    let game = startGame(this.amount, author.id, this.channelId);
    if (!game) {
      endGame(this.playerId);
      return message.reply('please finish your current game before starting another one!');
    }

    // show game initial state and setup reactions
    const msg = await message.reply(this.getEmbedFromGame(game));
    msg.react('🇸');
    msg.react('🇭');
    msg.react('🇶');

    // keep handling player action until game is done
    while (game && game?.stage != BlackjackStage.DONE) {
      try {
        game = await this.handlePlayerAction(msg);
      } catch {
        if (game) {
          game = {
            ...game,
            stage: BlackjackStage.DONE,
            surrendered: true
          };
        }
        await message.reply("you didn't perform an action within the time limit, please start another game!");
      }

      if (!game) {
        endGame(this.playerId);
        return message.reply("something went wrong, please try again later! Don't worry, you didn't lose any coins.");
      }
      await msg.edit(this.getEmbedFromGame(game));
    }

    // end the game
    endGame(this.playerId);
    return msg;
  }
}

export default BlackjackCommand;
