import { Command } from '@sapphire/framework';
import { uwflowInfoCommandDetails } from '../../commandDetails/uwflow/info';
import { CodeyCommand, CodeyCommandDetails } from '../../codeyCommand';

const uwflowCommandDetails: CodeyCommandDetails = {
  name: 'uwflow',
  aliases: [],
  description: 'Handle UWFlow commands.',
  detailedDescription: `**Examples:**`,
  options: [],
  subcommandDetails: {
    info: uwflowInfoCommandDetails,
  },
  defaultSubcommandDetails: uwflowInfoCommandDetails,
};

export class UWFlowCommand extends CodeyCommand {
  details = uwflowCommandDetails;

  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      aliases: uwflowCommandDetails.aliases,
      description: uwflowCommandDetails.description,
      detailedDescription: uwflowCommandDetails.detailedDescription,
    });
  }
}
