import vue from "rollup-plugin-vue";
import css from "rollup-plugin-css-only";

export default {
  input: "src/index.js",
  output: {
    file: "dist/index.js",
    format: "cjs",
  },
  plugins: [css({ output: "dist/style.css" }), vue({ css: false })],
};
