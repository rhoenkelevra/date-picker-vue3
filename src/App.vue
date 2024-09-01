<template>
  <div class="app-container">
    <div class="calendar-container">
      <CustomCalendar v-model="selectedDateTime" :dateonly="true"/>
      <p>{{ selectedDateTime }}</p>
    </div>
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
  },
  watch: {
    selectedDateTime: {
      handler(newVal){
        console.log('newVal type', typeof newVal)
      }
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
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
