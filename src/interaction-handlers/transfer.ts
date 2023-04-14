import { InteractionHandler, InteractionHandlerTypes, PieceContext } from '@sapphire/framework';
import { Option } from '@sapphire/result';
import { ButtonInteraction } from 'discord.js';
import { getEmojiByName } from '../components/emojis';
import { TransferSign, TransferResult, transferTracker } from '../components/coin';
import { updateMessageEmbed } from '../utils/embeds';

export class TransferHandler extends InteractionHandler {
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
        transferId: string;
        sign: TransferSign;
      }> {
    // interaction.customId should be in the form "transfer-{check|x}-{transfer id} as in src/components/coin.ts"
    if (!interaction.customId.startsWith('transfer')) return this.none();
    const parsedCustomId = interaction.customId.split('-');
    const sign = parsedCustomId[1];
    const transferId = parsedCustomId[2];

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
      transferId: transferId,
      sign: transferSign,
    });
  }
  public async run(
    interaction: ButtonInteraction,
    result: { transferId: string; sign: TransferSign },
  ): Promise<void> {
    const transfer = transferTracker.getTransferFromId(result.transferId);
    if (!transfer) {
      throw new Error('Transfer with given id does not exist');
    }
    // only receiver can confirm the transfer
    if (interaction.user.id !== transfer.state.receiver.id) {
      await interaction.reply({
        content: `This isn't your transfer! ${getEmojiByName('codey_angry')}`,
        ephemeral: true, // other users do not see this message
      });
      return;
    }
    transferTracker.runFuncOnTransfer(result.transferId, async (transfer) => {
      // set the result of the transfer
      switch (result.sign) {
        case TransferSign.Accept:
          transfer.state.result = TransferResult.Confirmed;
          break;
        case TransferSign.Decline:
          transfer.state.result = TransferResult.Rejected;
          break;
        default:
          transfer.state.result = TransferResult.Pending;
      }
      // update the balances of the sender/receiver as per the transfer result
      await transferTracker.endTransfer(result.transferId);
      const message = await transfer.getTransferResponse();
      updateMessageEmbed(transfer.transferMessage, message);
    });
  }
}
