export default class Node {
    /**
     * @param {{
     *   file?: string;
     *   content?: string;
     * }} opts
     */
    constructor({ file, content }: {
        file?: string;
        content?: string;
    });
    file: string;
    content: string;
    map: any;
    mappings: import("@jridgewell/sourcemap-codec").SourceMapMappings;
    sources: any;
    isOriginalSource: boolean;
    _stats: {
        decodingTime: number;
        encodingTime: number;
        tracingTime: number;
        untraceable: number;
    };
    load(sourcesContentByPath: any, sourceMapByPath: any): Promise<any>;
    loadSync(sourcesContentByPath: any, sourceMapByPath: any): void;
    /**
     * Traces a segment back to its origin
     * @param {number} lineIndex - the zero-based line index of the
       segment as found in `this`
     * @param {number} columnIndex - the zero-based column index of the
       segment as found in `this`
     * @param {string | null} name - if specified, the name that should be
       (eventually) returned, as it is closest to the generated code
     * @returns {object}
         @property {string} source - the filepath of the source
         @property {number} line - the one-based line index
         @property {number} column - the zero-based column index
         @property {string | null} name - the name corresponding
         to the segment being traced
     */
    trace(lineIndex: number, columnIndex: number, name: string | null): object;
}
