import { container } from '@sapphire/framework';
import { EmbedBuilder } from 'discord.js';
import {
  CodeyCommandDetails,
  SapphireMessageExecuteType,
  SapphireMessageResponse,
} from '../../codeyCommand';
import { DEFAULT_EMBED_COLOUR } from '../../utils/embeds';


const officeExecuteCommand: SapphireMessageExecuteType = async(
    _client,
    _messageFromUser,
    _args,
  ): Promise<SapphireMessageResponse> => {
    
    const officeEmbed =  new EmbedBuilder()
        .setColor(DEFAULT_EMBED_COLOUR)
        .setTitle(`About the CSC Office`)
        .setThumbnail('https://cdn.discordapp.com/emojis/869377257586704407.png')
        .setDescription(`Find us in MC 3036/3037!`)
        .addFields([
            {
                name: `What we offer:`,
                value: `
                •  Pop for just 50 cents
                      •  Informative books
                      • 5 computer terminals
                      • (sometimes) super knowledgeable people `,
            },
            {
                name: `Call us!`,
                value: `(519) 888-4567 x33870`,
            },
        ]);
        // look at info.ts about coin to see embded details
        return { embeds: [officeEmbed]};
    };

  
  export const officeCommandDetails: CodeyCommandDetails = {
    name: 'office',
    aliases: [],
    description: 'Get information about the CSC office.',
    detailedDescription: `no detailed description yet`,
  
    isCommandResponseEphemeral: false,
    messageWhenExecutingCommand: 'Retrieving information about the office...',
    executeCommand: officeExecuteCommand,
    messageIfFailure: 'Could not retrieve information about office.',
    options: [],
    subcommandDetails: {},
  };