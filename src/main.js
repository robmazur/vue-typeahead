import { util } from 'vue'

export default {

  data () {
    return {
      sharedCache: null,
      items: [],
      query: '',
      current: -1,
      totalFound: null,
      loading: false,
      timeout: null,

      cache: true,
      maxCacheItems: 5,
      cacheEmptyResults: true,
      minChars: 0,
      selectFirst: false,
    
      queryParamName: 'q',

      highlight: true,
      rateLimitBy: 'debounce', // debounce or throttle
      rateLimitWait: 300
    }
  },


  methods: {
    mounted() {
      this.ensureCacheInit();
    },


    /*
    *   Implements rate limiting for input change events, same as Bloodhound
    */
    input() {
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
        return this.reset();
      }

      if (this.query.length < this.minChars) {
        return;
      }

      this.loading = true;
      this.totalFound = null;

      // use LruCache and check if this search has already been performed...
      this.ensureCacheInit();

      let cacheKey = this.query.replace(' ', ':');

      if (this.cache && this.sharedCache.has(cacheKey)) {
        let data = this.sharedCache.get(cacheKey);

        return this.processResponseData(data);
      }

      this.fetch().then((response) => {
        if (this.query) {
          let data = response.data
          data = this.prepareResponseData ? this.prepareResponseData(data) : data

          if (this.cacheEmptyResults || data.length > 0) {
            this.sharedCache.set(cacheKey, data);   
          }

          this.processResponseData(data);
        
        }
      })
    },


    fetch () {
      if (!this.$http) {
        return util.warn('You need to install the `vue-resource` plugin', this);
      }

      if (!this.src) {
        return util.warn('You need to set the `src` property', this);
      }

      const src = this.queryParamName
        ? this.src
        : this.src + this.query;

      const params = this.queryParamName
        ? Object.assign({ [this.queryParamName]: this.query }, this.data)
        : this.data;

      return this.$http.get(src, { params });
    },


    processResponseData(data) {
      this.totalFound = data.length;
      this.items = this.limit ? data.slice(0, this.limit) : data;
      this.current = -1;
      this.loading = false;

      if (this.selectFirst) {
        this.down();
      }
    },


    ensureCacheInit() {
      if (this.cache && !this.sharedCache) {
        this.sharedCache = new LruCache(this.maxCacheItems);
      }
    },


    reset () {
      this.items = [];
      this.query = '';
      this.loading = false;
    },


    resetCache() {
      this.sharedCache.reset();
    },


    setCurrent (index) {
      this.current = index;
    },


    currentItemClass (index) {
      return {
        current: this.current === index
      };
    },


    hit () {
      if (this.current !== -1) {
        this.onHit(this.items[this.current]);
      }
    },


    up () {
      if (this.current > 0) {
        this.current--;
      } else if (this.current === -1) {
        this.current = this.items.length - 1;
      } else {
        this.current = -1;
      }
    },


    down () {
      if (this.current < this.items.length - 1) {
        this.current++;
      } else {
        this.current = -1;
      }
    },


    onHit () {
      util.warn('You need to implement the `onHit` method', this);
    }

  },


  computed: {
    hasItems () {
      return this.items.length > 0;
    },

    isEmpty () {
      return !this.query;
    },

    isDirty () {
      return !!this.query;
    },

    isLoading () {
      return this.loading;
    },

    hasQuery () {
      return !this.isEmpty && this.query.length >= this.minChars;
    },

    hasResults () {
      return this.hasQuery && !this.isLoading && this.hasItems;
    },

    hasNoResults () {
      return this.hasQuery && !this.isLoading && this.totalFound === 0;
    }
  }

}
