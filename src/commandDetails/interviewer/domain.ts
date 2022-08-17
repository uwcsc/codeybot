import { container } from '@sapphire/framework';
import {
  CodeyCommandDetails,
  CodeyCommandResponseType,
  getUserFromMessage,
  SapphireMessageExecuteType,
  SapphireMessageResponse
} from '../../codeyCommand';
import { MessageActionRow, MessageSelectMenu, MessageSelectOptionData } from 'discord.js';
import { availableDomains, getInterviewer, isInDomain, joinDomain, leaveDomain } from '../../components/interviewer';

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

  let strang: string;
  strang = '';

  for (const domain of Object.keys(availableDomains)) {
    if (values!.includes(domain)) {
      joinDomain(id, domain);
      strang = !(await isInDomain(id, domain))
        ? strang.concat(`**Added** to *${availableDomains[domain]}*\n`)
        : strang.concat(`Already in *${availableDomains[domain]}*\n`);
    } else {
      leaveDomain(id, domain);
      if (await isInDomain(id, domain)) {
        strang = strang.concat(`**Removed** from ${availableDomains[domain]}\n`);
      }
    }
  }

  return strang;
};

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
