import { InteractionHandler, InteractionHandlerTypes, PieceContext } from '@sapphire/framework';
import { ButtonInteraction } from 'discord.js';
import { Option } from '@sapphire/result';
import { getEmojiByName } from '../../components/emojis';
import { getCodeyRpsSign, RpsGameSign, rpsGameTracker } from '../../components/games/rps';
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
    if (
      interaction.user.id !== rpsGameTracker.getGameFromId(result.gameId)!.state.player1Id &&
      interaction.user.id !== rpsGameTracker.getGameFromId(result.gameId)!.state.player2Id
    ) {
      await interaction.reply({
        content: `This isn't your game! ${getEmojiByName('codey_angry')}`,
        ephemeral: true,
      });

      await interaction.deferUpdate();
    }

    let denySignChange = false;

    rpsGameTracker.runFuncOnGame(result.gameId, (game) => {
      if (interaction.user.id === rpsGameTracker.getGameFromId(result.gameId)!.state.player1Id) {
        if (game.state.player1Sign !== RpsGameSign.Pending) {
          denySignChange = true;
          return;
        }
        game.state.player1Sign = result.sign;
        // If single player, get Codey's sign
        if (!game.state.player2Id) {
          game.state.player2Sign = getCodeyRpsSign();
        }
      } else {
        if (game.state.player2Sign !== RpsGameSign.Pending) {
          denySignChange = true;
          return;
        } else {
          game.state.player2Sign = result.sign;
        }
      }
      game.setStatus(undefined);
      updateMessageEmbed(game.gameMessage, game.getGameResponse());
    });

    // Denies the interaction from changing anything if the user already picked an option
    if (denySignChange) {
      console.log("sign changed denied");
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

