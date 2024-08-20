<template>
    <input @click="togglePicker"/>
    <div v-if="showPicker" class="calendar-container">
        <div class="header d-flex justify-content-between align-items-center">
            <button class="nav-icon" @click="previousMonth"><font-awesome-icon icon="chevron-left" /></button>
            <div class="calendar-year-month">{{ currentDate.format('YYYY年MM月')}}</div>
            <button class="nav-icon" @click="nextMonth"><font-awesome-icon icon="chevron-right" /></button>
        </div>
        <div class="calendar w-100 mt-2">
            <div v-for="weekday in weekdays" :key="weekday">
                <span>{{ weekday }}</span>
            </div>
            <div v-for="day, index in monthDays" :key="day" >
                <span 
                @click="setSelected(day)"
                :class="{
                    'calendar-days': day.isValid(),
                    'today': isToday(day),
                    'sunday': isSunday(index),
                    'saturday': isSaturday(index),
                    'selected-date': isSelected(day)
                }">{{ day.isValid() ? day.format('D') : '' }}</span>
            </div>
        </div>
        <span>{{ format(selectedDate) }}</span>
        <div class="time-picker">

        </div>
    </div>

</template>

<script>
import moment from 'moment'
import 'moment/locale/ja';  // Import Japanese locale data

// Set the default locale to Japanese
moment.locale('ja');

export default {
    props: {
        // modelValue follows vue3 nomenclature for bind model props
        // expects a date as string
        modelValue: {
            type: String,
            default: moment().format()
        }

    },
    data(){
        return {
            showPicker: false,
            dateFormat: 'YYYY年M月D日 HH:mm',
            weekdays: ['日', '月', '火', '水', '木', '金', '土'],
            monthDays: [],
            today: moment(),
            currentDate: moment(),
            selectedDate: null, // this will later become the iptValue, using v-model
        }
    },
    methods: {
        togglePicker(){
            this.showPicker = !this.showPicker
        },
        getDayOfWeek(date=""){
            return moment().day(date)
        },
        getMonth(date=""){
           return moment().month(date) 
        },
        getYear(date=""){
            return moment().month(date)
        },
    
        setSelected(day) {
            if (day.isValid()) {
                this.selectedDate = day.clone();
            }
        },
        isSelected(day) {
            return this.selectedDate && day.isValid() && day.isSame(this.selectedDate, 'day');
        },
        nextMonth(){
            this.currentDate.add(1, 'month')
            this.fillCalendar()
        },
        previousMonth(){
            this.currentDate.subtract(1, 'month')
            this.fillCalendar()
        },
        selectMonth(){},
        selectYear(){},

        isToday(day) {
            if (!day) return false
            const today = moment()
            return today.date() === day.date()
        },
        isSunday(index) {
            return (index % 7 === 0) && this.monthDays[index].isValid()
        },
        isSaturday(index) {
            return (index % 7 === 6) && this.monthDays[index].isValid()
        },
        firstDayAsWeekday() {
            return this.currentDate.clone().date(1).day()
        },
        // createCalendar() {
        //     const today = moment().format("D");
        //     const lastDay = ;
        //     console.log(today)
        //     console.log(moment().date(1).day())
        //     console.log(moment().day())
        // },
        fillCalendar(){
            this.monthDays = []
            let result = []
            const lastDayMonth = parseInt(this.currentDate.clone().endOf('month').format("D"))
            const firstWeekDay = this.firstDayAsWeekday()

            // fill blanks until first day of the month
            for(let j=0; j<firstWeekDay; j++){
                result.push(moment(null))
            }

            // fill the days of the month
            for(let i=1; i <= lastDayMonth; i++){
                const thisDate = this.currentDate.clone().date(i);
                result.push(thisDate)
            }

            this.monthDays = result
        },
        format(value) {
            if (!value) return '';  // Handle null or undefined values
            const m = moment(value);  // No format string needed for ISO 8601
            return m.isValid() ? m.format(this.dateFormat) : '';
        },
    },
    computed: {
        formatedCurrentDate(){
            return this.currentDate.format('YYYY年MM月')
        },
        iptValue: {
            get () {
                return this.modelValue
            },
            set (newVal) {
                console.log(newVal)
                const m = moment(newVal)
                const date = m.isValid() ? this.format(newVal) : ''
                this.$emit('input', date)
            }
        }
    },
    mounted(){
        moment.locale('ja')
        this.fillCalendar(this.today)
    },

}
</script>


<style scoped>
.calendar-container {
    width: 400px;
    min-height: 300px;
    border: 1px solid black;
    padding: 8px;
} 

.calendar {
    display: grid;
    text-align: center;
    grid-template-columns: repeat(7, 1fr);
    gap: 1rem;
}
.calendar-days,
.calendar-year-month {
    cursor: pointer;
}

.sunday, .saturday, .today, .selected-date, .calendar-days  {
    width: 30px; 
    height: 30px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;  /* This makes the shape a circle */
}

.sunday {
    background: red;
    color: white;
}

.saturday {
    background: cyan;
    color: white;
}

.today {
    background-color: blue;
    color: white;
}

.selected-date {
    background: orange;
}
.calendar-days:hover {
    background-color: lightgray;  /* Or any color you prefer */
}

.sunday:hover {
    background-color: lightsalmon;  /* Light red background on hover */
}

.saturday:hover {
    background-color: lightblue;  /* Light blue background on hover */
}

button {
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  font: inherit;
  color: inherit;
  cursor: pointer;
  outline: inherit;
}
</style>