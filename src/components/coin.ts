import _, { uniqueId } from 'lodash';
import { openDB } from './db';
import { SapphireClient } from '@sapphire/framework';
import {
  Colors,
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
  User,
  ButtonStyle,
  BaseMessageOptions,
} from 'discord.js';
import { SapphireSentMessageType } from '../codeyCommand';
import { pluralize } from '../utils/pluralize';
import { getCoinEmoji, getEmojiByName } from './emojis';

export enum BonusType {
  Daily = 0,
  Activity,
  InterviewerList,
}

export enum UserCoinEvent {
  AdminCoinAdjust,
  AdminCoinUpdate,
  BonusDaily,
  BonusActivity,
  BonusInterviewerList,
  Blackjack,
  RpsLoss,
  RpsDrawAgainstCodey,
  RpsWin,
  CoinTransferReceiver,
  CoinTransferSender,
}

export type Bonus = {
  type: BonusType;
  event: UserCoinEvent;
  amount: number;
  cooldown: number | null;
  isMessageBonus: boolean; // true iff bonus is given when a user sends a message
};

/*
  Bonuses must be listed such that amount is in descending order, so "Only apply the largest bonus." holds in applyBonusByUserId.
  If isMessageBonus is true, then cooldown must not be null.
*/
export const coinBonusMap = new Map<BonusType, Bonus>([
  [
    BonusType.Daily,
    {
      type: BonusType.Daily,
      event: UserCoinEvent.BonusDaily,
      amount: 50,
      cooldown: 24 * 60 * 60 * 1000, // one day in milliseconds
      isMessageBonus: true,
    },
  ],
  [
    BonusType.Activity,
    {
      type: BonusType.Activity,
      event: UserCoinEvent.BonusActivity,
      amount: 1,
      cooldown: 5 * 60 * 1000, // 5 minutes in milliseconds
      isMessageBonus: true,
    },
  ],
  [
    BonusType.InterviewerList,
    {
      type: BonusType.InterviewerList,
      event: UserCoinEvent.BonusInterviewerList,
      amount: 10,
      cooldown: null,
      isMessageBonus: false,
    },
  ],
]);

export interface UserCoinEntry {
  user_id: string;
  balance: number;
}

export interface UserCoinBonus {
  id: string;
  user_id: string;
  bonus_type: number;
  last_granted: Date;
}

export const getCoinBalanceByUserId = async (userId: string): Promise<number> => {
  const db = await openDB();
  // Query user coin balance from DB.
  const res = await db.get('SELECT balance FROM user_coin WHERE user_id = ?', userId);
  // If user doesn't have a balance, default to 0.
  return _.get(res, 'balance', 0);
};

/*
  If user doesn't exist, create row with newBalance as the balance.
  Otherwise, update balance to newBalance.
  The user's balance will be set to 0 if newBalance is negative.
*/
export const updateCoinBalanceByUserId = async (
  userId: string,
  newBalance: number,
  event: UserCoinEvent,
  reason: string | null = null,
  adminId: string | null = null,
): Promise<void> => {
  const oldBalance = await getCoinBalanceByUserId(userId);
  const actualNewBalance = Math.max(newBalance, 0);
  await changeDbCoinBalanceByUserId(userId, oldBalance!, actualNewBalance, event, reason, adminId);
};

/*
  If user doesn't exist, create a row with the specified amount as the balance.
  Otherwise, adjust the user's balance by the specified amount.
  The user's balance will be set to 0 if the adjustment brings it below 0.
*/
export const adjustCoinBalanceByUserId = async (
  userId: string,
  amount: number,
  event: UserCoinEvent,
  reason: string | null = null,
  adminId: string | null = null,
): Promise<void> => {
  const oldBalance = await getCoinBalanceByUserId(userId);
  const newBalance = Math.max(oldBalance! + amount, 0);
  await changeDbCoinBalanceByUserId(userId, oldBalance!, newBalance, event, reason, adminId);
};

/*
  Changes data in the database, with oldBalance and newBalance being pre-computed and passed in as parameters.
  TODO: Wrap in transaction.
*/
export const changeDbCoinBalanceByUserId = async (
  userId: string,
  oldBalance: number,
  newBalance: number,
  event: UserCoinEvent,
  reason: string | null,
  adminId: string | null,
): Promise<void> => {
  const db = await openDB();
  await db.run(
    `
      INSERT INTO user_coin (user_id, balance) VALUES (?, ?)
      ON CONFLICT(user_id)
      DO UPDATE SET balance = ?`,
    userId,
    newBalance,
    newBalance,
  );
  await createCoinLedgerEntry(userId, oldBalance, newBalance, event, reason, adminId);
};

/*
  Get the leaderboard for the current coin amounts.
*/
export const getCoinLeaderboard = async (limit: number, offset = 0): Promise<UserCoinEntry[]> => {
  const db = await openDB();
  const res = await db.all(
    `
      SELECT user_id, balance
      FROM user_coin
      ORDER BY balance DESC
      LIMIT ? OFFSET ?
    `,
    limit,
    offset,
  );
  return res;
};

/*
  Adds an entry to the Codey coin ledger due to a change in a user's coin balance.
  reason is only applicable for admin commands and is optional.
  adminId is only applicable for admin commands and is mandatory.
*/
export const createCoinLedgerEntry = async (
  userId: string,
  oldBalance: number,
  newBalance: number,
  event: UserCoinEvent,
  reason: string | null,
  adminId: string | null,
): Promise<void> => {
  const db = await openDB();
  await db.run(
    'INSERT INTO user_coin_ledger (user_id, amount, new_balance, event, reason, admin_id) VALUES (?, ?, ?, ?, ?, ?)',
    userId,
    newBalance - oldBalance,
    newBalance,
    event,
    reason,
    adminId,
  );
};

/*
  If (user, bonusType) doesn't exist, create row with current time as this bonusType log.
  Otherwise, update last_granted to CURRENT_TIMESTAMP.
*/
export const updateUserBonusTableByUserId = async (
  userId: string,
  bonusType: BonusType,
): Promise<void> => {
  const db = await openDB();
  await db.run(
    `
      INSERT INTO user_coin_bonus (user_id, bonus_type, last_granted) VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, bonus_type)
      DO UPDATE SET last_granted = CURRENT_TIMESTAMP`,
    userId,
    bonusType,
  );
};

/*
  Get the time of the latest bonus applied to a user based on type
*/
export const latestBonusByUserId = async (
  userId: string,
  type: BonusType,
): Promise<UserCoinBonus | undefined> => {
  const db = await openDB();
  const res: UserCoinBonus | undefined = await db.get(
    `SELECT last_granted FROM user_coin_bonus WHERE user_id = ? AND bonus_type = ?`,
    userId,
    type,
  );
  return res;
};

/*
  Adjusts balance by bonus amount if appropriate cooldown has passed.
  Returns true if the a bonusType is applied to a user, and false otherwise.
*/
export const applyTimeBonus = async (userId: string, bonusType: BonusType): Promise<boolean> => {
  const bonusOfInterest = coinBonusMap.get(bonusType);

  if (!bonusOfInterest) {
    return false; // type does not exist
  }

  const lastBonusOccurrence = await latestBonusByUserId(userId, bonusOfInterest.type);
  const nowTime = new Date().getTime();
  if (bonusOfInterest.cooldown === null) {
    throw 'Bonus does not have cooldown';
  }
  const cooldown = nowTime - bonusOfInterest.cooldown;
  // lastBonusOccurrenceTime either does not exist yet (set as -1), or is pulled from db
  const lastBonusOccurrenceTime = !lastBonusOccurrence
    ? -1
    : new Date(lastBonusOccurrence['last_granted']).getTime() -
      new Date(lastBonusOccurrence['last_granted']).getTimezoneOffset() * 60 * 1000; // convert minutes to milliseconds

  // TODO wrap operations in transaction
  if (!lastBonusOccurrence || lastBonusOccurrenceTime < cooldown) {
    await adjustCoinBalanceByUserId(userId, bonusOfInterest.amount, bonusOfInterest.event);
    await updateUserBonusTableByUserId(userId, bonusType);
    return true; // bonus type is applied
  }

  return false; // bonus type is not applied
};

/*
  Determine if any timely bonuses are available.
  Only apply the largest bonus.
*/
export const applyBonusByUserId = async (userId: string): Promise<boolean> => {
  for (const bonus of coinBonusMap.values()) {
    if (bonus.isMessageBonus) {
      const isBonusApplied = await applyTimeBonus(userId, bonus.type);
      if (isBonusApplied) {
        return false; // return statement bc cannot break forEach loop
      }
    }
  }
  return false;
};

export enum TransferSign {
  Pending = 0,
  Accept = 1,
  Decline = 2,
}

export const getEmojiFromSign = (sign: TransferSign): string => {
  switch (sign) {
    case TransferSign.Pending:
      return '❓';
    case TransferSign.Accept:
      return '✅';
    case TransferSign.Decline:
      return '❌';
  }
};

export enum TransferResult {
  Pending,
  Rejected,
  Confirmed,
  Invalid,
}

type TransferState = {
  sender: User;
  receiver: User;
  result: TransferResult;
  amount: number;
  reason: string;
};

class TransferTracker {
  transfers: Map<string, Transfer>; // id, transfer

  constructor() {
    this.transfers = new Map<string, Transfer>();
  }
  getTransferFromId(id: string): Transfer | undefined {
    return this.transfers.get(id);
  }

  runFuncOnTransfer(transferId: string, func: (transfer: Transfer) => void): void {
    func(this.getTransferFromId(transferId)!);
  }

  async startTransfer(
    sender: User,
    receiver: User,
    amount: number,
    reason: string,
    client: SapphireClient<boolean>,
    channelId: string,
  ): Promise<Transfer> {
    const transferId = uniqueId();
    const transferState: TransferState = {
      sender: sender,
      receiver: receiver,
      amount: amount,
      reason: reason,
      result: TransferResult.Pending,
    };
    const transfer = new Transfer(channelId, client, transferId, transferState);
    this.transfers.set(transferId, transfer);
    return transfer;
  }

  async endTransfer(transferId: string): Promise<void> {
    const transfer = this.transfers.get(transferId);
    if (!transfer) {
      throw new Error(`No transfer with transfer ID ${transferId} found`);
    }

    if (transfer.state.result === TransferResult.Pending) return;
    await transfer.handleTransaction();
  }
}

export const transferTracker = new TransferTracker();

export class Transfer {
  channelId: string;
  client: SapphireClient<boolean>;
  state: TransferState;
  transferId: string;
  transferMessage!: SapphireSentMessageType;

  constructor(
    channelId: string,
    client: SapphireClient<boolean>,
    transferId: string,
    transferState: TransferState,
  ) {
    this.channelId = channelId;
    this.state = transferState;
    this.client = client;
    this.transferId = transferId;
  }

  // called if state is (believed to be) no longer pending. Transfers coins and updates balances if transfer is confirmed
  // also checks if sender still has enough coins in their balance
  async handleTransaction(): Promise<void> {
    const senderBalance = await getCoinBalanceByUserId(this.state.sender.id);
    if (this.state.amount > senderBalance) {
      this.state.result = TransferResult.Invalid;
    } else if (this.state.result === TransferResult.Confirmed) {
      // Adjust the receiver balance with coins transferred
      await adjustCoinBalanceByUserId(
        this.state.receiver.id,
        this.state.amount,
        UserCoinEvent.CoinTransferReceiver,
        <string>(this.state.reason ?? ''),
        this.client.user?.id,
      );

      // Adjust the sender balance with coins transferred
      await adjustCoinBalanceByUserId(
        this.state.sender.id,
        <number>(-1 * this.state.amount),
        UserCoinEvent.CoinTransferSender,
        <string>(this.state.reason ?? ''),
        this.client.user?.id,
      );
    }
  }

  public getEmbedColor(): keyof typeof Colors {
    switch (this.state.result) {
      case TransferResult.Confirmed:
        return 'Green';
      case TransferResult.Rejected:
        return 'Red';
      case TransferResult.Invalid:
        return 'DarkBlue';
      default:
        return 'Yellow';
    }
  }

  public async getStatusAsString(): Promise<string> {
    switch (this.state.result) {
      case TransferResult.Confirmed:
        const newReceiverBalance = await getCoinBalanceByUserId(this.state.receiver.id);
        const newSenderBalance = await getCoinBalanceByUserId(this.state.sender.id);
        return `${this.state.receiver.username} accepted the transfer. ${
          this.state.receiver.username
        } now has ${newReceiverBalance} Codey ${pluralize(
          'coin',
          newReceiverBalance,
        )} ${getCoinEmoji()}. ${
          this.state.sender.username
        } now has ${newSenderBalance} Codey ${pluralize(
          'coin',
          newSenderBalance,
        )} ${getCoinEmoji()}.`;
      case TransferResult.Rejected:
        return `This transfer was rejected by ${this.state.receiver.username}.`;
      case TransferResult.Pending:
        return 'Please choose whether you would like to accept this transfer.';
      case TransferResult.Invalid:
        return 'This transfer has become invalid.';
      default:
        return `Something went wrong! ${getEmojiByName('codey_sad')}`;
    }
  }

  public async getTransferResponse(): Promise<BaseMessageOptions> {
    const embed = new EmbedBuilder()
      .setColor(this.getEmbedColor())
      .setTitle('Coin Transfer')
      .setDescription(
        `
Amount: ${this.state.amount} ${getCoinEmoji()}
From: ${this.state.sender.username}
To: ${this.state.receiver.username}
${this.state.reason ? `Reason: ${this.state.reason}\n` : ''}
${await this.getStatusAsString()}
`,
      );
    // Buttons
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`transfer-check-${this.transferId}`)
        .setLabel('Accept')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`transfer-x-${this.transferId}`)
        .setLabel('Reject')
        .setStyle(ButtonStyle.Danger),
    );

    return {
      embeds: [embed],
      components: this.state.result === TransferResult.Pending ? [row] : [],
    };
  }
}
