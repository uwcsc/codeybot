export const binaryFind = <T>(
  arr: Array<T>,
  lookup: T,
  compare: (x: T, y: T) => boolean = defaultCompare,
): boolean => {
  let start = 0,
    end = arr.length - 1;

  while (start <= end) {
    const mid = Math.floor((start + end) / 2);

    if (arr[mid] === lookup) return true;
    // else if (arr[mid] < lookup) start = mid + 1;
    else if (compare(arr[mid], lookup)) start = mid + 1;
    else end = mid - 1;
  }

  return false;
};

const defaultCompare = <T>(x: T, y: T): boolean => {
  return String(x).localeCompare(String(y)) < 0;
};
