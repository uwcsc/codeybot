import { interviewerDomainCommandDetails } from '../../commandDetails/interviewer/domain';
import {
  InteractionHandler,
  InteractionHandlerTypes,
  PieceContext,
  container,
  Maybe,
  Awaitable
} from '@sapphire/framework';
import type { SelectMenuInteraction } from 'discord.js';

export class MenuHandler extends InteractionHandler {
  public constructor(ctx: PieceContext, options: InteractionHandler.Options) {
    super(ctx, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.SelectMenu
    });
  }

  public override parse(interaction: SelectMenuInteraction): Awaitable<Maybe<unknown>> {
    if (interaction.customId !== 'interviewer-domain') return this.none();

    return this.some();
  }

  public async run(interaction: SelectMenuInteraction): Promise<void> {
    const { client } = container;
    const response = await interviewerDomainCommandDetails.executeCommand!(
      client,
      interaction,
      {},
      undefined,
      interaction.values
    );

    console.log('response', response);
    await interaction.reply({
      content: response.toString(),
      ephemeral: true
    });
  }
}
