import { encode as encodeVlq, decode as decodeVlq } from "vlq";

// borrowed (stolen) from @jridgewell/sourcemap-codec
export type SourceMapSegmentOne = [number];
export type SourceMapSegmentFour = [number, number, number, number];
export type SourceMapSegmentFive = [number, number, number, number, number ];
export type SourceMapSegment =
				| SourceMapSegmentOne
				| SourceMapSegmentFour
				| SourceMapSegmentFive; 
export type SourceMapLine = SourceMapSegment[];
export type SourceMapMappings = SourceMapLine[];

export function encode(decodedMappings: SourceMapMappings) {
	return decodedMappings.map(
		line => line.map(
			segment => encodeVlq(segment)
		).join(",")
	).join(";");
}

export function decode(mappings: string): SourceMapMappings {
	return mappings.split(";").map(
		line => line.split(",").map(
			segment => decodeVlq(segment) as SourceMapSegment
		)
	);
}