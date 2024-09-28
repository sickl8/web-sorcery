
export function readFile(path: string, ..._args: any[]): Promise<string> {
	return fetch(path).then(res => res.text());
}

export function readFileSync(path: string, ..._args: any[]): string {
	const xhr = new XMLHttpRequest();
    xhr.open("GET", path, false); // synchronous request
    xhr.send(null);
	return xhr.responseText;
}