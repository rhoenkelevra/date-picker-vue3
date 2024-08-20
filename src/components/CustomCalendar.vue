<template>
    <div class="date-picker-container">
        <input ref="triggerRef" :value="inputValue" @input="updateDateAndTime" @click="togglePicker"
            placeholder="YYYY年MM月DD日 HH:mm" />
        <div v-if="showPicker" ref="popperRef" class="calendar-container">
            <div class="header d-flex justify-content-between align-items-center">
                <button class="nav-icon" @click="previousMonth"><font-awesome-icon icon="chevron-left" /></button>
                <div class="calendar-year-month">{{ currentDate.format('YYYY年MM月') }}</div>
                <button class="nav-icon" @click="nextMonth"><font-awesome-icon icon="chevron-right" /></button>
            </div>
            <div class="calendar w-100 mt-2">
                <div v-for="weekday in weekdays" :key="weekday">
                    <span>{{ weekday }}</span>
                </div>
                <div v-for="(day, index) in monthDays" :key="index">
                    <span @click="setSelected(day)" :class="{
                        'calendar-days': day.isValid(),
                        'today': isToday(day),
                        'sunday': isSunday(index),
                        'saturday': isSaturday(index),
                        'selected-date': isSelected(day)
                    }">{{ day.isValid() ? day.format('D') : '' }}</span>
                </div>
            </div>
            <div class="time-picker">
                <span><font-awesome-icon icon="clock" class="mr-2" /></span>
                <select v-model="selectedTime" @change="updateModelValue">
                    <option v-for="time in timeOptions" :key="time" :value="time">
                        {{ time }}
                    </option>
                </select>
            </div>
        </div>
    </div>
</template>

<script>
import { createPopper } from '@popperjs/core';
import moment from 'moment'

export default {
    compatConfig: {
        MODE: 3
    },
    props: {
        modelValue: {
            type: String,
            // default: () => moment().format()
        }
    },
    data() {
        return {
            showPicker: false,
            dateFormat: 'YYYY年M月D日 HH:mm',
            weekdays: ['日', '月', '火', '水', '木', '金', '土'],
            monthDays: [],
            today: moment(),
            currentDate: moment(), // current date to show on the calendar
            selectedDate: null, // user selected date
            selectedTime: '00:00',
            inputValue: '', // user inputed date
            timeOptions: this.generateTimeOptions(),
            popperInstance: null
        }
    },
    methods: {
        initializeFromProp() {
            const initialDate = moment(this.modelValue);
            if (initialDate.isValid()) {
                this.currentdate = initialDate.clone();
                this.selectedDate = initialDate.clone();
                this.selectedTime = initialDate.clone().format('HH:mm');
                this.inputValue = this.format(initialDate);
                this.fillCalendar();
            }
        },
        /* Setters */
        setSelected(day) {
            if (day.isValid()) {
                this.selectedDate = day.clone();
                this.updateModelValue();
            }
        },
        nextMonth() {
            this.currentDate.add(1, 'month')
            this.fillCalendar()
        },
        previousMonth() {
            this.currentDate.subtract(1, 'month')
            this.fillCalendar()
        },
        updateDateAndTime(event) {
            const newDateTime = moment(event.target.value, this.dateFormat);
            if (newDateTime.isValid()) {
                this.selectedDate = newDateTime.clone();
                this.currentDate = newDateTime.clone();
                this.selectedTime = newDateTime.format('HH:mm');
                this.fillCalendar();
                this.updateModelValue();
            }
        },
        updateModelValue() {
            if (this.selectedDate) {
                const [hours, minutes] = this.selectedTime.split(':');
                const newDate = this.selectedDate.clone().hours(hours).minutes(minutes);
                this.$emit('update:modelValue', newDate.format());
                this.inputValue = this.format(newDate);
            }
        },

        /* Checks */
        isSelected(day) {
            return this.selectedDate && day.isValid() && day.isSame(this.selectedDate, 'day');
        },
        isToday(day) {
            if (!day) return false
            const today = moment()
            return today.isSame(day, 'day')
        },
        isSunday(index) {
            return (index % 7 === 0) && this.monthDays[index].isValid()
        },
        isSaturday(index) {
            return (index % 7 === 6) && this.monthDays[index].isValid()
        },

        /* Getters */
        firstDayAsWeekday() {
            return this.currentDate.clone().date(1).day()
        },

        /* Generators */
        fillCalendar() {
            this.monthDays = []
            let result = []
            const lastDayMonth = parseInt(this.currentDate.clone().endOf('month').format("D"))
            const firstWeekDay = this.firstDayAsWeekday()

            // fill blanks until first day of the month
            for (let j = 0; j < firstWeekDay; j++) {
                result.push(moment(null))
            }

            // fill the days of the month
            for (let i = 1; i <= lastDayMonth; i++) {
                const thisDate = this.currentDate.clone().date(i);
                result.push(thisDate)
            }

            this.monthDays = result
        },
        generateTimeOptions() {
            const options = [];
            for (let hour = 0; hour < 24; hour++) {
                for (let minute = 0; minute < 60; minute += 5) {
                    options.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
                }
            }
            return options;
        },

        /* Picker Toggle with Popper */
        togglePicker() {
            this.showPicker = !this.showPicker
            if (this.showPicker) {
                this.$nextTick(() => {
                    this.createPopper()
                })
            } else {
                this.destroyPopper()
            }
        },
        createPopper() {
            this.popperInstance = createPopper(this.$refs.triggerRef, this.$refs.popperRef, {
                placement: 'bottom-start',
                modifiers: [
                    {
                        name: 'offset',
                        options: {
                            offset: [0, 8],
                        },
                    },
                    {
                        name: 'flip',
                        options: {
                            fallbackPlacements: ['top-start', 'bottom-end', 'top-end'],
                        },
                    },
                ],
            })
        },
        destroyPopper() {
            if (this.popperInstance) {
                this.popperInstance.destroy()
                this.popperInstance = null
            }
        },
        handleClickOutside(event) {
            if (this.showPicker && !this.$el.contains(event.target)) {
                this.showPicker = false;
                this.destroyPopper();
            }
        },
        /* ------ */

        /* Formatter */
        format(value) {
            if (!value) return '';
            const m = moment(value);
            return m.isValid() ? m.format(this.dateFormat) : '';
        },
    },
    watch: {
        modelValue: {
            immediate: true,
            handler(newVal) {
                const date = moment(newVal);
                if (date.isValid()) {
                    this.selectedDate = date.clone();
                    this.currentDate = date.clone();
                    this.selectedTime = date.format('HH:mm');
                    this.inputValue = this.format(date);
                    this.fillCalendar();
                }
            }
        }
    },
    created() {
        this.initializeFromProp();
    },
    mounted() {
        this.fillCalendar();
        document.addEventListener('click', this.handleClickOutside);
    },
    beforeUnmount() {
        this.destroyPopper();
        document.removeEventListener('click', this.handleClickOutside);
    },
}
</script>




<style scoped>
.calendar-container {
    background: white;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    padding: 10px;
}

.date-picker-container {
    position: relative;
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

.sunday,
.saturday,
.today,
.selected-date,
.calendar-days {
    width: 30px;
    height: 30px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    /* This makes the shape a circle */
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
    background-color: lightgray;
}

.sunday:hover {
    background-color: lightsalmon;
}

.saturday:hover {
    background-color: lightblue;
}

.date-picker-container {
    position: relative;
    display: inline-block;
}


.time-picker {
    margin-top: 10px;
    text-align: center;
}

.time-picker select {
    padding: 5px;
    font-size: 14px;
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