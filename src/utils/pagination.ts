import {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ButtonInteraction,
  ComponentType,
  Message,
  ChatInputCommandInteraction,
  CacheType,
} from 'discord.js';

const COLLECTOR_TIMEOUT = 120000;

export const PaginationBuilder = async (
  originalMessage: Message<boolean> | ChatInputCommandInteraction<CacheType>,
  author: string,
  embedPages: EmbedBuilder[],
  timeout: number = COLLECTOR_TIMEOUT,
): Promise<Message<boolean> | undefined> => {
  try {
    if (!embedPages || !embedPages.length) {
      await originalMessage.reply({
        embeds: [new EmbedBuilder().setColor(0xff0000).setDescription('No pages to display.')],
      });
      return;
    }
    let currentPage = 0;
    const firstButton = new ButtonBuilder()
      .setCustomId('first')
      .setEmoji('⏮️')
      // .setLabel('First')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true);
    const previousButton = new ButtonBuilder()
      .setCustomId('previous')
      .setEmoji('⬅️')
      // .setLabel('Previous')
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
      // .setLabel('Next')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(embedPages.length <= 1);
    const lastButton = new ButtonBuilder()
      .setCustomId('last')
      .setEmoji('⏭️')
      // .setLabel('Last')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(embedPages.length <= 1);
    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      firstButton,
      previousButton,
      pageCount,
      nextButton,
      lastButton,
    );

    const message = await originalMessage.reply({
      embeds: [embedPages[currentPage]],
      components: [actionRow],
      fetchReply: true,
    });

    await message.edit({
      embeds: [embedPages[currentPage]],
      components: [actionRow],
    });

    const collector = message.createMessageComponentCollector({
      filter: (interaction) => interaction.user.id === author,
      componentType: ComponentType.Button,
      idle: timeout,
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

      firstButton.setDisabled(currentPage === 0);
      previousButton.setDisabled(currentPage === 0);
      nextButton.setDisabled(currentPage === embedPages.length - 1);
      lastButton.setDisabled(currentPage === embedPages.length - 1);
      pageCount.setLabel(`${currentPage + 1}/${embedPages.length}`);

      await message.edit({
        embeds: [embedPages[currentPage]],
        components: [actionRow],
      });
    });

    collector.on('end', async () => {
      await message.edit({
        components: [],
      });
    });

    return message;
  } catch (error) {
    return undefined;
  }
};
