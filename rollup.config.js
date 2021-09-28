'use strict';

import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';
import autoprefixer from 'autoprefixer';
import chalk from 'chalk';
import cpx from 'cpx';
import { config } from 'dotenv';
import glob from 'glob';
import nodeEval from 'node-eval';
import path from 'path';
import presetEnv from 'postcss-preset-env';
import 'rollup';
import postcss from 'rollup-plugin-postcss';
import { string } from 'rollup-plugin-string';
import { terser } from 'rollup-plugin-terser';
config();

const w = watch => watch ? {
  clearScreen: !!process.stdout.isTTY,
} : false;

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
});
/**
 * @param {string} q question prompt
 * @returns {Promise<string>}
 */
const question = q => new Promise(resolve => readline.question(q, answer => resolve(answer)));



/**
 * JS BUILD
 */
const jsreplace = (dev = !process.env.BUILD) => ({
  '__YT_API_KEY__': JSON.stringify(process.env.YT_API_KEY),
  '__DEV__': JSON.stringify(dev),
  'console.dev.log': dev ? 'console.log' : 'void',
  'console.dev.debug': dev ? 'console.debug' : 'void',
  'console.dev.warn': dev ? 'console.warn' : 'void',
  'console.dev.error': dev ? 'console.error' : 'void',
  'preventAssignment': true,
});
const jsplugins = () => [
  string({
    include: '**/*.svg',
  }),
  nodeResolve({
    preferBuiltins: false,
  }),
  commonjs(),
  replace({
    ...jsreplace(),
  }),
];
const js = (args) =>
  glob.sync('src/scripts/*.ts', { ignore: [ 'src/**/_*.ts', 'src/**/*.d.ts' ] }).map(e => {
    const d = e.replace(/(^|\/)src\//, '$1extension-dist/');
    // Report destination paths on console
    if (!args.silent)
      console.info(chalk`{blueBright [Rollup build]} Converting Typescript from ${e} to javascript, exporting to: ${d.replace(/.ts$/, '.js')}`);
    /**
     * @type {import('rollup').RollupOptions}
     */
    const conf = {
      input: e,
      output: {
        dir: path.dirname(d),
        format: 'iife',
        sourcemap: !process.env.BUILD,
        intro: process.env.BUILD ? '' : 'try{',
        outro: process.env.BUILD ? '' : '}catch(e){console.error(e)}',
      },
      external: false,
      context: 'window',
      plugins: [
        typescript({
          tsconfig: process.env.BUILD ? './tsconfig.prod.json' : './tsconfig.json',
        }),
        ...jsplugins(),
        process.env.BUILD && !process.env.NO_MINIFY && terser({ format: { comments: false } }),
      ],
      watch: w(args.watch),
    };
    return conf;
  });


/**
 * CSS BUILD
 */
const css = (args) =>
  glob.sync('src/styles/*.@(sa|sc|c)ss', { ignore: ['src/**/_*.@(sa|sc|c)ss'] }).map(e => {
    const d = e.replace(/(^|\/)src\//, '$1extension-dist/');
    const ext = e.match(/.(sa|sc|c)ss$/)[1];
    // Report destination paths on console
    if (!args.silent)
      console.info(chalk`{blueBright [Rollup build]} Converting ${ext}ss from ${e} to css, exporting to: ${d.replace(/.(sa|sc|c)ss$/, '.css')}`);
    /**
     * @type {import('rollup').RollupOptions}
     */
    const conf = {
      input: e,
      output: {
        dir: path.dirname(d),
      },
      plugins: [
        postcss({
          plugins: [ autoprefixer(), presetEnv() ],
          extract: true,
          sourceMap: !process.env.BUILD,
          fiber: require('fibers'),
        }),
        remove(),
      ],
      watch: w(args.watch),
    };
    return conf;
  });


/**
 * OTHER FILES BUILD
 */
const other = (args) => {
  if (!args.silent)
    console.info(chalk`{blueBright [Rollup build]} Copying files`);
  (args.watch ? cpx.watch : cpx.copySync)('src/**/*.!(d.ts|ts|js|xcf|@(sa|sc|c)ss)', 'extension-dist');

  if (!args.silent)
    console.info(chalk`{blueBright [Rollup build]} Generating manifest`);
  /**
   * @type {import('rollup').RollupOptions}
   */
  const conf = {
    input: 'src/manifest.ts',
    output: {
      dir: 'extension-dist',
      format: 'cjs',
      exports: 'default',
    },
    plugins: [
      typescript({
        tsconfig: process.env.BUILD ? './tsconfig.prod.json' : './tsconfig.json',
        sourceMap: false,
      }),
      replace({
        __VERSION__: JSON.stringify(process.env.npm_package_version),
        preventAssignment: true,
      }),
      writeJSON(),
    ],
    watch: w(args.watch),
  };
  return conf;
};


/**
 * TESTS BUILD
 */
/**
 * @return {import('rollup').RollupOptions}
 */
const testsInternal = () => ({
  output: {
    format: 'esm',
    exports: 'auto',
    sourcemap: false, // for some reason it seems jest includes some source-map translation itself, `true` breaks for coverage
  },
  context: 'window',
  plugins: [
    typescript({
      tsconfig: './tests/tsconfig.json',
    }),
    string({
      include: '**/*.svg',
    }),
    replace({
      __NEBULA_PASS__: JSON.stringify(process.env.NEBULA_PASS),
      __NEBULA_USER__: JSON.stringify(process.env.NEBULA_USER),
      __NEBULA_BASE__: JSON.stringify(process.env.NEBULA_BASE || 'https://nebula.app'),
      ...jsreplace(false),
    }),
  ],
});


/**
 * HELPERS
 */
/**
 * @returns {import('rollup').Plugin}
 */
function remove() {
  return {
    generateBundle(_, bundle, isWrite) {
      if (!isWrite)
        return;
      for (const prop in bundle) {
        if (!bundle[prop].code) continue;
        if (bundle[prop].code === '\n' ||
          bundle[prop].code.trim() === 'var undefined$1 = undefined;\n\nexport default undefined$1;' ||
          bundle[prop].code.trim() === 'var undefined$1 = undefined;\n\nexport { undefined$1 as default };')
          delete bundle[prop];
      }
    },
  };
}

/**
 * @returns {import('rollup').Plugin}
 */
function writeJSON(filename = 'manifest.js') {
  return {
    generateBundle(_, bundle, isWrite) {
      if (!isWrite)
        return;
      const manifest = nodeEval(bundle[filename].code);
      this.emitFile({
        type: 'asset',
        fileName: filename.replace(/\.js$/, '.json'),
        source: JSON.stringify(manifest, null, process.env.BUILD ? undefined : 2),
      });
      delete bundle[filename];
    },
  };
}


export default async args => {
  if (!process.env.YT_API_KEY) {
    console.warn(chalk.stderr.red.bold`YouTube API key empty!`);
    const input = await question('Proceed? (y/[n]) ');
    if (input.toLowerCase() != 'y')
      process.exit(-1);
  }
  readline.close();

  if (!args.silent)
    console.info(`Build mode ${process.env.BUILD ? 'on' : 'off'}.`);

  const type = args.configType?.toLowerCase();
  switch (type) {
    case 'js':
      return js(args);
    case 'css':
      return css(args);
    case 'other':
      return other(args);
    case 'tests-internal':
      return testsInternal();
    case 'all':
    default:
      return [ ...js(args), ...css(args), other(args) ];
  }
};