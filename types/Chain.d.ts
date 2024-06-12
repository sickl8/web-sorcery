export default class Chain {
    constructor(node: any, sourcesContentByPath: any);
    node: any;
    sourcesContentByPath: any;
    _stats: {};
    stat(): {
        selfDecodingTime: number;
        totalDecodingTime: number;
        encodingTime: number;
        tracingTime: number;
        untraceable: any;
    };
    apply(options?: {}): SourceMap;
    trace(oneBasedLineIndex: any, zeroBasedColumnIndex: any): any;
    write(dest: any, options: any): Promise<any>;
    writeSync(dest: any, options: any): void;
}
import SourceMap from './SourceMap.js';
