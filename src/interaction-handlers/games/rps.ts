import { InteractionHandler, InteractionHandlerTypes, PieceContext } from '@sapphire/framework';
import { ButtonInteraction } from 'discord.js';
import { Option } from '@sapphire/result';
import { getEmojiByName } from '../../components/emojis';
import {
  getCodeyRpsSign,
  RpsGameAction,
  RpsGameEndReason,
  RpsGameStatus,
  rpsGameTracker,
} from '../../components/games/rps';
import { updateMessageEmbed } from '../../utils/embeds';

export class RpsHandler extends InteractionHandler {
  public constructor(ctx: PieceContext, options: InteractionHandler.Options) {
    super(ctx, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.Button,
    });
  }

  // Get the game info and the interaction type
  public override parse(interaction: ButtonInteraction):
    | Option.None
    | Option.Some<{
        gameId: number;
        action: RpsGameAction;
      }> {
    if (!interaction.customId.startsWith('rps')) return this.none();
    const parsedCustomId = interaction.customId.split('-');
    const buttonID = parsedCustomId[1];
    const gameId = parseInt(parsedCustomId[2]);

    let gameAction: RpsGameAction;
    switch (buttonID) {
      case 'rock':
        gameAction = RpsGameAction.Rock;
        break;
      case 'paper':
        gameAction = RpsGameAction.Paper;
        break;
      case 'scissors':
        gameAction = RpsGameAction.Scissors;
        break;
      case 'acceptduel':
        gameAction = RpsGameAction.AcceptDuel;
        break;
      case 'rejectduel':
        gameAction = RpsGameAction.RejectDuel;
        break;
      default:
        gameAction = RpsGameAction.Pending;
        break;
    }
    return this.some({
      gameId: gameId,
      action: gameAction,
    });
  }

  public async run(
    interaction: ButtonInteraction,
    result: { gameId: number; action: RpsGameAction },
  ): Promise<void> {
    console.log(result.action);
    if (result.action === RpsGameAction.AcceptDuel || result.action === RpsGameAction.RejectDuel) {
      if (interaction.user.id !== rpsGameTracker.getGameFromId(result.gameId)!.state.player2Id) {
        await interaction.reply({
          content: `This isn't your duel! ${getEmojiByName('codey_angry')}`,
          ephemeral: true,
        });

        await interaction.deferUpdate();
      } else if (result.action === RpsGameAction.AcceptDuel) {
        rpsGameTracker.runFuncOnGame(result.gameId, (game) => {
          game.state.player1Sign = RpsGameAction.Pending;
          game.state.player2Sign = RpsGameAction.Pending;
          updateMessageEmbed(game.gameMessage, game.getGameEmbed());
        });
        interaction.deferUpdate();
      } else {
        rpsGameTracker.runFuncOnGame(result.gameId, (game) => {
          game.state.status = RpsGameStatus.DuelRejected;
          updateMessageEmbed(game.gameMessage, game.getDuelEmbed());
        });
        interaction.deferUpdate();
        rpsGameTracker.endGame(result.gameId);
      }
    } else if (
      interaction.user.id !== rpsGameTracker.getGameFromId(result.gameId)!.state.player1Id &&
      interaction.user.id !== rpsGameTracker.getGameFromId(result.gameId)!.state.player2Id
    ) {
      await interaction.reply({
        content: `This isn't your game! ${getEmojiByName('codey_angry')}`,
        ephemeral: true,
      });

      await interaction.deferUpdate();
    } else {
      let denySignChange = false;

      rpsGameTracker.runFuncOnGame(result.gameId, (game) => {
        if (interaction.user.id === rpsGameTracker.getGameFromId(result.gameId)!.state.player1Id) {
          if (game.state.player1Sign !== RpsGameAction.Pending) {
            denySignChange = true;
            return;
          }
          game.state.player1Sign = result.action;
          // If single player, get Codey's sign
          if (!game.state.player2Id) {
            game.state.player2Sign = getCodeyRpsSign();
          }
        } else {
          if (game.state.player2Sign !== RpsGameAction.Pending) {
            denySignChange = true;
            return;
          } else {
            game.state.player2Sign = result.action;
          }
        }
        game.setStatus(RpsGameEndReason.GameCompleted);
        updateMessageEmbed(game.gameMessage, game.getGameEmbed());
      });

      // Denies the interaction from changing anything if the user already picked a move
      if (denySignChange) {
        await interaction.reply({
          content: `You already picked your move! ${getEmojiByName('codey_angry')}`,
          ephemeral: true,
        });
      } else {
        interaction.deferUpdate();
        rpsGameTracker.endGame(result.gameId);
      }
    }
  }
}
