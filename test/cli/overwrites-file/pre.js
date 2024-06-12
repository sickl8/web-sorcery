import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import glob from 'tiny-glob/sync.js';

export default function () {
	const dirname = fileURLToPath(new URL('.', import.meta.url));

	const files = glob(`**`, { cwd: `${dirname}/files`, filesOnly: true });

	for (const file of files) {
		fs.copyFileSync(`${dirname}/files/${file}`, `${dirname}/actual/${file}`);
	}
}
