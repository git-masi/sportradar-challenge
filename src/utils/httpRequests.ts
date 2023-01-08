import got from 'got';

/**
 * A simple function for fetching JSON data.
 * If additional flexibility is needed, use `got` directly.
 * @param url - The URL to request
 * @param config - Optionally pass in a positive int for a
 * request `timeout` in ms and/or a number of times to `retry`
 * the request.
 * @returns A JSON response body wrapped in a promise
 */
export function fetchJson<T>(
  url: string,
  config?: { timeout: number; retry: number }
): Promise<T> {
  const options: { timeout?: Object; retry?: Object } = {};

  if (config && config?.timeout > 0) {
    options.timeout = { request: config.timeout };
  }

  if (config && config?.retry > 0) {
    options.retry = {
      limit: config.retry,
      errorCodes: [
        'ETIMEDOUT',
        'ECONNRESET',
        'EADDRINUSE',
        'ECONNREFUSED',
        'ENETUNREACH',
        'EAI_AGAIN',
      ],
    };
  }

  return got.get(url, options).json();
}
