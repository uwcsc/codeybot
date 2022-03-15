export const enforceNoArgumentsMessage = (commandName: string): string => {
  return `\`${commandName.toLowerCase()}\` doesn't take any arguments.`;
};
