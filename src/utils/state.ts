export function Cell<T>(initialVal: T) {
  let currentVal = initialVal;

  // Freeze cell for immutability
  return Object.freeze({
    val: () => currentVal,
    update: (fn: (val: T) => T) => {
      // Copy value for immutability
      const prevVal = currentVal;
      currentVal = fn(prevVal);
    },
  });
}
