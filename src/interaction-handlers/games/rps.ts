import { InteractionHandler, InteractionHandlerTypes, PieceContext } from '@sapphire/framework';
import { ButtonInteraction, CommandInteraction, Message, MessagePayload } from 'discord.js';
import { RpsGame, RpsGameSign, rpsGameTracker } from '../../components/games/rps';

export class RpsHandler extends InteractionHandler {
  public constructor(ctx: PieceContext, options: InteractionHandler.Options) {
    super(ctx, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.Button,
    });
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  // Get the game info and the interaction type
  public override parse(interaction: ButtonInteraction) {
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
      gameId,
      sign: gameSign,
    });
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public async run(_interaction: ButtonInteraction, result: { gameId: number; sign: RpsGameSign }) {
    rpsGameTracker.runFuncOnGame(result.gameId, (game) => {
      game.state.player1Sign = result.sign;
      if (game.gameMessage instanceof Message) {
        game.gameMessage.edit(<MessagePayload>game.getGameResponse());
      } else if (game.gameMessage instanceof CommandInteraction) {
        game.gameMessage.editReply(<MessagePayload>game.getGameResponse());
      }
    });
  }
}
