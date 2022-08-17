import { Command, container } from '@sapphire/framework';
import {
  CodeyCommand,
  CodeyCommandDetails,
  CodeyCommandOptionType,
  CodeyCommandResponseType,
  SapphireMessageExecuteType,
  SapphireMessageResponse
} from '../../codeyCommand';
import { getMemberEmbed, UWIdType } from '../../commandDetails/miscellaneous/member';
import { getEmojiByName } from '../../components/emojis';
import { Message } from 'discord.js';
import fetch from 'node-fetch';

const executeCommand: SapphireMessageExecuteType = async (
  _client,
  messageFromUser,
  args,
  _initialMessageFromBot
): Promise<SapphireMessageResponse> => {
  let uwid: UWIdType;
  if (messageFromUser instanceof Message) {
    const { content } = messageFromUser;
    const messageArgs = content.split(' ').filter((m) => m != '.member');
    if (messageArgs.length == 1) uwid = messageArgs[0];
  } else if ('uwid' in args) {
    uwid = args['uwid'] as string;
  }
  const memberEmbed = await getMemberEmbed(uwid);
  return { embeds: [memberEmbed] };
};

const helpCommandDetails: CodeyCommandDetails = {
  name: 'member',
  aliases: [],
  description: 'Get CSC Member information',
  detailedDescription: `**Examples:**
\`${container.botPrefix}member [id]\``,

  isCommandResponseEphemeral: false,
  messageWhenExecutingCommand: 'Getting Member Info...',
  executeCommand: executeCommand,
  messageIfFailure: 'Could not retrieve URL to the wiki page.',
  codeyCommandResponseType: CodeyCommandResponseType.EMBED,

  options: [
    {
      name: 'uwid',
      description: 'A UW alphanumerical ID',
      type: CodeyCommandOptionType.STRING,
      required: true
    }
  ],
  subcommandDetails: {}
};

export class MiscellaneousMemberCommand extends CodeyCommand {
  details = helpCommandDetails;

  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      aliases: helpCommandDetails.aliases,
      description: helpCommandDetails.description,
      detailedDescription: helpCommandDetails.detailedDescription
    });
  }
}
