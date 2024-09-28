import { resolve } from "path-browserify";
import Node from "./Node.ts";
import Chain from "./Chain.ts";
import SourceMap from "./SourceMap.ts";

/**
 * @param {string} file
 * @param {{
 *	content?: Record<string, string>;
 *	sourcemaps?: Record<string, SourceMap>;
 * }} options
 * @returns
 */
export function load(file: string, options: {
	content?: Record<string, string>;
	sourcemaps?: Record<string, SourceMap>;
} = {}) {
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
 *   sourcemaps?: Record<string, SourceMap>;
 * }} options
 * @returns
 */
export function loadSync(file: string, options: {
    content?: Record<string, string>;
    sourcemaps?: Record<string, SourceMap>;
  } = {}) {
	const { node, sourcesContentByPath, sourceMapByPath } = init(file, options);

	node.loadSync(sourcesContentByPath, sourceMapByPath);
	return node.isOriginalSource ? null : new Chain(node, sourcesContentByPath);
}

function init(file: string, options: {
	content?: Record<string, string>;
	sourcemaps?: Record<string, SourceMap>;
} = {}) {
	const node = new Node({ file });

	let sourcesContentByPath: Record<string, string> = {};
	let sourceMapByPath: Record<string, SourceMap> = {};
	
	if (options.content) {
		Object.keys(options.content).forEach((key) => {
			sourcesContentByPath[resolve(key)] = options.content![key];
		});
	}

	if (options.sourcemaps) {
		Object.keys(options.sourcemaps).forEach((key) => {
			sourceMapByPath[resolve(key)] = options.sourcemaps![key];
		});
	}

	return { node, sourcesContentByPath, sourceMapByPath };
}
