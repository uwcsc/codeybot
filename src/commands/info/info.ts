import { Command, container } from '@sapphire/framework';
import { MessageEmbed } from 'discord.js';
import {
  CodeyCommand,
  CodeyCommandResponseType,
  SapphireMessageExecuteType,
  SapphireMessageResponse
} from '../../codeyCommand';
import { getRepositoryInfo, getRepositoryReleases } from '../../utils/github';

const INFO_EMBED_COLOR = '#4287f5';

/*
 * Get info embed
 */
export const getInfoEmbed = async (): Promise<MessageEmbed> => {
  const githubRepositoryInfo = await getRepositoryInfo('uwcsc', 'codeybot');
  const githubRepositoryReleases = await getRepositoryReleases('uwcsc', 'codeybot');
  const infoEmbed = new MessageEmbed()
    .setColor(INFO_EMBED_COLOR)
    .setTitle(githubRepositoryInfo.full_name)
    .setURL(githubRepositoryInfo.html_url)
    .setThumbnail(githubRepositoryInfo.owner.avatar_url)
    .setDescription('Links to issue templates: https://github.com/uwcsc/codeybot/tree/master/.github/ISSUE_TEMPLATE')
    .setFooter(`App version: ${githubRepositoryReleases[0].tag_name}`); // I have no idea where to find this
  return infoEmbed;
};

const executeCommand: SapphireMessageExecuteType = async (
  _client,
  _messageFromUser,
  _initialMessageFromBot
): Promise<SapphireMessageResponse> => {
  const infoEmbed = await getInfoEmbed();
  return infoEmbed;
};

export class InfoCommand extends CodeyCommand {
  messageWhenExecutingCommand = 'Fetching Codey info:';
  executeCommand: SapphireMessageExecuteType = executeCommand;
  isCommandResponseEphemeral = false;
  codeyCommandResponseType = CodeyCommandResponseType.EMBED;

  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      description: 'Fetches Codey information - app version, repository link and issue templates',
      detailedDescription: `**Examples:**
        \`${container.botPrefix}info\``
    });
  }
}
