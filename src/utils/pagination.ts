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

const COLLECTOR_TIMEOUT = 300000;
const MAX_CHARS_PER_PAGE = 2048;
const MAX_PAGES = 25;
const MAX_NEWLINES_PER_PAGE = 10;
const getRandomColor = (): number => Math.floor(Math.random() * 16777215);

const textToPages = (text: string, maxChars: number, ignoreNewLines: boolean): string[] => {
  const pages: string[] = [];
  let currentPage = '';
  let newLineCount = 0;
  let charCount = 0;

  for (let i = 0; i < text.length; i++) {
    currentPage += text[i];
    charCount++;
    if (text[i] === '\n') {
      newLineCount++;
    }

    if (
      (text[i] === '\n' && !ignoreNewLines) ||
      charCount >= maxChars ||
      newLineCount === MAX_NEWLINES_PER_PAGE
    ) {
      pages.push(currentPage.trim());
      currentPage = '';
      charCount = 0;
      newLineCount = 0;
    }
  }

  if (currentPage.trim()) {
    pages.push(currentPage.trim());
  }
  return pages;
};

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
    if (embedPages.length > MAX_PAGES) {
      await originalMessage.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xff0000)
            .setDescription(
              `Too much content to display. Limit is ${MAX_PAGES} pages. \nCurrent content produces ${embedPages.length} pages.`,
            ),
        ],
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
      firstButton.setDisabled(true);
      previousButton.setDisabled(true);
      nextButton.setDisabled(true);
      lastButton.setDisabled(true);
      pageCount.setDisabled(true);

      await message.edit({
        components: [actionRow],
      });

      setTimeout(async () => {
        await message.edit({
          components: [],
        });
      }, 3000);
    });

    return message;
  } catch (error) {
    return undefined;
  }
};

export const PaginationBuilderFromText = async (
  originalMessage: Message<boolean> | ChatInputCommandInteraction<CacheType>,
  author: string,
  text: string,
  ignoreNewLines = false,
  textPageSize: number = MAX_CHARS_PER_PAGE,
  timeout: number = COLLECTOR_TIMEOUT,
): Promise<Message<boolean> | undefined> => {
  try {
    const textPages = textToPages(text, textPageSize, ignoreNewLines);
    const embedPages = textPages.map((text, index) =>
      new EmbedBuilder()
        .setColor(getRandomColor())
        .setTitle('Page ' + (index + 1))
        .setDescription(text),
    );

    return PaginationBuilder(originalMessage, author, embedPages, timeout);
  } catch (error) {
    return undefined;
  }
};
