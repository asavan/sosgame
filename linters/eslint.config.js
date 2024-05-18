import js from "@eslint/js";
import globals from "globals";

export default [
    {
        ...js.configs.recommended,
        files: ["src/**/*.js", "test/**/*.js"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: {
                ...globals.browser,
                myCustomGlobal: "readonly"
            }
        },
        // rules: {
        //     "indent": [
        //         "error",
        //         4
        //     ],
        //     "linebreak-style": [
        //         "error",
        //         "windows"
        //     ],
        //     "quotes": [
        //         "error",
        //         "double"
        //     ],
        //     "semi": [
        //         "error",
        //         "always"
        //     ]
        // }
    },
    {
        files: ["src/**/*.js", "test/**/*.js"],
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
            ]
        }
    }
];
