import { CodeyUserError } from './../../codeyUserError';
import { Args, container } from '@sapphire/framework';
import { Subcommand } from '@sapphire/plugin-subcommands';
import { Message, EmbedBuilder } from 'discord.js';
import _ from 'lodash';
import { getEmojiByName } from '../../components/emojis';
import {
  availableDomains,
  clearProfile,
  getAvailableDomainsString,
  getDomains,
  getDomainsString,
  getInterviewer,
  getInterviewerDomainsString,
  getInterviewers,
  Interviewer,
  parseLink,
  pauseProfile,
  resumeProfile,
  toggleDomain,
  upsertInterviewer,
} from '../../components/interviewer';
import { DEFAULT_EMBED_COLOUR } from '../../utils/embeds';
import {
    CodeyCommandDetails,
    CodeyCommandOptionType,
    SapphireMessageExecuteType,
    SapphireMessageResponse,
} from '../../codeyCommand';
import { clearCommandDetails } from './clear';
import { domainCommandDetails } from './domain';
import { pauseCommandDetails } from './pause';
import { profileCommandDetails } from './profile';
import { resumeCommandDetails } from './resume';
import { signupCommandDetails } from './signup';
import { listCommandDetails } from './list';

const interviewerExecuteCommand: SapphireMessageExecuteType = async (
    _client,
    _messageFromUser,
    args,
): Promise<SapphireMessageResponse> => {
    /** Not sure what to do here */
}

export const interviewerCommandDetails: CodeyCommandDetails = {
    name: 'interviewers',
    aliases: ['int'],
    description: 'Handle interviewer functions.',
    detailedDescription: `**Examples:**
\`${container.botPrefix}interviewer\`
\`${container.botPrefix}interviewer frontend\``,

    isCommandResponseEphemeral: false,
    messageWhenExecutingCommand: 'Getting interviewer information...',
    executeCommand: interviewerExecuteCommand,
    messageIfFailure: 'Could not retrieve interviewer information.',
    options: [],
    subcommandDetails: {
        ['clear']: clearCommandDetails,
        ['domain']: domainCommandDetails,
        ['pause']: pauseCommandDetails,
        ['profile']: profileCommandDetails,
        ['resume']: resumeCommandDetails,
        ['signup']: signupCommandDetails,
        ['list']: listCommandDetails,
    },
};