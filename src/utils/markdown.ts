import TurndownService from 'turndown';

export const convertHtmlToMarkdown = (html: string): string => {
  const turndownService = new TurndownService();
  return turndownService.turndown(html);
};
