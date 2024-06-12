import path from 'node:path';
import assert from 'node:assert';
import child_process from 'node:child_process';
import fs from 'node:fs';
import glob from 'tiny-glob/sync.js';
import { rimraf } from 'rimraf';
import { describe, it, beforeEach, afterEach } from 'node:test';
import { SourceMapConsumer } from 'source-map';
import * as sorcery from '../src/index.js';
import { fileURLToPath } from 'node:url';

const dirname = fileURLToPath(new URL('.', import.meta.url).href);

process.chdir(dirname);

beforeEach(() => rimraf.sync('.tmp'));
afterEach(() => rimraf.sync('.tmp'));

describe('sorcery.load()', () => {
	it('resolves to null if target has no sourcemap', () => {
		return sorcery.load('samples/1/src/helloworld.coffee').then((chain) => {
			assert.equal(chain, null);
		});
	});

	it('allows user to specify content/sourcemaps', () => {
		return sorcery
			.load('example.js', {
				content: {
					'example.js': `(function() {
  var answer;

  answer = 40 + 2;

  console.log("the answer is " + answer);

}).call(this);`,
					'example.coffee': `answer = 40 + 2
console.log "the answer is #{answer}"`
				},
				sourcemaps: {
					'example.js': {
						version: 3,
						sources: ['example.coffee'],
						sourcesContent: [null],
						names: [],
						mappings:
							'AAAA;AAAA,MAAA,MAAA;;AAAA,EAAA,MAAA,GAAS,EAAA,GAAK,CAAd,CAAA;;AAAA,EACA,OAAO,CAAC,GAAR,CAAa,gBAAA,GAAe,MAA5B,CADA,CAAA;AAAA'
					}
				}
			})
			.then((chain) => {
				const actual = chain.trace(6, 10);

				const expected = {
					source: path.resolve('example.coffee'),
					line: 2,
					column: 8,
					name: null
				};

				assert.deepEqual(actual, expected);
			});
	});

	it('handles URLs that look a bit like data URIs', () => {
		return sorcery.load('samples/8/datafile.js').then((chain) => {
			const actual = chain.trace(1, 0);

			const expected = {
				source: path.resolve('samples/8/source.js'),
				line: 1,
				column: 0,
				name: null
			};

			assert.deepEqual(actual, expected);
		});
	});

	it('handles segments of length 1', () => {
		return sorcery.load('samples/8/datafile.js').then((chain) => {
			// this will throw if 1-length segments are rejected
			chain.apply();
		});
	});
});

describe('chain.trace()', () => {
	it('follows a mapping back to its origin', () => {
		return sorcery.load('samples/1/tmp/helloworld.min.js').then((chain) => {
			const actual = chain.trace(1, 31);

			const expected = {
				source: path.resolve('samples/1/tmp/helloworld.coffee'),
				line: 2,
				column: 8,
				name: 'log'
			};

			assert.deepEqual(actual, expected);
		});
	});

	it('handles browserify-style line mappings', () => {
		return sorcery.load('samples/2/tmp/bundle.min.js').then((chain) => {
			const actual = chain.trace(1, 487);

			const expected = {
				source: path.resolve('samples/2/tmp/a.js'),
				line: 2,
				column: 0,
				name: 'log'
			};

			assert.deepEqual(actual, expected);
		});
	});

	it('uses inline sources if provided', () => {
		return sorcery.load('samples/3/tmp/app.esperanto.js').then((chain) => {
			const actual = chain.trace(4, 8);

			assert.strictEqual(actual.line, 2);
			assert.strictEqual(actual.column, 8);
			assert.strictEqual(actual.name, null);
			assert.ok(/app\.js$/.test(actual.source));
		});
	});

	it('handles CSS sourcemap comments', () => {
		return sorcery.load('samples/5/tmp/styles.css').then((chain) => {
			const actual = chain.trace(1, 8);

			const expected = {
				source: path.resolve('samples/5/tmp/styles.less'),
				line: 5,
				column: 2,
				name: null
			};

			assert.deepEqual(actual, expected);
		});
	});

	it('resolves source paths using sourceRoot where applicable', () => {
		return sorcery.load('samples/7/foo.js').then((chain) => {
			const actual = chain.trace(1, 0);

			const expected = {
				source: path.resolve('samples/7/sources/baz.js'),
				line: 1,
				column: 0,
				name: null
			};

			assert.deepEqual(actual, expected);
		});
	});
});

describe('chain.apply()', () => {
	it('creates a flattened sourcemap', () => {
		return sorcery.load('samples/1/tmp/helloworld.min.js').then((chain) => {
			const map = chain.apply();
			const smc = new SourceMapConsumer(map);

			assert.equal(map.version, 3);
			assert.deepEqual(map.file, 'helloworld.min.js');
			assert.deepEqual(map.sources, ['helloworld.coffee']);
			assert.deepEqual(map.sourcesContent, [
				fs.readFileSync('samples/1/src/helloworld.coffee').toString()
			]);

			const loc = smc.originalPositionFor({ line: 1, column: 31 });
			assert.equal(loc.source, 'helloworld.coffee');
			assert.equal(loc.line, 2);
			assert.equal(loc.column, 8);
			assert.equal(loc.name, 'log');
		});
	});

	it('handles sourceMappingURLs with spaces (#6)', () => {
		return sorcery
			.load('samples/4/tmp/file with spaces.esperanto.js')
			.then((chain) => {
				const map = chain.apply();
				const smc = new SourceMapConsumer(map);

				assert.equal(map.version, 3);
				assert.deepEqual(map.file, 'file with spaces.esperanto.js');
				assert.deepEqual(map.sources, ['file with spaces.js']);
				assert.deepEqual(map.sourcesContent, [
					fs.readFileSync('samples/4/src/file with spaces.js').toString()
				]);

				const loc = smc.originalPositionFor({ line: 4, column: 8 });
				assert.equal(loc.source, 'file with spaces.js');
				assert.equal(loc.line, 2);
				assert.equal(loc.column, 8);
				assert.equal(loc.name, null);
			});
	});
});

describe('chain.write()', () => {
	it('writes a file and accompanying sourcemap', () => {
		return sorcery.load('samples/1/tmp/helloworld.min.js').then((chain) => {
			return chain.write('.tmp/write-file/helloworld.min.js').then(() => {
				return sorcery
					.load('.tmp/write-file/helloworld.min.js')
					.then((chain) => {
						const map = chain.apply();
						const smc = new SourceMapConsumer(map);

						assert.equal(map.version, 3);
						assert.deepEqual(map.file, 'helloworld.min.js');
						assert.deepEqual(map.sources, [
							'../../samples/1/tmp/helloworld.coffee'
						]);
						assert.deepEqual(map.sourcesContent, [
							fs.readFileSync(`samples/1/tmp/helloworld.coffee`, 'utf-8')
						]);

						const loc = smc.originalPositionFor({ line: 1, column: 31 });
						assert.equal(loc.source, '../../samples/1/tmp/helloworld.coffee');
						assert.equal(loc.line, 2);
						assert.equal(loc.column, 8);
						assert.equal(loc.name, 'log');
					});
			});
		});
	});

	it('overwrites existing file', () => {
		copy('samples/1/tmp', '.tmp/overwrite-file');

		return sorcery
			.load('.tmp/overwrite-file/helloworld.min.js')
			.then((chain) => {
				return chain.write().then(() => {
					const json = fs.readFileSync(
						'.tmp/overwrite-file/helloworld.min.js.map',
						'utf-8'
					);

					const map = JSON.parse(json);

					const smc = new SourceMapConsumer(map);

					assert.equal(map.version, 3);
					assert.deepEqual(map.file, 'helloworld.min.js');
					assert.deepEqual(map.sources, ['helloworld.coffee']);
					assert.deepEqual(map.sourcesContent, [
						fs.readFileSync('samples/1/src/helloworld.coffee').toString()
					]);

					const loc = smc.originalPositionFor({
						line: 1,
						column: 31
					});
					assert.equal(loc.source, 'helloworld.coffee');
					assert.equal(loc.line, 2);
					assert.equal(loc.column, 8);
					assert.equal(loc.name, 'log');
				});
			});
	});

	it('allows sourceMappingURL to be an absolute path', () => {
		return sorcery.load('samples/1/tmp/helloworld.min.js').then((chain) => {
			return chain
				.write('.tmp/helloworld.min.js', {
					absolutePath: true
				})
				.then(() => {
					const generated = fs.readFileSync('.tmp/helloworld.min.js', 'utf-8');

					const mappingURL = /sourceMappingURL=([^\s]+)/.exec(generated)[1];
					assert.equal(
						mappingURL,
						encodeURI(path.resolve('.tmp/helloworld.min.js.map'))
					);
				});
		});
	});

	it('adds a trailing newline after sourceMappingURL comment (#4)', () => {
		return sorcery.load('samples/1/tmp/helloworld.min.js').then((chain) => {
			return chain.write('.tmp/write-file/helloworld.min.js').then(() => {
				const file = fs.readFileSync(
					'.tmp/write-file/helloworld.min.js',
					'utf-8'
				);

				const lines = file.split('\n');

				// sourceMappingURL comment should be on penultimate line
				assert.ok(/sourceMappingURL/.test(lines[lines.length - 2]));

				// last line should be empty
				assert.equal(lines[lines.length - 1], '');
			});
		});
	});

	it('ensures sourceMappingURL is encoded (#6)', async () => {
		const chain = await sorcery.load(
			'samples/4/tmp/file with spaces.esperanto.js'
		);

		await chain.write('.tmp/with-spaces/file with spaces.js');
		const result = fs.readFileSync(
			'.tmp/with-spaces/file with spaces.js',
			'utf-8'
		);

		const sourceMappingURL = /sourceMappingURL=([^\r\n]+)/.exec(result)[1];
		assert.equal(sourceMappingURL, 'file%20with%20spaces.js.map');
	});

	it('allows the base to be specified as something other than the destination file', () => {
		return sorcery.load('samples/1/tmp/helloworld.min.js').then((chain) => {
			return chain
				.write('.tmp/write-file/helloworld.min.js', {
					base: 'x/y/z'
				})
				.then(() => {
					const json = fs.readFileSync(
						'.tmp/write-file/helloworld.min.js.map',
						'utf-8'
					);

					const map = JSON.parse(json);

					assert.deepEqual(map.sources, [
						'../../../samples/1/tmp/helloworld.coffee'
					]);
				});
		});
	});

	it('writes a block comment to CSS files', () => {
		return sorcery.load('samples/5/tmp/styles.css').then((chain) => {
			return chain.write('.tmp/write-file/styles.css').then(() => {
				const css = fs.readFileSync('.tmp/write-file/styles.css', 'utf-8');
				assert.ok(~css.indexOf('/*# sourceMappingURL=styles.css.map */'));
			});
		});
	});

	it('decodes/encodes URIs', () => {
		return sorcery.load('samples/6/file with spaces.js').then((chain) => {
			return chain.write('.tmp/write-file/file with spaces.js').then(() => {
				const js = fs.readFileSync(
					'.tmp/write-file/file with spaces.js',
					'utf-8'
				);

				assert.ok(
					~js.indexOf('//# sourceMappingURL=file%20with%20spaces.js.map')
				);
			});
		});
	});
});

describe('sorcery (sync)', () => {
	describe('chain.trace()', () => {
		it('follows a mapping back to its origin', () => {
			const chain = sorcery.loadSync('samples/1/tmp/helloworld.min.js');

			const actual = chain.trace(1, 31);

			const expected = {
				source: path.resolve('samples/1/tmp/helloworld.coffee'),
				line: 2,
				column: 8,
				name: 'log'
			};

			assert.deepEqual(actual, expected);
		});
	});

	describe('chain.apply()', () => {
		it('includes sourcesContent', () => {
			const chain = sorcery.loadSync('samples/1/tmp/helloworld.min.js');

			const map = chain.apply();
			const smc = new SourceMapConsumer(map);

			assert.equal(map.version, 3);
			assert.deepEqual(map.file, 'helloworld.min.js');
			assert.deepEqual(map.sources, ['helloworld.coffee']);
			assert.deepEqual(map.sourcesContent, [
				fs.readFileSync('samples/1/src/helloworld.coffee').toString()
			]);

			const loc = smc.originalPositionFor({ line: 1, column: 31 });
			assert.equal(loc.source, 'helloworld.coffee');
			assert.equal(loc.line, 2);
			assert.equal(loc.column, 8);
			assert.equal(loc.name, 'log');
		});

		it('includes user-specified content', () => {
			const javascript = `(function() {
var answer;

answer = 40 + 2;

console.log("the answer is " + answer);

}).call(this);`;

			const coffeescript = `answer = 40 + 2
console.log "the answer is #{answer}"`;

			const chain = sorcery.loadSync('example.js', {
				content: {
					'example.js': javascript,
					'example.coffee': coffeescript
				},
				sourcemaps: {
					'example.js': {
						version: 3,
						sources: ['example.coffee'],
						sourcesContent: [null],
						names: [],
						mappings:
							'AAAA;AAAA,MAAA,MAAA;;AAAA,EAAA,MAAA,GAAS,EAAA,GAAK,CAAd,CAAA;;AAAA,EACA,OAAO,CAAC,GAAR,CAAa,gBAAA,GAAe,MAA5B,CADA,CAAA;AAAA'
					}
				}
			});

			const map = chain.apply();

			assert.deepEqual(map.sourcesContent, [coffeescript]);
		});
	});

	describe('chain.writeSync()', () => {
		it('writes a file and accompanying sourcemap', () => {
			const chain = sorcery.loadSync('samples/1/tmp/helloworld.min.js');

			chain.writeSync('.tmp/write-file/helloworld.min.js');

			return sorcery.load('.tmp/write-file/helloworld.min.js').then((chain) => {
				const map = chain.apply();
				const smc = new SourceMapConsumer(map);

				assert.equal(map.version, 3);
				assert.deepEqual(map.file, 'helloworld.min.js');
				assert.deepEqual(map.sources, [
					'../../samples/1/tmp/helloworld.coffee'
				]);
				assert.deepEqual(map.sourcesContent, [
					fs.readFileSync(`samples/1/tmp/helloworld.coffee`, 'utf-8')
				]);

				const loc = smc.originalPositionFor({ line: 1, column: 31 });
				assert.equal(loc.source, '../../samples/1/tmp/helloworld.coffee');
				assert.equal(loc.line, 2);
				assert.equal(loc.column, 8);
				assert.equal(loc.name, 'log');
			});
		});
	});
});

describe('cli', () => {
	fs.readdirSync('cli').forEach((dir) => {
		if (dir[0] === '.') return;

		it(dir, async () => {
			dir = path.resolve('cli', dir);
			rimraf.sync(`${dir}/actual`);
			fs.mkdirSync(`${dir}/actual`);

			if (fs.existsSync(`${dir}/pre.js`)) {
				const module = await import(path.join(dir, 'pre.js'));
				module.default();
			}

			var command = fs
				.readFileSync(`${dir}/command.sh`, 'utf-8')
				.replace('sorcery', 'node ' + path.resolve('../bin/sorcery'));

			return new Promise((fulfil, reject) => {
				child_process.exec(
					command,
					{
						cwd: dir
					},
					async (err, stdout, stderr) => {
						if (err) return reject(err);

						if (stdout) console.log(stdout);
						if (stderr) console.error(stderr);

						if (fs.existsSync(`${dir}/post.js`)) {
							console.log(1, dir);
							const module = await import(path.join(dir, 'post.js'));
							console.log(2);
							module.default();
						}

						function catalogue(subdir) {
							subdir = path.resolve(dir, subdir);

							return glob('**/*.js?(.map)', { cwd: subdir })
								.sort()
								.map((name) => {
									var contents = fs
										.readFileSync(`${subdir}/${name}`, 'utf-8')
										.trim();

									if (path.extname(name) === '.map') {
										contents = JSON.parse(contents);
									}

									return {
										name: name,
										contents: contents
									};
								});
						}

						var expected = catalogue('expected');
						var actual = catalogue('actual');

						try {
							expected.forEach((e, i) => {
								var a = actual[i];
								assert.deepEqual(a.name, e.name);
								assert.deepEqual(a.contents, e.contents);
							});

							fulfil();
						} catch (err) {
							reject(err);
						}
					}
				);
			});
		});
	});
});

function copy(from, to) {
	try {
		fs.mkdirSync(path.dirname(to), { recursive: true });
	} catch {}

	if (fs.statSync(from).isDirectory()) {
		fs.readdirSync(from).forEach((file) => {
			copy(path.join(from, file), path.join(to, file));
		});
	} else {
		fs.copyFileSync(from, to);
	}
}
