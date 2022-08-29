import {
  InteractionHandler,
  InteractionHandlerTypes,
  Maybe,
  PieceContext,
} from '@sapphire/framework';
import { ButtonInteraction, CommandInteraction, Message, MessagePayload } from 'discord.js';
import { getEmojiByName } from '../../components/emojis';
import { getCodeyRpsSign, RpsGameSign, rpsGameTracker } from '../../components/games/rps';

export class RpsHandler extends InteractionHandler {
  public constructor(ctx: PieceContext, options: InteractionHandler.Options) {
    super(ctx, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.Button,
    });
  }

  // Get the game info and the interaction type
  public override parse(interaction: ButtonInteraction): Maybe<{
    gameId: number;
    sign: RpsGameSign;
  }> {
    if (!interaction.customId.startsWith('rps')) return this.none();
    const parsedCustomId = interaction.customId.split('-');
    const sign = parsedCustomId[1];
    const gameId = parseInt(parsedCustomId[2]);

    let gameSign: RpsGameSign;
    switch (sign) {
      case 'rock':
        gameSign = RpsGameSign.Rock;
        break;
      case 'paper':
        gameSign = RpsGameSign.Paper;
        break;
      case 'scissors':
        gameSign = RpsGameSign.Scissors;
        break;
      default:
        gameSign = RpsGameSign.Pending;
        break;
    }
    return this.some({
      gameId: gameId,
      sign: gameSign,
    });
  }

  public async run(
    interaction: ButtonInteraction,
    result: { gameId: number; sign: RpsGameSign },
  ): Promise<void> {
    if (interaction.user.id !== rpsGameTracker.getGameFromId(result.gameId)!.state.player1Id) {
      return await interaction.reply({
        content: `This isn't your game! ${getEmojiByName('codeyAngry')}`,
        ephemeral: true,
      });
    }
    rpsGameTracker.runFuncOnGame(result.gameId, (game) => {
      game.state.player1Sign = result.sign;
      // If single player, get Codey's sign
      if (!game.state.player2Id) {
        game.state.player2Sign = getCodeyRpsSign();
        game.setStatus(undefined);
      }
      if (game.gameMessage instanceof Message) {
        game.gameMessage.edit(<MessagePayload>game.getGameResponse());
      } else if (game.gameMessage instanceof CommandInteraction) {
        game.gameMessage.editReply(<MessagePayload>game.getGameResponse());
      }
    });
    rpsGameTracker.endGame(result.gameId);
  }
}
