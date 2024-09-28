import { basename, dirname, relative } from "path-browserify";
import SourceMap from "./SourceMap.ts";
import slash from "./utils/slash.ts";
import SOURCEMAPPING_URL from "./utils/sourceMappingURL.ts";
import Node from "./Node.ts";
import { encode, SourceMapSegment, SourceMapSegmentFive } from "./utils/mappingCodec.ts";

const SOURCEMAP_COMMENT = new RegExp(
	`\n*(?:` +
		`\\/\\/[@#]\\s*${SOURCEMAPPING_URL}=([^\n]+)|` + // js
		`\\/\\*#?\\s*${SOURCEMAPPING_URL}=([^'"]+)\\s\\*\\/)` + // css
		'\\s*$',
	'g'
);

export default class Chain {
	sourcesContentByPath: Record<string, string>;
	node: Node;
	_stats: {
		decodingTime: number;
		encodingTime: number;
		tracingTime: number;
		untraceable: number;
	}
	constructor(node: Node, sourcesContentByPath: Record<string, string>) {
		this.node = node;
		this.sourcesContentByPath = sourcesContentByPath;

		// @ts-ignore
		this._stats = {};
	}

	stat() {
		return {
			selfDecodingTime: this._stats.decodingTime / 1e6,
			totalDecodingTime:
				(this._stats.decodingTime + tally(this.node.sources!, 'decodingTime')) /
				1e6,

			encodingTime: this._stats.encodingTime / 1e6,
			tracingTime: this._stats.tracingTime / 1e6,

			untraceable: this._stats.untraceable
		};
	}

	apply(options: Partial<{ includeContent: boolean, base: any }> = {}) {
		let allNames: string[] = [];
		let allSources: string[] = [];

		const applySegment = (segment: SourceMapSegment, result: number[][]) => {
			if (segment.length < 4) return;
			segment = segment as SourceMapSegmentFive;

			const traced = this.node.sources![segment[1]].trace(
				// source
				segment[2], // source code line
				segment[3], // source code column
				this.node.map!.names[segment[4]]
			);

			if (!traced) {
				this._stats.untraceable += 1;
				return;
			}

			let sourceIndex = allSources.indexOf(traced.source);
			if (!~sourceIndex) {
				sourceIndex = allSources.length;
				allSources.push(traced.source);
			}

			let newSegment = [
				segment[0], // generated code column
				sourceIndex,
				traced.line - 1,
				traced.column
			];

			if (traced.name) {
				let nameIndex = allNames.indexOf(traced.name);
				if (!~nameIndex) {
					nameIndex = allNames.length;
					allNames.push(traced.name);
				}

				newSegment[4] = nameIndex;
			}

			result[result.length] = newSegment;
		};

		// Trace mappings
		let tracingStart = process.hrtime();

		let i = this.node.mappings!.length;
		let resolved = new Array(i);

		let j, line, result: number[][];

		while (i--) {
			line = this.node.mappings![i];
			resolved[i] = result = [];

			for (j = 0; j < line.length; j += 1) {
				applySegment(line[j], result);
			}
		}

		let tracingTime = process.hrtime(tracingStart);
		this._stats.tracingTime = 1e9 * tracingTime[0] + tracingTime[1];

		// Encode mappings
		let encodingStart = process.hrtime();
		let mappings = encode(resolved);
		let encodingTime = process.hrtime(encodingStart);
		this._stats.encodingTime = 1e9 * encodingTime[0] + encodingTime[1];

		let includeContent = options.includeContent !== false;

		let arg = {
			file: basename(this.node.file!),
			sources: allSources.map((source) =>
				slash(relative(options.base || dirname(this.node.file!), source))
			),
			sourcesContent: allSources.map((source) =>
				includeContent ? this.sourcesContentByPath[source] : null
			),
			names: allNames,
			mappings
		};
		return new SourceMap(arg);
	}

	trace(oneBasedLineIndex: number, zeroBasedColumnIndex: number) {
		return this.node.trace(oneBasedLineIndex - 1, zeroBasedColumnIndex, null);
	}
}

function tally(nodes: Node[], stat: keyof Node["_stats"]) {
	return nodes.reduce((total, node) => {
		return total + node._stats[stat];
	}, 0);
}

