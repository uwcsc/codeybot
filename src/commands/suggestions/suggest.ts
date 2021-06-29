import { Message } from 'discord.js';
import { CommandoClient, CommandoMessage } from 'discord.js-commando';
import { BaseCommand } from '../../utils/commands';
import { addSuggestion } from '../../components/suggestions';

class SuggestCommand extends BaseCommand {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'suggest',
      group: 'suggestions',
      memberName: 'suggest',
      args: [
        {
          key: 'suggestion',
          prompt: 'what suggestions do you have for CSC?',
          type: 'string'
        }
      ],
      description: 'Submits a suggestion to the CSC executives.',
      examples: [`${client.commandPrefix}suggest I want a new Discord channel named #hobbies!`],
      details: `This command will forward a suggestion to the CSC executives. \
Please note that your suggestion is not anonymous, your Discord username and ID will be recorded. \
If you don't want to make a suggestion in public, you could use this command via a DM to Codey instead.`
    });
  }

  async onRun(message: CommandoMessage, args: { suggestion: string }): Promise<Message> {
    const { suggestion } = args;
    // Add suggestion
    await addSuggestion(message.author.id, message.author.username, suggestion);
    // Confirm suggestion was taken
    return message.reply('Codey has received your suggestion.');
  }
}

export default SuggestCommand;
