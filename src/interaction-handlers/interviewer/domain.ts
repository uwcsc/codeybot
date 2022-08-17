import { interviewerDomainCommandDetails } from '../../commandDetails/interviewer/domain';
import { InteractionHandler, InteractionHandlerTypes, PieceContext, container } from '@sapphire/framework';
import type { SelectMenuInteraction } from 'discord.js';

export class MenuHandler extends InteractionHandler {
  public constructor(ctx: PieceContext, options: InteractionHandler.Options) {
    super(ctx, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.SelectMenu
    });
  }

  public override parse(interaction: SelectMenuInteraction) {
    if (interaction.customId !== 'interviewer-domain') return this.none();

    return this.some();
  }

  public async run(interaction: SelectMenuInteraction) {
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
