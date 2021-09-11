export const toTitleCase = (str: string): string => {
  return str.replace(/-/g, ' ').replace(
    /\w\S*/g,
    function(txt: string) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    }
  );
}