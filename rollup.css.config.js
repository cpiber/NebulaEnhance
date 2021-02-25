'use strict';

import 'rollup';
import postcss from 'rollup-plugin-postcss';
import autoprefixer from 'autoprefixer';
import presetEnv from 'postcss-preset-env';
import glob from 'glob';
import path from 'path';

console.info(`Build mode ${process.env.BUILD ? 'on' : 'off'}`);
const w = process.env.ROLLUP_WATCH ? {
        clearScreen: false,
    } : false;
export default glob.sync('src/**/*.@(sa|sc|c)ss', { ignore: [ 'src/**/_*.@(sa|sc|c)ss' ] }).map(e => {
    const d = e.replace(/(^|\/)src\//, '$1extension-dist/').replace(/.(sa|sc|c)ss$/, '.css');
    // Report destination paths on console
    console.info(`\u001b[36m\[Rollup build\]\u001b[97m Converting (sa|sc|c)ss from ${e} to css, exporting to: ${d}`);
    return {
        input: e,
        output: {
            dir: path.dirname(e.replace(/(^|\/)src\//, '$1extension-dist/')),
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
        watch: w
    };
});

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