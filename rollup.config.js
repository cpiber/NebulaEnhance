'use strict';

import 'rollup';
import typescript from '@rollup/plugin-typescript';
import { string } from 'rollup-plugin-string';
import nodeResolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import glob from 'glob';

console.info(`Build mode ${process.env.BUILD ? 'on' : 'off'}`);
export default glob.sync('src/**/*.ts', { ignore: [ 'src/**/_*.ts', 'src/**/*.d.ts' ] }).map(e => {
    const d = e.replace(/(^|\/)src\//, '$1extension-dist/').replace(/.ts$/, '.js');
    // Report destination paths on console
    console.info(`\u001b[36m\[Rollup build\]\u001b[97m Converting Typescript from ${e} to javascript, exporting to: ${d}`);
    return {
        input: e,
        output: {
            format: 'iife',
            sourcemap: !process.env.BUILD,
            file: d,
            intro: process.env.BUILD ? '' : 'try {',
            outro: process.env.BUILD ? '' : '}catch(e){console.error(e)}',
        },
        external: false,
        context: "window",
        plugins: [
            typescript({
                tsconfig: process.env.BUILD ? "./tsconfig.prod.json" : "./tsconfig.json",
            }),
            string({
                include: "**/*.svg"
            }),
            nodeResolve(),
            process.env.BUILD && terser({ format: { comments: false } })
        ]
    };
});