'use strict';

import 'rollup';
import typescript from 'rollup-plugin-typescript';
import glob from 'glob';

export default glob.sync('src/**/*.ts', { ignore: [ 'src/**/_*.ts', 'src/**/*.d.ts' ] }).map(e => {
    const d = e.replace(/(^|\/)src\//, '$1extension-dist/').replace(/.ts$/, '.js');
    // Report destination paths on console
    console.info(`\u001b[36m\[Rollup build\]\u001b[97m \nConverting Typescript from ${e} to javascript, exporting to: ${d}`);
    return {
        input: e,
        output: {
            format: 'iife',
            file: d
        },
        external: false,
        plugins: [
            typescript()
        ]
    };
});