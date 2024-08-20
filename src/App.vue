<template>
  <div class="app-container">
    <CustomCalendar />
  </div>
</template>

<script>
import CustomCalendar from './components/CustomCalendar.vue'

export default {
  name: 'App',
  components: {
    CustomCalendar
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

.app-container {
  width: 100vw;
  height: 100vh;
  display: flex; 
  justify-content: center;
  align-items: center;
}
</style>
