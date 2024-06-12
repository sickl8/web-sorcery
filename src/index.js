import { resolve } from 'node:path';
import Node from './Node.js';
import Chain from './Chain.js';

/**
 * @param {string} file
 * @param {{
 *   content?: Record<string, string>;
 *   sourcemaps?: Record<string, any>;
 * }} options
 * @returns
 */
export function load(file, options) {
	const { node, sourcesContentByPath, sourceMapByPath } = init(file, options);

	return node
		.load(sourcesContentByPath, sourceMapByPath)
		.then(() =>
			node.isOriginalSource ? null : new Chain(node, sourcesContentByPath)
		);
}

/**
 * @param {string} file
 * @param {{
 *   content?: Record<string, string>;
 *   sourcemaps?: Record<string, any>;
 * }} options
 * @returns
 */
export function loadSync(file, options = {}) {
	const { node, sourcesContentByPath, sourceMapByPath } = init(file, options);

	node.loadSync(sourcesContentByPath, sourceMapByPath);
	return node.isOriginalSource ? null : new Chain(node, sourcesContentByPath);
}

/**
 * @param {string} file
 * @param {{
 *   content?: Record<string, string>;
 *   sourcemaps?: Record<string, any>;
 * }} options
 */
function init(file, options = {}) {
	const node = new Node({ file });

	let sourcesContentByPath = {};
	let sourceMapByPath = {};

	if (options.content) {
		Object.keys(options.content).forEach((key) => {
			sourcesContentByPath[resolve(key)] = options.content[key];
		});
	}

	if (options.sourcemaps) {
		Object.keys(options.sourcemaps).forEach((key) => {
			sourceMapByPath[resolve(key)] = options.sourcemaps[key];
		});
	}

	return { node, sourcesContentByPath, sourceMapByPath };
}
