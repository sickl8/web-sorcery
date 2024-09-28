import Node from "../Node";
import SourceMap from "../SourceMap";
import getMapFromUrl from "./getMapFromUrl";
import getSourceMappingUrl from "./getSourceMappingUrl";

export default function getMap(node: Node, sourceMapByPath: Record<string, SourceMap>, sync: true): SourceMap;
export default function getMap(node: Node, sourceMapByPath: Record<string, SourceMap>, sync: false): Promise<SourceMap>;
export default function getMap(node: Node, sourceMapByPath: Record<string, SourceMap>): Promise<SourceMap>;
export default function getMap(node: Node, sourceMapByPath: Record<string, SourceMap>, sync = false) {
	if (node.file! in sourceMapByPath) {
		const map = sourceMapByPath[node.file!];
		return sync ? map : Promise.resolve(map);
	} else {
		const url = getSourceMappingUrl(node.content!);

		if (!url) {
			node.isOriginalSource = true;
			return sync ? null : Promise.resolve(null);
		}

		return getMapFromUrl(url, node.file!, sync);
	}
}
