<template>
    <div class="date-picker-container">
        <input ref="triggerRef" v-model="inputValue" @input="handleInput" placeholder="YYYY年MM月DD日 HH:mm"
            class="calendar-input" @click="openPicker" />
        <div id="tooltip" role="tooltip">
            <div v-if="showPicker" ref="popperRef" class="calendar-container">
                <div class="header d-flex justify-content-between align-items-center">
                    <button class="nav-icon" @click="previousMonth">
                        <font-awesome-icon icon="chevron-left" />
                    </button>
                    <div ref="yearMonthTrigger" @click="toggleYearMonthSelector" class="year-month-display">
                        {{ formatYearMonth(currentDate) }}
                    </div>
                    <button class="nav-icon" @click="nextMonth">
                        <font-awesome-icon icon="chevron-right" />
                    </button>
                </div>
                <!-- Year/Month Selector -->

                <div v-show="showYearMonthSelector" ref="yearMonthPopperRef" class="year-month-selector">
                    <div class="year-selector">
                        <button @click="changeYear(-1)"><font-awesome-icon icon="chevron-left" /></button>
                        <span>{{ currentDate.year() }}</span>
                        <button @click="changeYear(1)"><font-awesome-icon icon="chevron-right" /></button>
                    </div>
                    <div class="month-grid">
                        <button v-for="(month, index) in monthNames" :key="index" @click="selectMonth(index)"
                            :class="{ 'selected': currentDate.month() === index }">
                            {{ month }}
                        </button>
                    </div>
                </div>


                <!-- ----- -->
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
                    <span><font-awesome-icon :icon="['far', 'clock']" class="mr-2" /></span>
                    <select v-model="selectedHour" @change="updateTime">
                        <option v-for="hour in hoursOptions" :key="hour" :value="hour">
                            {{ hour }}
                        </option>
                    </select>
                    <select v-model="selectedMinute" @change="updateTime">
                        <option v-for="minute in minutesOptions" :key="minute" :value="minute">
                            {{ minute }}
                        </option>
                    </select>
                </div>
                <div id="arrow" data-popper-arrow ref="arrowRef"></div>
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
        },
        showPickerOnStart: {
            type: Boolean,
            default: true
        }
    },
    data() {
        return {
            showPicker: false,
            dateFormat: 'YYYY年M月D日 HH:mm',
            weekdays: ['日', '月', '火', '水', '木', '金', '土'],
            monthDays: [],
            hoursOptions: this.generateHourOptions(),
            minutesOptions: this.generateMinutesOptions(),
            today: moment(),
            currentDate: moment(),
            selectedDate: null,
            selectedHour: '00',
            selectedMinute: '00',
            inputValue: '',
            popperInstance: null,

            // Year/Month Selector
            monthNames: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
            showYearMonthSelector: false,
            yearMonthPopperInstance: null
        }
    },
    methods: {
        initializeFromProp() {
            const initialDate = moment(this.modelValue);
            if (initialDate.isValid()) {
                this.currentdate = initialDate.clone();
                this.selectedDate = initialDate.clone();
                this.selectedHour = initialDate.format('HH');
                this.selectedMinute = initialDate.format('mm');
                this.updateInputFromSelect();
                this.fillCalendar();
            }
        },
        /* Setters */
        setSelected(day) {
            if (day.isValid()) {
                // Preserve the current time when selecting a new date
                const newDate = day.clone().hour(this.selectedHour).minute(this.selectedMinute);
                this.selectedDate = newDate;
                this.currentDate = newDate.clone();
                this.updateInputFromSelect();
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
        updateTime() {
            if (this.selectedDate) {
                const newDate = this.selectedDate.clone()
                    .hours(this.selectedHour)
                    .minutes(this.selectedMinute);
                this.$emit('update:modelValue', newDate.format());
                this.inputValue = this.format(newDate);
            }
        },
        handleInput(event) {
            this.inputValue = event.target.value;
            this.updateDateFromInput();
        },
        updateDateFromInput() {
            const newDate = moment(this.inputValue, this.dateFormat, true);
            if (newDate.isValid()) {
                this.selectedDate = newDate.clone();
                this.currentDate = newDate.clone();
                this.selectedHour = newDate.format('HH');
                this.selectedMinute = newDate.format('mm');
                this.fillCalendar();
                this.updateModelValue();
            }
        },
        updateInputFromSelect() {
            if (this.selectedDate && this.selectedDate.isValid()) {
                this.inputValue = this.format(this.selectedDate);
            }
        },
        updateModelValue() {
            if (this.selectedDate && this.selectedDate.isValid()) {
                this.$emit('update:modelValue', this.selectedDate.format());
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
        generateHourOptions() {
            return Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
        },
        generateMinutesOptions() {
            return Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));
        },

        /* Picker Toggle with Popper */
        openPicker() {
            if (!this.showPicker) {
                this.showPicker = true;
                this.$nextTick(() => {
                    this.createPopper();
                });
            }
        },

        closePicker() {
            if (this.showPicker) {
                this.showPicker = false;
                this.destroyPopper();
            }
        },

        togglePicker() {
            if (this.showPicker) {
                this.closePicker();
            } else {
                this.openPicker();
            }
        },

        // handleDocumentClick(event) {
        //     if (this.showPicker && !this.$el.contains(event.target)) {
        //         this.closePicker();
        //     }
        // },
        createPopper() {
            this.popperInstance = createPopper(this.$refs.triggerRef, this.$refs.popperRef, {
                placement: 'top',
                modifiers: [
                    {
                        name: 'offset',
                        options: {
                            offset: [0, 10],
                        },
                    },
                    {
                        name: 'arrow',
                        options: {
                            element: this.$refs.arrowRef,
                            padding: 10,
                        },
                    },
                    {
                        name: 'flip',
                        options: {
                            fallbackPlacements: ['top-start', 'bottom-end', 'top-end'],
                        },
                    },
                    {
                        name: 'preventOverflow',
                        options: {
                            boundary: document.body,
                            padding: 8,
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
        /* ------ */

        /* Formatter */
        format(value) {
            if (!value) return '';
            const m = moment(value);
            return m.isValid() ? m.format(this.dateFormat) : '';
        },

        /* Year/Month Selector */
        toggleYearMonthSelector() {
      this.showYearMonthSelector = !this.showYearMonthSelector;
      if (this.showYearMonthSelector) {
        this.$nextTick(() => {
          this.createYearMonthPopper();
        });
      } else {
        this.destroyYearMonthPopper();
      }
    },
    createYearMonthPopper() {
        const reference = this.$refs.yearMonthTrigger;
      this.yearMonthPopperInstance = createPopper(reference, this.$refs.yearMonthPopperRef, {
        // placement: 'bottom',
        modifiers: [
    {
      name: 'offset',
      options: {
        offset: [0, 8],
      },
    },
  ],
      });
    },
    destroyYearMonthPopper() {
      if (this.yearMonthPopperInstance) {
        this.yearMonthPopperInstance.destroy();
        this.yearMonthPopperInstance = null;
      }
    },
    changeYear(delta) {
      this.currentDate.add(delta, 'year');
      this.fillCalendar();
    },
    selectMonth(monthIndex) {
      this.currentDate.month(monthIndex);
      this.fillCalendar();
      this.showYearMonthSelector = false;
      this.destroyYearMonthPopper();
    },
    formatYearMonth(date) {
      return date.format('YYYY年MM月');
    },
    handleDocumentClick(event) {
      if (this.showPicker && !this.$el.contains(event.target)) {
        this.closePicker();
      }
      if (this.showYearMonthSelector && 
          !this.$refs.yearMonthPopperRef.contains(event.target) &&
          !this.$refs.yearMonthTrigger.contains(event.target)) {
        this.showYearMonthSelector = false;
        this.destroyYearMonthPopper();
      }
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
        if (this.showPickerOnStart) {
            this.$nextTick(() => {
                this.openPicker();
            });
        }
        this.fillCalendar();
        document.addEventListener('click', this.handleDocumentClick);
    },
    beforeUnmount() {
        this.destroyPopper();
        document.removeEventListener('click', this.handleDocumentClick);
    },
}
</script>




<style scoped>
.calendar-input {
    cursor: pointer;
}
.calendar-container {
    background: white;
    border: 1px solid #ccc;
    border-radius: 12px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    padding: 8px;
    z-index: 100;
}

.date-picker-container {
    position: relative;
}

.calendar {
    display: grid;
    text-align: center;
    grid-template-columns: repeat(7, 1fr);
    grid-column-gap: 1rem;
    grid-row-gap: 0.25rem;
}
.calendar-week-header{
    color: #9fadbf;
}

.calendar-days,
.calendar-year-month {
    cursor: pointer;
    font-weight: bold;
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
}

.sunday {
    background: #fed7d7;
}

.saturday {
    background: #bee3f8;
}

.today {
    background-color: #5a67d8;
    color: white;
}

.selected-date {
    background: orange;
    color: white;
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
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 6px;
  padding-top: 8px;
  border-top: 1px solid #9fadbf;
}

.time-picker select {
  margin: 0 5px;
  padding: 2px 5px;
  background: #edf2f7;
}
.time-picker select option {
  /* Styles for when the select is focused/open */
  outline: none;
  border-color: #007bff;
  line-height: 1.2;
  margin-top: 8px;
  box-shadow: 0 0 0 2px rgba(0,123,255,.25);
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
/* Year/Month Selector */
.year-month-selector-container {
    position: relative;
  }
  
  .year-month-display {
    cursor: pointer;
    font-weight: bold;
  }
  
  .year-month-selector {
    position: absolute;
    z-index: 1000;
    background: white;
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .year-selector {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  
  .month-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  
  .month-grid button {
    padding: 6px;
    border: 1px solid #ccc;
    background-color: #f0f0f0;
    cursor: pointer;
    border-radius: 4px;
  }
  
  .month-grid button.selected {
    background-color: #007bff;
    color: white;
  }
#arrow,
#arrow::before {
    position: absolute;
    width: 12px;
    height: 12px;
    z-index: -1;
}

#arrow {
    visibility: hidden;
}

#arrow::before {
    visibility: visible;
    content: '';
    transform: rotate(45deg);
    background: white;
    border: 1px solid #ccc;
}

#tooltip[data-popper-placement^='top']>#arrow {
    bottom: -4px;
}

#tooltip[data-popper-placement^='top']>#arrow::before {
    border-top: none;
    border-left: none;
}

.calendar-container {
    position: relative;
    background: white;
    border: 1px solid #ccc;
    z-index: 1;
}   
</style>