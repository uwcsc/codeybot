import {
  InteractionHandler,
  InteractionHandlerTypes,
  Maybe,
  PieceContext,
} from '@sapphire/framework';
import { ButtonInteraction } from 'discord.js';
import { getEmojiByName } from '../../components/emojis';
import {
  getCodeyConnectFourSign,
  ConnectFourGameStatus,
  ConnectFourGameSign,
  connectFourGameTracker,
  updateColumn,
} from '../../components/games/connectFour';
import { updateMessageEmbed } from '../../utils/embeds';

export class ConnectFourHandler extends InteractionHandler {
  public constructor(ctx: PieceContext, options: InteractionHandler.Options) {
    super(ctx, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.Button,
    });
  }

  // Get the game info and the interaction type
  public override parse(interaction: ButtonInteraction): Maybe<{
    gameId: number;
    sign: number;
  }> {
    if (!interaction.customId.startsWith('connect4')) return this.none();
    const parsedCustomId = interaction.customId.split('-');
    const sign = parseInt(parsedCustomId[1]);
    const gameId = parseInt(parsedCustomId[2]);

    console.log('sign: ---' + parsedCustomId[1]);

    return this.some({
      gameId: gameId,
      sign: sign,
    });
  }

  public async run(
    interaction: ButtonInteraction,
    result: { gameId: number; sign: ConnectFourGameSign },
  ): Promise<void> {
    if (
      interaction.user.id !== connectFourGameTracker.getGameFromId(result.gameId)!.state.player1Id
    ) {
      return await interaction.reply({
        content: `This isn't your game! ${getEmojiByName('codey_angry')}`,
        ephemeral: true,
      });
    }
    await interaction.deferUpdate();
    connectFourGameTracker.runFuncOnGame(result.gameId, (game) => {
      if (!updateColumn(game.state.columns[result.sign - 1], game.state.player1Sign)) {
        return interaction.reply({
          content: `This column is full! ${getEmojiByName('codey_angry')}`,
          ephemeral: true,
        });
      } else if (
        game.determineStatus(game.state, result.sign - 1) == ConnectFourGameStatus.Pending
      ) {
        console.log("game isn't over yet");
        if (!game.state.player2Id) {
          let codeySign = getCodeyConnectFourSign();
          while (!updateColumn(game.state.columns[codeySign - 1], game.state.player2Sign)) {
            codeySign = getCodeyConnectFourSign();
          }
          game.setStatus(codeySign - 1, undefined);
        }
      }
      game.setStatus(result.sign - 1, undefined);
      updateMessageEmbed(game.gameMessage, game.getGameResponse());
    });
    connectFourGameTracker.endGame(result.gameId);
  }
}
