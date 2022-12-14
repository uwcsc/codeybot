import { coinTransferCommandDetails } from '../../commandDetails/coin/transfer';
import {
  InteractionHandler,
  InteractionHandlerTypes,
  PieceContext,
  container,
  Maybe,
  Awaitable,
} from '@sapphire/framework';
import type { ButtonInteraction } from 'discord.js';

export class MenuHandler extends InteractionHandler {
  //* Constructs the MenuHandler class
  // Taken from:
  // https://www.sapphirejs.dev/docs/Guide/application-commands/interaction-handlers/select-menus */
  public constructor(ctx: PieceContext, options: InteractionHandler.Options) {
    super(ctx, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.Button,
    });
  }

  //*
  // Does any preliminary parsing/handling on the inputs
  //  - Type hint taken from parent method
  // */
  public override parse(interaction: ButtonInteraction): Awaitable<Maybe<unknown>> {
    if (!['accept', 'reject'].includes(interaction.customId)) return this.none();

    return this.some();
  }

  //*
  // Method called when interaction input is received
  // */
  public async run(interaction: ButtonInteraction): Promise<void> {
    const { client } = container;
    const response = await coinTransferCommandDetails.executeCommand!(client, interaction, {});

    await interaction.reply({
      content: response.toString(),
      ephemeral: false,
    });
  }
}
