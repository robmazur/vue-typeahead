import { util } from 'vue'

export default {

  data () {
    return {
      items: [],
      query: '',
      current: -1,
      loading: false,
      timeout: null,
      selectFirst: false,
    
      queryParamName: 'q',

      highlight: true,
      rateLimitBy: 'debounce', // debounce or throttle
      rateLimitWait: 300
    }
  },

  computed: {
    hasItems () {
      return this.items.length > 0
    },

    isEmpty () {
      return !this.query
    },

    isDirty () {
      return !!this.query
    }
  },

  methods: {
    ready() {
      
    },

    input() {
      // implement rate limiting for input change events, same as Bloodhound
      let context = this, args = arguments;
      let func = this.update;
      let immediate = false;
      let wait = this.rateLimitWait;

      let later = function() {
          this.timeout = null;
          if (!immediate) {
              func.apply(context, args);
          }
      };

      let callNow = immediate && !this.timeout;

      clearTimeout(this.timeout);
      
      this.timeout = setTimeout(later, wait);
      
      if (callNow) {
          func.apply(context, args);
      }

      return;
    },

    update () {
      if (!this.query) {
        return this.reset()
      }

      if (this.minChars && this.query.length < this.minChars) {
        return
      }

      this.loading = true

      // TODO: Use LruCache and check if this search has already been performed...

      this.fetch().then((response) => {
        if (this.query) {
          let data = response.data
          data = this.prepareResponseData ? this.prepareResponseData(data) : data
          this.items = this.limit ? data.slice(0, this.limit) : data
          this.current = -1
          this.loading = false

          if (this.selectFirst) {
            this.down()
          }
        }
      })
    },

    fetch () {
      if (!this.$http) {
        return util.warn('You need to install the `vue-resource` plugin', this)
      }

      if (!this.src) {
        return util.warn('You need to set the `src` property', this)
      }

      const src = this.queryParamName
        ? this.src
        : this.src + this.query

      const params = this.queryParamName
        ? Object.assign({ [this.queryParamName]: this.query }, this.data)
        : this.data

      return this.$http.get(src, { params })
    },

    reset () {
      this.items = []
      this.query = ''
      this.loading = false
    },

    setActive (index) {
      this.current = index
    },

    activeClass (index) {
      return {
        active: this.current === index
      }
    },

    hit () {
      if (this.current !== -1) {
        this.onHit(this.items[this.current])
      }
    },

    up () {
      if (this.current > 0) {
        this.current--
      } else if (this.current === -1) {
        this.current = this.items.length - 1
      } else {
        this.current = -1
      }
    },

    down () {
      if (this.current < this.items.length - 1) {
        this.current++
      } else {
        this.current = -1
      }
    },

    onHit () {
      util.warn('You need to implement the `onHit` method', this)
    }
  }
}
