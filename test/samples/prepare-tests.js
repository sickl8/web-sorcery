import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const dirname = fileURLToPath(new URL('.', import.meta.url));

const samples = fs.readdirSync(dirname).filter(dir => fs.statSync(path.join(dirname, dir)).isDirectory());

for (const dir of samples) {
	process.chdir(path.join(dirname, dir));

	// check it exists
	if (fs.existsSync('build.sh')) {
		execSync('sh ./build.sh');
	}
}
