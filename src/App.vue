<template>
  <div id="app">
    <PhaserVueMinimo />
  </div>
</template>

<script>
import PhaserVueMinimo from './components/phaser-vue-ajustado.vue'

export default {
  name: 'App',
  components: {
    PhaserVueMinimo
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 20px;
}
</style>
