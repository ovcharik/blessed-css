import { readFileSync } from "fs";
import { join } from "path";

import Vue from "blessed-vue";
import Css from "blessed-css";

import LoginForm from "./login-form.vue";

const instance = new Vue({
  name: "app",

  components: {
    LoginForm,
  },

  template: `
    <screen ref="screen" :smartCSR="true" :keys="true">
      <login-form />
    </screen>
  `,

  mounted() {
    const screen = this.$refs.screen;
    const css = readFileSync(join(__dirname, "style.css"), "utf8");
    Css.attach(screen, css);

    screen.key(["C-c"], () => {
      process.exit(0);
    });
  },
});

const el = Vue.dom.createElement();
Vue.dom.append(el);
instance.$mount(el);
