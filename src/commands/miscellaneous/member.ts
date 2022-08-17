import { Command, container } from '@sapphire/framework';
import {
  CodeyCommand,
  CodeyCommandDetails,
  CodeyCommandOptionType,
  CodeyCommandResponseType,
  SapphireMessageExecuteType,
  SapphireMessageResponse
} from '../../codeyCommand';
import { getMemberEmbed, UwIdType } from '../../commandDetails/miscellaneous/member';
import { getEmojiByName } from '../../components/emojis';
import { Message } from 'discord.js';
import fetch from 'node-fetch';

const executeCommand: SapphireMessageExecuteType = async (
  _client,
  messageFromUser,
  args,
  _initialMessageFromBot
): Promise<SapphireMessageResponse> => {
  let uwId: UwIdType;
  if (messageFromUser instanceof Message) {
    const { content } = messageFromUser;
    const messageArgs = content.split(' ').filter((m) => m != '.member');
    if (messageArgs.length == 1) uwId = messageArgs[0];
  } else if ('uwid' in args) {
    uwId = args['uwid'] as string;
  }
  const memberEmbed = await getMemberEmbed(uwId);
  return { embeds: [memberEmbed] };
};

const memberCommandDetails: CodeyCommandDetails = {
  name: 'member',
  aliases: [],
  description: 'Gets CSC membership information',
  detailedDescription: `**Examples:**
\`${container.botPrefix}member [id]\``,

  isCommandResponseEphemeral: true,
  messageWhenExecutingCommand: 'Getting CSC membership information...',
  executeCommand: executeCommand,
  messageIfFailure: 'Could not retrieve CSC membership information.',
  codeyCommandResponseType: CodeyCommandResponseType.EMBED,

  options: [
    {
      name: 'uwid',
      description: 'Quest ID',
      type: CodeyCommandOptionType.STRING,
      required: true
    }
  ],
  subcommandDetails: {}
};

export class MiscellaneousMemberCommand extends CodeyCommand {
  details = memberCommandDetails;

  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      aliases: memberCommandDetails.aliases,
      description: memberCommandDetails.description,
      detailedDescription: memberCommandDetails.detailedDescription
    });
  }
}
