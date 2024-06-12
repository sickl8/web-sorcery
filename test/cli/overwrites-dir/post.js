import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

export default function () {
	const dirname = fileURLToPath(new URL('.', import.meta.url));

	fs.unlinkSync(`${dirname}/actual/foo.coffee`);
	fs.unlinkSync(`${dirname}/actual/bar.coffee`);

	fs.unlinkSync(`${dirname}/actual/foo.js`);
	fs.unlinkSync(`${dirname}/actual/bar.js`);

	fs.unlinkSync(`${dirname}/actual/foo.js.map`);
	fs.unlinkSync(`${dirname}/actual/bar.js.map`);
}
