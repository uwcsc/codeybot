import {
  InteractionHandler,
  InteractionHandlerTypes,
  Maybe,
  PieceContext,
} from '@sapphire/framework';
import { ButtonInteraction, CommandInteraction, Message, MessagePayload } from 'discord.js';
import { getEmojiByName } from '../components/emojis';
import { getCodeyRpsSign, RpsGameSign, rpsGameTracker } from '../components/games/rps';
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
    if (!interaction.customId.startsWith('transfer')) return this.none();
    const parsedCustomId = interaction.customId.split('-');
    const sign = parsedCustomId[1];
    const receiverId = parsedCustomId[2];

    let transferSign: TransferSign;
    switch (sign) {
      case 'accept':
        transferSign = TransferSign.Accept;
        break;
      case 'decline':
        transferSign = TransferSign.Decline;
        break;
      default:
        transferSign = TransferSign.Pending;
        break;
    }
    return this.some({
      receiverId: receiverId,
      sign: transferSign,
    });
  }
  public async run(
    interaction: ButtonInteraction,
    result: { receiverId: string; sign: TransferSign },
  ): Promise<void> {
    if (interaction.user.id !== result.receiverId) {
      return await interaction.reply({
        content: `This isn't your transfer! ${getEmojiByName('codey_angry')}`,
        ephemeral: true,
      });
    }
  }
}
