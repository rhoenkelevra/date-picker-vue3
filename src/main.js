import { createApp } from 'vue'
import App from './App.vue'
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'

// Import Bootstrap and BootstrapVue CSS files (order is important)
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

const app = createApp(App)

// Make BootstrapVue available throughout your project
app.use(BootstrapVue)
// Optionally install the BootstrapVue icon components plugin
app.use(IconsPlugin)


import moment from 'moment';
import 'moment/locale/ja';  // Import Japanese locale data

// Set the default locale to Japanese
moment.locale('ja');

import { library } from '@fortawesome/fontawesome-svg-core'
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faClock as farClock } from '@fortawesome/free-regular-svg-icons'

library.add(faChevronLeft, faChevronRight, farClock)

// In your Vue app setup
app.component('font-awesome-icon', FontAwesomeIcon)

app.mount('#app')