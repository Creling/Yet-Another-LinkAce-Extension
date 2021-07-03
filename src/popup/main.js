import Vue from 'vue'
import App from './App.vue'
import VoerroTagsInput from '@voerro/vue-tagsinput';
import axios from 'axios'
import ElementUi from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import '@voerro/vue-tagsinput/dist/style.css'

Vue.component('tags-input', VoerroTagsInput);
Vue.prototype.$axios = axios
Vue.use(ElementUi)

/* eslint-disable no-new */
new Vue({
  el: '#app',
  render: h => h(App)
})
