import js from "@eslint/js";
import globals from "globals";

export default [
    {
        ...js.configs.recommended,
        files: ["src/**/*.js", "test/**/*.js"],
        ignores: ["src/js/lib/*"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: {
                ...globals.browser,
                // __USE_SERVICE_WORKERS__: "readonly"
            }
        }
    },
    {
        files: ["src/**/*.js", "test/**/*.js"],
        ignores: ["src/js/lib/*"],
        rules: {
            "indent": [
                "error",
                4
            ],
            "linebreak-style": [
                "error",
                "windows"
            ],
            "quotes": [
                "error",
                "double"
            ],
            "semi": [
                "error",
                "always"
            ],
            "require-await": ["error"],
            "comma-spacing": ["error"],
            "prefer-const": ["error"],
            "no-multi-spaces": ["error"]
        }
    }
];
