/**
 * @param {string} file
 * @param {{
 *   content?: Record<string, string>;
 *   sourcemaps?: Record<string, any>;
 * }} options
 * @returns
 */
export function load(file: string, options: {
    content?: Record<string, string>;
    sourcemaps?: Record<string, any>;
}): any;
/**
 * @param {string} file
 * @param {{
 *   content?: Record<string, string>;
 *   sourcemaps?: Record<string, any>;
 * }} options
 * @returns
 */
export function loadSync(file: string, options?: {
    content?: Record<string, string>;
    sourcemaps?: Record<string, any>;
}): Chain;
import Chain from './Chain.js';
