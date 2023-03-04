import {
  InteractionHandler,
  InteractionHandlerTypes,
  Maybe,
  PieceContext,
} from '@sapphire/framework';
import { ButtonInteraction } from 'discord.js';
import { getEmojiByName } from '../components/emojis';
import { TransferSign } from '../components/coin';

export class TransferHandler extends InteractionHandler {
  public constructor(ctx: PieceContext, options: InteractionHandler.Options) {
    super(ctx, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.Button,
    });
  }
  // Get the game info and the interaction type
  public override parse(interaction: ButtonInteraction): Maybe<{
    receiverId: string;
    sign: TransferSign;
  }> {
    // interaction.customId should be in the form "transfer-{check|x}-{receiver id}-{sender id} as in src/components/coin.ts"
    if (!interaction.customId.startsWith('transfer')) return this.none();
    const parsedCustomId = interaction.customId.split('-');
    const sign = parsedCustomId[1];
    const receiverId = parsedCustomId[2];
    const senderId = parsedCustomId[3];

    let transferSign: TransferSign;
    switch (sign) {
      case 'check':
        transferSign = TransferSign.Accept;
        break;
      case 'x':
        transferSign = TransferSign.Decline;
        break;
      default:
        transferSign = TransferSign.Pending;
        break;
    }
    return this.some({
      receiverId: receiverId,
      sign: transferSign,
      senderId: senderId,
    });
  }
  public async run(
    interaction: ButtonInteraction,
    result: { receiverId: string; senderId: string; sign: TransferSign },
  ): Promise<void> {
    if (interaction.user.id !== result.receiverId) {
      return await interaction.reply({
        content: `This isn't your transfer! ${getEmojiByName('codey_angry')}`,
        ephemeral: true,
      });
    }
  }
}
