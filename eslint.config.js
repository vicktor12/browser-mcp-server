import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["node_modules/"] },
  js.configs.recommended,
  { languageOptions: { globals: globals.node } },
  {
    // Callbacks de page.evaluate / waitForFunction executam no contexto do navegador
    files: ["tools/read_page.js", "tools/wait_for.js"],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
];
