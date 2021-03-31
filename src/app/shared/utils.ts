export class Utils {

  static findUniqueInArray<T>(arr: T[], predicate: ((el: T) => boolean)): T | null {
    const results = arr.filter(predicate);
    if (results.length === 1) {
      return results[0];
    } else if (results.length === 0) {
      return null;
    } else {
      throw new Error(`Duplicates found in arr=${arr}.`);
    }
  }
}
