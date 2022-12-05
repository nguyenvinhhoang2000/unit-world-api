const OFF = 0,
    WARN = 1,
    ERROR = 2

module.exports = {
    env: {
        browser: true,
        commonjs: true,
        es2021: true,
        node: true,
    },
    extends: 'eslint:recommended',
    parserOptions: {
        ecmaVersion: 12,
    },
    plugins: [],
    rules: {
        'no-unused-vars': WARN,
        'no-useless-escape': OFF,
        'no-async-promise-executor': OFF,
        'no-constant-condition': ERROR,
        'no-prototype-builtins': OFF,
        'no-extra-boolean-cast': OFF,
    },
}
