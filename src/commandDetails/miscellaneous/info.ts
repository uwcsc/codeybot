import { container } from '@sapphire/framework';
import { MessageEmbed } from 'discord.js';
import {
  CodeyCommandDetails,
  SapphireMessageExecuteType,
  SapphireMessageResponse,
} from '../../codeyCommand';
import { INFO_EMBED_COLOUR } from '../../utils/embeds';
import { getRepositoryInfo, getRepositoryReleases } from '../../utils/github';

/*
 * Get info embed
 */
const getInfoEmbed = async (): Promise<MessageEmbed> => {
  const githubRepositoryInfo = await getRepositoryInfo('uwcsc', 'codeybot');
  const githubRepositoryReleases = await getRepositoryReleases('uwcsc', 'codeybot');
  const infoEmbed = new MessageEmbed()
    .setColor(INFO_EMBED_COLOUR)
    .setTitle(githubRepositoryInfo.full_name)
    .setURL(githubRepositoryInfo.html_url)
    .setThumbnail(githubRepositoryInfo.owner.avatar_url)
    .setDescription(
      'Make a feature request: https://github.com/uwcsc/codeybot/issues/new?assignees=&labels=request&template=feature_request.md',
    )
    .setFooter({ text: `App version: ${githubRepositoryReleases[0].tag_name}` });
  return infoEmbed;
};

const infoExecuteCommand: SapphireMessageExecuteType = async (
  _client,
  _messageFromUser,
  _args,
): Promise<SapphireMessageResponse> => {
  const infoEmbed = await getInfoEmbed();
  return { embeds: [infoEmbed] };
};

export const infoCommandDetails: CodeyCommandDetails = {
  name: 'info',
  aliases: [],
  description: 'Get Codey information - app version, repository link and issue templates.',
  detailedDescription: `**Examples:**
  \`${container.botPrefix}info\``,

  isCommandResponseEphemeral: false,
  messageWhenExecutingCommand: 'Getting Codey Info...',
  messageIfFailure: 'Could not get Codey info.',
  executeCommand: infoExecuteCommand,
  options: [],
  subcommandDetails: {},
};
