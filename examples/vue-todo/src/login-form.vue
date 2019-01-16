<template>
  <form class="login-form">
    <box class="form-title" content="Login Form"/>

    <box class="input-row" :top="3">
      <text>Username:</text>
      <textbox ref="username" :width="30" :length="10" :value="username" @submit="submitUsername"/>
    </box>

    <box class="input-row" :top="5">
      <text>Password:</text>
      <textbox
        ref="password"
        :width="30"
        :length="10"
        :value="username"
        :censor="true"
        @submit="submitUsername"
      />
    </box>

    <checkbox
      :checked="rememberMe"
      @check="updateRememberMe(true)"
      @uncheck="updateRememberMe(false)"
      text="remember me"
    />

    <button content="Login" :class="{ submitting: submitting }" @press="login"/>

    <message ref="message"/>
  </form>
</template>

<script>
export default {
  name: "login-form",
  data: () => {
    return {
      username: "",
      password: "",
      rememberMe: false,
      submitting: false
    };
  },
  methods: {
    submitUsername(username) {
      this.username = username;
    },
    submitPassword(password) {
      this.password = password;
    },
    updateRememberMe(val) {
      this.rememberMe = val;
    },
    login() {
      this.submitting = true;
      this.$refs.message.log(
        `Logging in. Username: ${this.username}, password: ${
          this.password
        }, rememberMe: ${this.rememberMe}`,
        3,
        () => {
          this.$refs.message.log("Logged in", 1, () => {
            this.submitting = false;
          });
        }
      );
    }
  },
  mounted() {
    this.$refs.username.focus();
    this.$refs.message.hide();
  }
};
</script>

<style lang="less">
* {
  keyable: true;
  mouseable: true;
}

form {
  width: 50%;
  height: 20;
  left: center;
  top: center;
  background: white;

  & > box:first-child {
    width: 100%;
    height: 1;
    left: center;
    top: 1;
    align: center;
    background: white;
    color: black;
    bold: true;
  }

  & > box:nth-of-type(2),
  & > box:nth-of-type(3) {
    width: 100%;
    height: 1;
    background: white;

    & > text {
      height: 1;
      left: "50%-20";
      bold: true;
    }

    & > textbox {
      width: 30;
      height: 1;
      left: "50%-8";
      background: blue;
      color: white;
    }
  }

  & > checkbox {
    width: 20;
    height: 1;
    left: center;
    top: 7;
    background: blue;
  }

  & > button {
    width: 20;
    height: 3;
    left: center;
    top: 9;
    align: center;
    vertical-align: middle;
    background: blue;
    color: white;

    &.submitting {
      background: gray;
    }
  }

  & > message {
    width: 50;
    height: 5;
    left: center;
    top: center;
    align: center;
    vertical-align: middle;
  }
}
</style>
