const { ESLint } = require("eslint");

module.exports = {
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
    },
    rules: {
      "no-console": "warn",
      "semi": ["warn", "always"]
    }
  };