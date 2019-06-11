module.exports = {
  parser: "babel-eslint",
  extends: ["airbnb", "prettier"],
  root: true,
  plugins: ["import", "babel", "prettier"],
  settings: {
    "import/resolver": {
      node: {
        moduleDirectory: ["node_modules", "/"]
      }
    }
  },
  env: {
    browser: true,
    node: true
  },
  rules: {
    "react/jsx-no-bind": 0,
    "react/sort-comp": 0,
    "comma-dangle": [2, "never"],
    "no-shadow": 0,
    "no-new": 0,
    "new-cap": 0,
    "max-len": 0,
    "brace-style": [2, "stroustrup"]
  },
  plugins: ["react"]
};
