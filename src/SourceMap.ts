// export type SourceMap = {
// 	version: number;
// 	file: string;
// 	sources: string[];
// 	sourcesContent: string[];
// 	names: string[];
// 	mappings: string;
// }
export default class SourceMap {
	version: number;
	file: string;
	sources: string[];
	sourcesContent: (string | null)[];
	names: string[];
	mappings: string;
	sourceRoot: string | undefined;
	constructor(properties: {
		version?: number;
		file: string;
		sources: string[];
		sourcesContent: (string | null)[];
		names: string[];
		mappings: string;
	}) {
		this.version = 3;
		this.file = properties.file;
		this.sources = properties.sources;
		this.sourcesContent = properties.sourcesContent;
		this.names = properties.names;
		this.mappings = properties.mappings;
	}

	toString() {
		return JSON.stringify(this);
	}

	toUrl() {
		return (
			'data:application/json;charset=utf-8;base64,' + btoa(this.toString())
		);
	}
}
