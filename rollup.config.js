'use strict';

import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';
import autoprefixer from 'autoprefixer';
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
        clearScreen: false,
    } : false;

const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});
/**
 * @param {string} q question prompt
 * @returns {Promise<string>}
 */
const question = q => new Promise(resolve => readline.question(q, answer => resolve(answer)));



/**
 * JS BUILD
 */
const jsplugins = () => [
    string({
        include: "**/*.svg",
    }),
    nodeResolve({
        preferBuiltins: false,
    }),
    commonjs(),
    replace({
        '__YT_API_KEY__': JSON.stringify(process.env.YT_API_KEY),
        preventAssignment: true,
    })
];
const js = (args) =>
    glob.sync('src/**/*.ts', { ignore: [ 'src/**/_*.ts', 'src/**/*.d.ts' ] }).map(e => {
        const d = e.replace(/(^|\/)src\//, '$1extension-dist/');
        // Report destination paths on console
        if (!args.silent)
            console.info(`\u001b[36m\[Rollup build\]\u001b[0m Converting Typescript from ${e} to javascript, exporting to: ${d.replace(/.ts$/, '.js')}`);
        /**
         * @type {import('rollup').RollupOptions}
         */
        const conf = {
            input: e,
            output: {
                dir: path.dirname(d),
                format: 'iife',
                sourcemap: !process.env.BUILD,
                intro: process.env.BUILD ? '' : 'try {',
                outro: process.env.BUILD ? '' : '}catch(e){console.error(e)}',
            },
            external: false,
            context: "window",
            plugins: [
                typescript({
                    tsconfig: process.env.BUILD ? "./tsconfig.prod.json" : "./tsconfig.json",
                }),
                ...jsplugins(),
                process.env.BUILD && terser({ format: { comments: false } })
            ],
            watch: w(args.watch)
        };
        return conf;
    });


/**
 * CSS BUILD
 */
const css = (args) =>
    glob.sync('src/**/*.@(sa|sc|c)ss', { ignore: [ 'src/**/_*.@(sa|sc|c)ss' ] }).map(e => {
        const d = e.replace(/(^|\/)src\//, '$1extension-dist/');
        // Report destination paths on console
        if (!args.silent)
            console.info(`\u001b[36m\[Rollup build\]\u001b[0m Converting (sa|sc|c)ss from ${e} to css, exporting to: ${d.replace(/.(sa|sc|c)ss$/, '.css')}`);
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
                    plugins: [autoprefixer(), presetEnv()],
                    extract: true,
                    sourceMap: !process.env.BUILD,
                    fiber: require('fibers')
                }),
                remove(),
            ],
            watch: w(args.watch)
        };
        return conf;
    });


/**
 * OTHER FILES BUILD
 */
const other = (args) => {
    if (!args.silent)
        console.info(`\u001b[36m\[Rollup build\]\u001b[0m Copying files`);
    (args.watch ? cpx.watch : cpx.copySync)('src/**/*.!(d.ts|ts|js|xcf|@(sa|sc|c)ss)', 'extension-dist');

    if (!args.silent)
        console.info(`\u001b[36m\[Rollup build\]\u001b[0m Generating manifest`);
    /**
     * @type {import('rollup').RollupOptions}
     */
    const conf = {
        input: './src/manifest.js',
        output: {
            dir: 'extension-dist',
            format: 'cjs',
            exports: 'default'
        },
        plugins: [
            replace({
                '__VERSION__': JSON.stringify(process.env.npm_package_version),
                preventAssignment: true,
            }),
            writeManifest()
        ],
        watch: w(args.watch)
    };
    return conf;
};


/**
 * TESTS BUILD
 */
const tests = (args) =>
    glob.sync('tests/**/*.ts', { ignore: [ 'tests/**/_*.ts', 'tests/**/*.d.ts' ] }).map(e => {
        const d = e.replace(/(^|\/)tests\//, '$1__tests__/');
        // Report destination paths on console
        if (!args.silent)
            console.info(`\u001b[36m\[Rollup build\]\u001b[0m Converting Typescript from ${e} to javascript, exporting to: ${d.replace(/.ts$/, '.js')}`);
        /**
         * @type {import('rollup').RollupOptions}
         */
        const conf = {
            input: e,
            output: {
                dir: path.dirname(d),
                format: 'cjs',
                globals: 'fetch'
            },
            external: [ 'node-fetch', 'jsdom' ],
            context: "window",
            plugins: [
                typescript({
                    tsconfig: "./tsconfig.json",
                    target: "ESNext",
                }),
                ...jsplugins(),
                replace({
                    '__YT_API_KEY__': JSON.stringify(process.env.YT_API_KEY),
                    '__NEBULA_PASS__': JSON.stringify(process.env.NEBULA_PASS),
                    '__NEBULA_USER__': JSON.stringify(process.env.NEBULA_USER),
                    preventAssignment: true,
                }),
            ],
            watch: w(args.watch)
        };
        return conf;
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
                if (bundle[prop].code === '\n' || bundle[prop].code.trim() === 'var undefined$1 = undefined;\n\nexport default undefined$1;')
                    delete bundle[prop];
            }
        }
    };
}

/**
 * @returns {import('rollup').Plugin}
 */
function writeManifest() {
    return {
        generateBundle(_, bundle, isWrite) {
            if (!isWrite)
                return;
            const manifest = nodeEval(bundle['manifest.js'].code);
            this.emitFile({
                type: 'asset',
                fileName: 'manifest.json',
                source: JSON.stringify(manifest)
            });
            delete bundle['manifest.js'];
        }
    };
}


export default async args => {
    if (!process.env.YT_API_KEY) {
        console.warn('\u001b[91m\u001b[1mYouTube API key empty!\u001b[0m')
        const input = await question('Proceed? (y/[n]) ');
        if (input.toLowerCase() != 'y')
            process.exit(-1);
    }
    readline.close();

    if (!args.silent)
        console.info(`Build mode ${process.env.BUILD ? 'on' : 'off'}`);
    
    const type = args.type?.toLowerCase();
    delete args.type;
    switch (type) {
        case "js":
            return js(args);
        case "css":
            return css(args);
        case "other":
            return other(args);
        default:
        case "all":
            return [...js(args), ...css(args), other(args)];
        case "tests":
            return tests(args);
    }
};