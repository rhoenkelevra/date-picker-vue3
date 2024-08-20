<template>
  <div class="app-container">
    <CustomCalendar v-model="selectedDateTime"/>
  </div>
</template>

<script>
import CustomCalendar from './components/CustomCalendar.vue'
import moment from 'moment'

export default {
  name: 'App',
  components: {
    CustomCalendar
  },
  data(){
    return {
      selectedDateTime: moment('2023-01-01 10:10').format()
    }
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
