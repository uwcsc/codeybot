import { InteractionHandler, InteractionHandlerTypes, PieceContext } from '@sapphire/framework';
import type { ButtonInteraction } from 'discord.js';

export class ButtonHandler extends InteractionHandler {
  public constructor(ctx: PieceContext, options: InteractionHandler.Options) {
    super(ctx, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.Button,
    });
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public override parse(interaction: ButtonInteraction) {
    if (interaction.customId !== 'my-awesome-button') return this.none();
    return this.some();
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public async run(interaction: ButtonInteraction) {
    await interaction.reply({
      content: 'Hello from a button interaction handler!',
      // Let's make it so only the person who pressed the button can see this message!
      ephemeral: true,
    });
  }
}
