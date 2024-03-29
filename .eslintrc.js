module.exports = {
    env: {
        browser: true,
        es2021: true,
    },
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "airbnb",
        "airbnb/hooks",
    ],
    settings: { "import/resolver": { node: { extensions: [".js", ".jsx", ".ts", ".tsx"] } } },
    overrides: [
        {
            env: { node: true },
            files: [
                ".eslintrc.{js,cjs}",
            ],
            parserOptions: { sourceType: "script" },
        },
    ],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
    plugins: [
        "@typescript-eslint",
    ],
    rules: {
        indent: [
            "error",
            4,
            { ignoredNodes: ["PropertyDefinition"] },
        ],
        "linebreak-style": [
            "error",
            "unix",
        ],
        quotes: [
            "error",
            "double",
        ],
        semi: [
            "error",
            "always",
        ],
        "max-len": [
            "error",
            120,
        ],
        "no-use-before-define": "warn",
        "no-array-constructor": [
            "off",
        ],
        "import/prefer-default-export": "off",
        "class-methods-use-this": "off",
        "import/extensions": [
            "error",
            "ignorePackages",
            {
                js: "never",
                jsx: "never",
                ts: "never",
                tsx: "never",
            },
        ],
    },
};
