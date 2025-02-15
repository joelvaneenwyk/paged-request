/**
 * Wrapper around axios to make it easier to follow paginated links.
 *
 * @module paged-request
 */

const axios = require('axios');

/**
 * @typedef {(url: string, response: Axios.AxiosXHR<any>, accumulator: Accumulator) => Promise<string|null>} Next
 * @typedef {Partial<Axios.AxiosXHRConfig<any>>} RequestOptions
 * @typedef {RequestOptions | Next} ConfigOrNext
 *
 * @typedef {Object} Accumulator
 * @property {string} orig - Original URL
 * @property {any} options - Request options
 * @property {any[]} pages - Accumulated pages
 * @property {string[]} urls - Accumulated URLs
 */

/**
 * Makes paginated requests to the specified URL.
 *
 * @param {any | null} url - The initial URL to request
 * @param {ConfigOrNext} options - Axios request configuration
 * @param {Next?} next - Function to get the next URL
 * @returns {Promise<Accumulator>} Accumulated response data
 */
module.exports = async function(url, options, next = null) {
  if (typeof url !== 'string') {
    return Promise.reject(new TypeError('expected "url" to be a string'));
  }

  /** @type {RequestOptions?} */
  let in_options = null;
  /** @type {Next | null} */
  let in_next = null;

  if (typeof options === 'function') {
    in_next = options;
  } else if (typeof options === 'object' && options !== null) {
    in_options = options;
    if (typeof next === 'function') {
      in_next = next;
    }
  }

  const opts = Object.assign({}, in_options);

  /** @type {Accumulator} */
  const acc = { orig: url, options, pages: [], urls: [] };
  let res;

  /** @type {string | null} */
  let next_url = url;
  while (next_url && typeof next_url === 'string' && !acc.urls.includes(next_url)) {
    acc.urls.push(next_url);
    res = await axios.get(next_url, opts);
    acc.pages.push(res);
    if (in_next) {
      next_url = await in_next(next_url, res, acc);
    }
  }

  return acc;
};
