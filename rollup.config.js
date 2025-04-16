const path = require('path');
import json from '@rollup/plugin-json' // 支持在源码中直接引入json文件，不影响下面的
import merge from 'lodash.merge';
import pkg from './package.json';
import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import url from "rollup-plugin-url";

import {terser} from 'rollup-plugin-terser';
// import {uglify} from 'rollup-plugin-uglify';
import {eslint} from 'rollup-plugin-eslint';

import postcss from 'rollup-plugin-postcss'
import scss from 'rollup-plugin-scss';
import sass from 'rollup-plugin-sass';
import copy from 'rollup-plugin-copy'

// Banner
const bannerData = [
	`${pkg.name} - v${pkg.version}`,
	`(c) ${(new Date()).getFullYear()} ${pkg.author}`,
	`License: ${pkg.license}`
];
// Plugins
const pluginSettings = {
	eslint: {
		exclude: ['node_modules/**', './package.json', '**.css', '**.scss'],
		throwOnWarning: false,
		throwOnError: true
	},
	babel: {
		exclude: ['node_modules/**'],
		presets: [
			['@babel/preset-env', {
				modules: false,
				targets: {
					browsers: ['ie >= 9']
				}
			}]
		]
	},
	url: {
		limit: 10 * 1024, // inline files < 10k, copy files > 10k
		include: ["**/*.svg"], // defaults to .svg, .png, .jpg and .gif files
		emitFiles: true // defaults to true
	},
	terser: {
		compress: {
			dead_code: true,
			drop_console: true,
			drop_debugger: true
		},
		mangle: {
			toplevel: true,
			properties: {
				regex: /^_/
			}
		},
		output: {
			beautify: false,
			comments: 'some'
		}
	},
	/*uglify: {
		beautify: {
			compress: false,
			mangle: false,
			output: {
				beautify: true,
				comments: /(?:^!|@(?:license|preserve))/
			}
		},
		minify: {
			compress: true,
			mangle: true,
			output: {
				comments: new RegExp(pkg.name)
			}
		}
	}*/

}

// Config Base
const config = {
	output: {
		banner: `/*!\n * ${bannerData.join('\n * ')}\n */`,
		sourcemap: true
	},
	plugins: [
		json(),
		url(pluginSettings.url),
		resolve(),
		eslint(pluginSettings.eslint),
		babel(pluginSettings.babel)
	],
	watch: {
		clearScreen: false
	}
}
const indexCjs = merge({}, config, {
	input: path.resolve(__dirname, 'src', 'index.js'),
	output: {
		file: path.resolve(__dirname, 'dist', 'index.js'),
		format: 'cjs'
	},
	plugins: [
		terser(pluginSettings.terser)
		// uglify(pluginSettings.uglify.minify)
	]
})
// const pluginCjs = merge({}, config, {
// 	input: path.resolve(__dirname, 'src', 'book', 'plugin.js'),
// 	output: {
// 		file: path.resolve(__dirname, 'dist', 'book', 'plugin.js'),
// 		format: 'cjs'
// 	},
// 	plugins: [
// 		uglify(pluginSettings.uglify.minify),
// 		copy({
// 			targets: [
// 				{src: ['./src/**/*.css'], dest: 'dist/book'},
// 			]
// 		})
// 	]
// })
const indexCss = {
	input: path.resolve(__dirname, 'src', 'book', 'plugin.js'),
	output: {
		file: '',
		format: 'esm'
	},
	plugins: [
		scss({
			output: path.resolve(__dirname, 'dist', 'index.css'),
		}),
	]
}
export default [
	indexCjs,
	// pluginCjs,
	indexCss,
];
