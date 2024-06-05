import {
  Colors,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ButtonInteraction,
  ComponentType,
  Message
} from 'discord.js';
  
const COLLECTOR_TIMEOUT = 60000;
  
export const PaginationBuilder = async (
  message: Message,
  reactFilter: (reaction: ButtonInteraction) => boolean,
  embedPages: EmbedBuilder[],
): Promise<Message<boolean> | undefined> => {
  try {
    if (!message || !embedPages || !embedPages.length) return;
      
    var currentPage = 0;
    const firstButton = new ButtonBuilder()
      .setCustomId('first')
      .setEmoji('⏮️')
      .setLabel('First')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true);
    const previousButton = new ButtonBuilder()
      .setCustomId('previous')
      .setEmoji('⬅️')
      .setLabel('Previous')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true);
    const pageCount = new ButtonBuilder()
      .setCustomId('pagecount')
      .setLabel(`${currentPage + 1}/${embedPages.length}`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true);
    const nextButton = new ButtonBuilder()
      .setCustomId('next')
      .setEmoji('➡️')
      .setLabel('Next')
      .setStyle(ButtonStyle.Primary);
    const lastButton = new ButtonBuilder()
      .setCustomId('last')
      .setEmoji('⏭️')
      .setLabel('Last')
      .setStyle(ButtonStyle.Primary);
    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      firstButton,
      previousButton,
      pageCount,
      nextButton,
      lastButton,
    );

    await message.edit({
      embeds: [embedPages[currentPage]],
      components: [actionRow],
    });

    const collector = message.createMessageComponentCollector({
      filter: reactFilter,
      componentType: ComponentType.Button,
      time: COLLECTOR_TIMEOUT,
    });

    collector.on('collect', async (buttonInteraction: ButtonInteraction) => {
      await buttonInteraction.deferUpdate();

      switch (buttonInteraction.customId) {
        case 'first':
          currentPage = 0;
          break;
        case 'previous':
          currentPage = Math.max(0, currentPage - 1);
          break;
        case 'next':
          currentPage = Math.min(embedPages.length - 1, currentPage + 1);
          break;
        case 'last':
          currentPage = embedPages.length - 1;
          break;
      }

      // Update button states based on the current page
      firstButton.setDisabled(currentPage === 0);
      previousButton.setDisabled(currentPage === 0);
      nextButton.setDisabled(currentPage === embedPages.length - 1);
      lastButton.setDisabled(currentPage === embedPages.length - 1);
      pageCount.setLabel(`${currentPage + 1}/${embedPages.length}`);

      // Update the message with the new embed and button states
      await message.edit({
        embeds: [embedPages[currentPage]],
        components: [actionRow],
      });
    });

    collector.on('end', async () => {
      await message.edit({
        components: []
      });
    });

    return message;
  } catch (error) {
    console.error('An error occurred:', error);
    return undefined;
  }
};
  