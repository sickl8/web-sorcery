import buble from '@rollup/plugin-buble';
import commonjs from '@rollup/plugin-commonjs';
import node from '@rollup/plugin-node-resolve';
import { defineConfig } from 'rollup';

export default defineConfig({
	input: 'src/index.js',
	output: [
		{
			file: 'dist/sorcery.cjs.js',
			format: 'cjs'
		},
		{
			file: 'dist/sorcery.es6.js',
			format: 'esm'
		}
	],
	plugins: [
		commonjs({
			include: 'node_modules/**'
		}),
		node({
			jsnext: true,
			main: true,
			skip: [ 'path', 'sander', 'buffer-crc32' ]
		}),
		buble({
			exclude: 'node_modules/**'
		})
	],
	external: [ 'path', 'sander', 'buffer-crc32' ]
});
