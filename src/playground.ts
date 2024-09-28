import { encode } from "vlq";
import { load, loadSync } from "./";

function overrideConsoleLogFileLineColumn() {
	return (...args: any[]) => {
		let stack = (new Error().stack ?? "").replace("Error", "");
		// console.log(stack)
		/** @type {string} */
		let lastLine = (stack.split("\n").at(-1) ?? "").replace(/\s*at\s*/, "");
		let lastLineData = lastLine.match(/(:([0-9]+))?(:([0-9]+))?$/);
		let lineNumberAndColumn = lastLineData ? lastLineData[0] ?? "" : "";
		let lineNumber = lastLineData ? parseInt(lastLineData[2] ?? "0") : 0;
		let lineColumn = lastLineData ? parseInt(lastLineData[4] ?? "0") : 0;
		let mapData = [[[]], [[]], [[0, 0, lineNumber - 1, lineColumn - 1]]];
		let url = new URL(lastLine.substring(0, lastLine.length - lineNumberAndColumn.length));
		let sourceURL = url.pathname.replace(/^\//, "") + url.search;
		// console.log({sorcery});
		console.log(loadSync(sourceURL));
		let mappings = mapData.map(
			line => line.map(
				lineData => encode(lineData)
			).join(",")
		).join(";");
		console.log({lastLineData, lineNumber, lineColumn, sourceURL});
		let config = {
			version: 3,
			sources: [ sourceURL, url.pathname.replace(/^\//, "") ],
			mappings,
		};
		let dataFirstPart = "MappingURL=data:appli";
		let functionBody = `console.log(...args);
			let stack = (new Error().stack ?? "").replace("Error", "");
			// console.log(stack)
			//${"#"} source${dataFirstPart}cation/json;base64,${btoa(JSON.stringify(config))}
			//${"#"} sourceURL=index.html
		`;
		let f = new Function("...args", functionBody);
		f(...args);
	};
}
let f = overrideConsoleLogFileLineColumn();
overrideConsoleLogFileLineColumn()("test0");
			f("test", {});
