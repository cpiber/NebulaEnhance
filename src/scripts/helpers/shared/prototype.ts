
Array.prototype.occurence = function <T> (this: Array<T>) {
  return [...this].sort().reduce((prev, cur) => {
    if (cur === prev.values[prev.values.length - 1]) {
      prev.occurences[prev.occurences.length - 1]++; // increase frequency
      return prev;
    }
    // new element
    prev.values.push(cur);
    prev.occurences.push(1);
    return prev;
  }, { values: [] as Array<T>, occurences: [] as Array<number> });
};
Array.prototype.equals = function <T> (this: Array<T>, other: Array<T>) {
  return this.length === other.length && this.every((v, i) => v === other[i]);
};
Number.prototype.pad = function (this: number, length: number) {
  return ('' + this).padStart(length, '0');
};
String.prototype.matchAll = String.prototype.matchAll || function (r) {
  let match: RegExpExecArray;
  const regexp = new RegExp(r); // copy as per matchAll spec
  if (regexp.flags.indexOf('g') === -1) throw new TypeError('matchAll must be called with a global RegExp');
  return function* (that: string) {
    while ((match = regexp.exec(that)) !== null)
      yield match;
  }(this);
};

export { }; // This is necessary to be recognized as a module, otherwise certain polyfills (__spreadArray) aren't properly named
