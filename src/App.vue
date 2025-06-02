<template>
  <GameContainer />
</template>

<script setup>
import GameContainer from './components/GameContainer.vue';
</script>

<style>
/* Import base styles */
@import './assets/base.css';

/* Global styles if needed */
body {
  margin: 0;
  padding: 0;
  background-color: #1a1a1a; /* Example background */
  overflow: hidden; /* Prevent scrollbars */
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
