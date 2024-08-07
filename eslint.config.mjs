import typescriptEslint from "@typescript-eslint/eslint-plugin";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [
    ...compat.extends("eslint:recommended", "plugin:@typescript-eslint/recommended"),
    {
        plugins: {
            "@typescript-eslint": typescriptEslint,
        },

        languageOptions: {
            globals: {
                ...globals.browser,
            },

            parser: tsParser,
            ecmaVersion: 12,
            sourceType: "module",
        },

        rules: {
            "@typescript-eslint/explicit-module-boundary-types": "off",
            "@typescript-eslint/no-explicit-any": "off",
            "array-bracket-newline": ["error", "consistent"],

            "array-bracket-spacing": ["error", "always", {
                singleValue: false,
            }],

            "array-element-newline": ["error", "consistent"],
            "arrow-spacing": "error",
            "block-spacing": "error",
            "brace-style": ["error", "1tbs"],
            camelcase: "error",
            "comma-dangle": ["error", "always-multiline"],
            "computed-property-spacing": ["error", "never"],
            "func-call-spacing": ["error", "never"],

            indent: ["error", 2, {
                SwitchCase: 1,
            }],

            "key-spacing": "error",
            "keyword-spacing": "error",
            "linebreak-style": ["error", "unix"],
            "new-cap": "error",
            "new-parens": ["error", "always"],

            "newline-per-chained-call": ["error", {
                ignoreChainWithDepth: 3,
            }],

            "no-constant-condition": "off",
            "no-duplicate-imports": "error",
            "no-empty": "off",
            "no-lonely-if": "error",
            "no-multi-spaces": "error",
            "no-trailing-spaces": "error",
            "no-unneeded-ternary": "error",
            "no-var": "error",

            "object-curly-newline": ["error", {
                consistent: true,
            }],

            "object-curly-spacing": ["error", "always"],
            "object-shorthand": ["error", "always"],
            "operator-linebreak": ["error", "after"],
            "padded-blocks": ["error", "never"],
            "prefer-arrow-callback": "error",
            "prefer-const": "error",

            "prefer-destructuring": ["error", {
                object: true,
            }],

            "prefer-rest-params": "off",
            "quote-props": ["error", "consistent-as-needed"],
            quotes: ["error", "single"],
            "rest-spread-spacing": "error",
            semi: ["error", "always"],
            "semi-spacing": "error",
            "semi-style": ["error", "last"],

            "sort-imports": ["error", {
                ignoreDeclarationSort: true,
            }],

            "space-before-blocks": "error",

            "space-before-function-paren": ["error", {
                named: "never",
            }],

            "space-in-parens": ["error", "never"],
            "space-infix-ops": "error",

            "space-unary-ops": ["error", {
                nonwords: false,
                words: true,
            }],

            "template-curly-spacing": ["error", "never"],
        },
    },
    {
        files: ["tests/**/*.ts"],

        languageOptions: {
            globals: {
                ...globals.jest,
            },
        },

        rules: {
            "@typescript-eslint/no-var-requires": "off",
            "@typescript-eslint/triple-slash-reference": "off",
            "no-global-assign": "off",
        },
    },
    {
        files: ["**/*.js", "**/*.cjs"],

        languageOptions: {
            globals: {
                ...Object.fromEntries(Object.entries(globals.browser).map(([key]) => [key, "off"])),
                ...globals.node,
            },
        },

        rules: {
            "@typescript-eslint/no-var-requires": "off",
        },
    },
];