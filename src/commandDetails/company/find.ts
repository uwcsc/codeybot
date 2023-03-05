import { SapphireClient, container } from '@sapphire/framework';
import { MessageEmbed } from 'discord.js';
import { DEFAULT_EMBED_COLOUR } from '../../utils/embeds';
import {
  CodeyCommandDetails,
  CodeyCommandOptionType,
  SapphireMessageExecuteType,
  SapphireMessageResponse,
} from '../../codeyCommand';
import {
  CompanyPersonDetails,
  CrunchbaseCompanyProperties,
  getCompanyInfo,
  getEmployeesByCompanyId,
} from '../../components/company';

const CRUNCHBASE_IMAGE_CDN =
  'https://res.cloudinary.com/crunchbase-production/image/upload/c_lpad,h_170,w_170,f_auto,b_white,q_auto:eco,dpr_1';

const getCompanyFindEmbed = async (
  client: SapphireClient<boolean>,
  companyInfo: CrunchbaseCompanyProperties,
  companyUsers: CompanyPersonDetails[],
) => {
  const formattedUsers = await Promise.all(
    companyUsers.map(async (user) => {
      return {
        ...user,
        tag: (await client.users.fetch(user.user_id)).tag,
      };
    }),
  );
  const companyEmbed = new MessageEmbed()
    .setColor(DEFAULT_EMBED_COLOUR)
    .setTitle(companyInfo.name)
    .setDescription(companyInfo.description);
  companyEmbed.setThumbnail(`${CRUNCHBASE_IMAGE_CDN}/${companyInfo.image_id}`);
  companyEmbed.addField(
    'Previous Employees',
    formattedUsers.map((user) => `${user.tag} - ${user.role}`).join(', '),
  );

  return companyEmbed;
};

const companyFindExecuteCommand: SapphireMessageExecuteType = async (
  client,
  _messageFromUser,
  args,
): Promise<SapphireMessageResponse> => {
  const company_id = args['company_id'];
  if (!company_id) {
    throw new Error('Please enter a company id.');
  }
  const companyInfo = await getCompanyInfo(<string>company_id);
  if (!companyInfo) {
    throw new Error('This company does not exist in the server!');
  }
  const companyUsers = await getEmployeesByCompanyId(<string>company_id);
  if (!companyUsers.length) {
    return 'No one works at this company in the server!';
  }
  return {
    embeds: [await getCompanyFindEmbed(client, companyInfo, companyUsers)],
  };
};

export const companyFindCommandDetails: CodeyCommandDetails = {
  name: 'find',
  aliases: ['f'],
  description: 'Find all individuals that work at the company.',
  detailedDescription: `**Examples:**
    \`${container.botPrefix}company find https://www.crunchbase.com/organization/microsoft\`
    \`${container.botPrefix}company f microsoft\``,
  messageWhenExecutingCommand: 'Finding company...',
  executeCommand: companyFindExecuteCommand,

  options: [
    {
      name: 'company_id',
      description: `The id for the company. This can be either a link to its crunchbase url or the crunchbase id.`,
      type: CodeyCommandOptionType.STRING,
      required: true,
    },
  ],
  subcommandDetails: {},
};
