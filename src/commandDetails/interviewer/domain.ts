import { container } from '@sapphire/framework';
import {
  CodeyCommandDetails,
  CodeyCommandResponseType,
  getUserFromMessage,
  SapphireMessageExecuteType,
  SapphireMessageResponse
} from '../../codeyCommand';
import { MessageActionRow, MessageSelectMenu, MessageSelectOptionData } from 'discord.js';
import { availableDomains, getInterviewer, joinDomain, leaveDomain } from '../../components/interviewer';

const interviewerDomainExecuteCommand: SapphireMessageExecuteType = async (
  _client,
  messageFromUser,
  _args,
  _initialMessage,
  values
): Promise<SapphireMessageResponse> => {
  const id = getUserFromMessage(messageFromUser).id;
  if (!(await getInterviewer(id))) {
    return `You don't seem to have signed up yet. Please sign up using the signup subcommand!`;
  }

  let outputString: string;
  outputString = '';

  for (const domain of Object.keys(availableDomains)) {
    // Check if changes have been made to the user's domains since
    // joinDomain/leaveDomain return true if the domain has been altered
    //
    // Don't inform the user of pointless changes (leaving domain that they never joined)
    // Inform user if they've already joined a domain they're attempting to join.
    if (values!.includes(domain)) {
      outputString = (await joinDomain(id, domain))
        ? outputString.concat(`**Added** to *${availableDomains[domain]}*\n`)
        : outputString.concat(`Already in *${availableDomains[domain]}*\n`);
    } else {
      if (await leaveDomain(id, domain)) {
        outputString = outputString.concat(`**Removed** from ${availableDomains[domain]}\n`);
      }
    }
  }

  return outputString;
};

//*
// Generates MessageSelectOptions based on `availableDomains` for the SelectMenu
// */
function generateOptions(): MessageSelectOptionData[] {
  const optionsList: MessageSelectOptionData[] = [];
  for (const [domainValue, domainName] of Object.entries(availableDomains)) {
    const entry = {
      label: domainName,
      value: domainValue
    };
    optionsList.push(entry);
  }

  return optionsList;
}

export const interviewerDomainCommandDetails: CodeyCommandDetails = {
  name: 'domain',
  aliases: ['domain'],
  description: 'Modify domain data',
  detailedDescription: `**Examples:**
\`${container.botPrefix}interviewer domain\``,
  isCommandResponseEphemeral: false,
  messageWhenExecutingCommand: 'Modifying domain',
  executeCommand: interviewerDomainExecuteCommand,
  codeyCommandResponseType: CodeyCommandResponseType.STRING,
  options: [],
  subcommandDetails: {},
  components: [
    new MessageActionRow().addComponents(
      new MessageSelectMenu()
        .setCustomId('interviewer-domain')
        .setPlaceholder('Set Domains')
        .setMaxValues(Object.keys(availableDomains).length)
        .setMinValues(0)
        .addOptions(generateOptions())
    )
  ]
};
