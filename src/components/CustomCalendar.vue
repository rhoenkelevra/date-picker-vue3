<template>
    <!-- TODO: Add today button -->
    <!-- TODO: Add minDate -->
    <!-- <div class="big-screen-container"> -->
    <div class="date-picker-container" @click.stop>
        <div class="form-control input-container d-flex align-items-center ">
            <input 
                ref="triggerRef" 
                v-model="inputValue" 
                @input="handleInput" 
                placeholder="YYYY-MM-DD HH:mm"
                class="calendar-input"
                :class="classes"
                @click="openPicker" 
                @keyup.enter="handleEnter" />
            <button aria-label="クリア" @click="clearSelected" class="btn btn-link p-0">
                <font-awesome-icon icon="times" fixed-width class="close" style="font-size:1rem" />
            </button>
        </div>
        <div>
            <div 
                id="tooltip" 
                role="tooltip"
                v-if="showPicker"
                ref="popperRef"
                class="calendar-container"
            >
                <div class="header d-flex justify-content-between align-items-center px-2">
                    <button class="nav-icon" @click="changeMonth(-1)">
                        <font-awesome-icon icon="chevron-left" />
                    </button>
                    <div 
                        ref="yearMonthTrigger"
                        @click="toggleYearMonthSelector"
                        class="year-month-display"
                    >
                        {{ formatYearMonth(currentDate) }}
                    </div>
                    <button class="nav-icon" @click="changeMonth(1)">
                        <font-awesome-icon icon="chevron-right" />
                    </button>
                </div>
                <!-- Year/Month Selector -->
                <div 
                    v-show="showYearMonthSelector" 
                    ref="yearMonthPopperRef" 
                    class="year-month-selector"
                >
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
                <div class="calendar w-100">
                    <div v-for="weekday in weekdays" :key="weekday">
                        <span class="week-header">{{ weekday }}</span>
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
                <div class="time-picker d-flex">
                    <button class="today-text-button flex-grow-0" @click="goToToday">今日</button>
                    <div class="flex-grow-1 d-flex justify-content-center align-items-center" v-show="!isDateOnly">
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
                </div>
                <div id="arrow" data-popper-arrow ref="arrowRef"></div>
            </div>
        </div>
    </div>
    <!-- </div> -->
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
            default: () => moment().format()
        },
        inputClass: {   // Input用クラス
            type: String,
            required: false,
        },
        placement: {
            type: String,
            default: "top"
        },
        dateonly: {
            type: Boolean,
            default: false
        }
    },
    computed: {
        classes() {
            let classes = []
            if (this.inputClass) classes = this.inputClass.split(' ')
            if (this.parse(this.narrow)) classes.push('w-25')
            if (!this.readonly) classes.push('bg-white')
            return classes
        },
    },
    data() {
        return {
            showPicker: false,
            isDateOnly: false,
            dateFormat: 'YYYY-MM-DD HH:mm',
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
            debouncedUpdateDate: null,

            // Year/Month Selector
            monthNames: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
            showYearMonthSelector: false,
            yearMonthPopperInstance: null,

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
        changeMonth(delta) {
            this.currentDate.add(delta, 'month');
            this.fillCalendar();
        },
        goToToday(){
            this.currentDate = moment()
            this.fillCalendar()
        },
        // updateDateAndTime(event) {
        //     const newDateTime = moment(event.target.value, this.dateFormat);
        //     if (newDateTime.isValid()) {
        //         this.selectedDate = newDateTime.clone();
        //         this.currentDate = newDateTime.clone();
        //         this.selectedTime = newDateTime.format('HH:mm');
        //         this.fillCalendar();
        //         this.updateModelValue();
        //     }
        // },
        updateTime() {
            if (this.selectedDate) {
                const newDate = this.selectedDate.clone()
                    .hours(this.selectedHour)
                    .minutes(this.selectedMinute);
                this.selectedDate = newDate;
                this.updateModelValue();
                this.inputValue = this.format(newDate);
            }
        },
        debounce(func, wait) {
            // ユーザーが日付を手動で入力しているときに、入力に遅延を加える
            return {
                execute: (...args) => {
                    clearTimeout(this.debounceTimer)
                    this.debounceTimer = setTimeout(() => func.apply(this, args), wait)
                },
                cancel: () => {
                    clearTimeout(this.debounceTimer)
                }
            }
        },
        handleEnter() {
            this.debouncedUpdateDate.cancel()
            this.updateDateFromInput()
        },
        handleInput(event) {
            this.inputValue = event.target.value;
            this.debouncedUpdateDate.execute()
        },
        updateDateFromInput() {
            const newDate = moment(this.inputValue);
            console.log(newDate.format())
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
        // 親子コンポネントの値を更新する 
        updateModelValue() {
            // FIXME: for now seems that null or undefined are acceptable
            if(this.selectedDate === null || this.selectedDate === undefined){
                this.$emit('update:modelValue', '')
            } else if (this.selectedDate.isValid()){
                this.$emit('update:modelValue', this.selectedDate.format(this.dateFormat))
            }
            // if (this.selectedDate && this.selectedDate.isValid()) {
            //     this.$emit('update:modelValue', this.selectedDate);
            // }
        },
        clearSelected() {
            this.selectedDate = null
            this.inputValue = null
            this.selectedHour = '00'
            this.selectedMinute = '00'
            this.updateModelValue()
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
        parse(value) {
            return value === 'true' ? true : false
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
                this.willShow()
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
        createPopper() {
            this.popperInstance = createPopper(this.$refs.triggerRef, this.$refs.popperRef, {
                placement: this.placement,
                modifiers: [
                    {
                        name: 'offset',
                        options: {
                            offset: [0, 14],
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
                            fallbackPlacements: ['bottom', 'bottom-start', 'top-start'],
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
        // カレンダーを開いたときに呼ばれる。
        // 使い道としては自分以外カレンダーを閉じたいとき、"自分以外"のhidePickerを実行させるなどの使い道
        willShow() {
            this.$emit('willShow', this)
        },
        hideOtherPicker() {
            this.closePicker();
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
        this.debouncedUpdateDate = this.debounce(this.updateDateFromInput, 1000)
    },
    mounted() {
        console.log('mounted', this.dateonly)
        // if (this.showPickerOnStart) {
        //     this.$nextTick(() => {
        //         this.openPicker();
        //     });
        // }
        this.isDateOnly = this.dateonly
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
.big-screen-container{
    height: 3000px;
    width: 100vw;
    display: flex;
    justify-content: center;
    align-items: center;
}

.date-picker-container {
    --day-border: 1px solid #b8c2cc;
    --day-border-highlight: 1px solid #b8c2cc;
    --day-width: 90px;
    --day-height: 90px;
    --weekday-bg: #f8fafc;
    --weekday-border: 1px solid #eaeaea;
    --sunday-bg: #fae0e3;
    --saturday-bg:#eff8ff;

    background: #f8fafc;
    width: 100%;
}

.calendar-container {
    border: var(--day-border);
    border-radius: 12px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    padding: 4px;
    font-size: 0.90rem;
    z-index: 1000;
    background: white;
}

.input-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 8px;
}
.input-container:focus-within {
  outline: none;
  border-color: #3498db; 
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.5); 
} 

.input-container button {
    height: 100%;
}

.nav-icon {
    width: 20px;
}

.nav-icon:hover {
    background-color: lightgray;
}

.calendar-input {
    cursor: pointer;
    border: none;
    outline: none;
    width: 100%;
}

.calendar-input:focus {
    outline: none;
}

.calendar {
    display: grid;
    text-align: center;
    grid-template-columns: repeat(7, 1fr);
    /* grid-template-rows: repeat(7, 1fr); */
    grid-column-gap: 4px;
}

.week-header {
    color: #a0aec0;
    font-weight: bold;
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
    min-width: 30px;
    height: 20px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
}

.sunday {
    background: #fed7d7;
    font-weight: bold;
}

.saturday {
    background: #bee3f8;
    font-weight: bold;
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

.today-text-button {
    background: none;
    border: none;
    color: #007bff;
    padding: 0;
    font: inherit;
    cursor: pointer;
    outline: inherit;
    text-decoration: none;
}

.today-text-button:hover {
    color: #0056b3;
    text-decoration: underline;
}

.today-text-button:focus {
    outline: none;
    box-shadow: none;
}

.time-picker {
    display: flex;
    align-items: center;
    justify-content: center;
    padding-top: 6px;
    border-top: 1px solid #9fadbf;
}

.time-picker select {
    margin: 0 5px;
    padding: 2px 5px;
    background: #edf2f7;
    border: none;
}

.time-picker select option {
    /* Styles for when the select is focused/open */
    outline: none;
    border-color: #007bff;
    margin-top: 6px;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, .25);
}


/* Year/Month Selector */
.year-month-selector-container {
    position: relative;
}

.year-month-display {
    cursor: pointer;
    font-weight: bold;
    font-size: 1rem;
}

.year-month-display:hover {
    background-color: lightgray;
}

.year-month-selector {
    position: absolute;
    z-index: 1000;
    background: white;
    border: 1px solid #9fadbf;
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
    border: 1px solid #9fadbf;
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
    width: 10px;
    height: 10px;
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
    border: 1px solid #9fadbf;
}

#tooltip[data-popper-placement^='top']>#arrow {
    bottom: -6px;
}

#tooltip[data-popper-placement^='top']>#arrow::before {
    border-top: none;
    border-left: none;
}

#tooltip[data-popper-placement^='bottom']>#arrow {
    top: -6px;
}

#tooltip[data-popper-placement^='bottom']>#arrow::before {
    border-bottom: none;
    border-right: none;
}
.calendar-container {
    position: relative;
    background: white;
    border: 1px solid #9fadbf;
    z-index: 1;
}
</style>