import typescript from 'rollup-plugin-typescript2';
import commonjs from 'rollup-plugin-commonjs';
import clear from 'rollup-plugin-clear';
import json from 'rollup-plugin-json';
import serve from 'rollup-plugin-serve'; 
import resolve from 'rollup-plugin-node-resolve';
// import babel from 'rollup-plugin-babel';

import path from 'path';
import livereload  from 'rollup-plugin-livereload';

import tsconfig from './tsconfig.json';

const resolveFile = function(filePath) {
  return path.join(__dirname, filePath)
}


export default {
  // input: './src/mp4box/index.js',
  input: './src/index.ts',
  output: [
    {
      name: 'MP4Player',
      file: 'lib/index.iife.js',
      format: 'iife',
      sourcemap: true,
    },
    {
      name: 'MP4Player',
      format: 'cjs',
      file: 'lib/index.cjs.js',
      sourcemap: true,
    },
    {
      name: 'MP4Player',
      format: 'umd',
      file: 'lib/index.umd.js',
      sourcemap: true,
    },
  ],
	plugins: [
    // babel({
    //   babelrcRoots: ['.', './packages/*'],
    //   presets: [
    //     ['@babel/preset-env'],
    //   ],
    //   plugins: ['@babel/plugin-proposal-class-properties'],
    // }),
    // 解析node环境，配置axios使用browswer环境
    resolve(),
		commonjs(),
		clear({
			targets: [ 'lib' ]
		}),
		typescript({
			exclude: 'node_modules/**',
			tsconfigDefaults: tsconfig
    }),
   
		json({
			compact: true
    }),
    //  开发配置
    serve({  
      port: 3001,
      contentBase: [resolveFile('examples'), resolveFile('lib')]
    }),
    livereload(resolveFile('lib'))
	],
	
};
