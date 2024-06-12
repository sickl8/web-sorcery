/**
 * Turns a sourceMappingURL into a sourcemap
 * @param {string} url - the sourceMappingURL. Can be a
   base64-encoded data URI
 * @param {string} base - the URL against which relative URLS
   should be resolved
 * @param {boolean} sync - if `true`, return a promise, otherwise
   return the sourcemap
 * @returns {object} - a version 3 sourcemap
 */
export default function getMapFromUrl(url: string, base: string, sync: boolean): object;
