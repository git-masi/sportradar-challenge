import snakeCase from 'lodash.snakecase';

export function snakeCaseKeys<T>(obj: T) {
  if (obj?.constructor?.name !== 'Object') {
    return obj;
  }

  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [snakeCase(key), value])
  ) as T;
}
