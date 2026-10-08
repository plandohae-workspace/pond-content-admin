import js from '@eslint/js';
import globals from 'globals';
export default [ {ignores:['dist/**','node_modules/**']}, js.configs.recommended, {files:['src/**/*.{js,jsx}'],languageOptions:{ecmaVersion:'latest',sourceType:'module',globals:{...globals.browser},parserOptions:{ecmaFeatures:{jsx:true}}},rules:{'no-unused-vars':'off'}}, {files:['**/*.test.js','tests/**/*.mjs','scripts/**/*.mjs'],languageOptions:{globals:{...globals.node,...globals.browser}}} ];
