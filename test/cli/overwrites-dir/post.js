import fs from 'node:fs';

export default function () {
	fs.unlinkSync(`${__dirname}/actual/foo.coffee`);
	fs.unlinkSync(`${__dirname}/actual/bar.coffee`);

	fs.unlinkSync(`${__dirname}/actual/foo.js`);
	fs.unlinkSync(`${__dirname}/actual/bar.js`);

	fs.unlinkSync(`${__dirname}/actual/foo.js.map`);
	fs.unlinkSync(`${__dirname}/actual/bar.js.map`);
}
