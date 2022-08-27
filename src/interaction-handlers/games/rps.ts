import { InteractionHandler, InteractionHandlerTypes, PieceContext } from '@sapphire/framework';
import type { ButtonInteraction } from 'discord.js';
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
    const parsedCustomId = interaction.customId.split('_');
    const sign = parsedCustomId[1];
    const gameId = <number>(<unknown>parsedCustomId[2]);

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
      game: rpsGameTracker.getGameFromId(gameId),
      sign: gameSign,
    });
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public async run(interaction: ButtonInteraction, result: { game: RpsGame; sign: RpsGameSign }) {
    await interaction.reply({
      content: 'Hello from a button interaction handler!',
      // Let's make it so only the person who pressed the button can see this message!
      ephemeral: true,
    });
  }
}
