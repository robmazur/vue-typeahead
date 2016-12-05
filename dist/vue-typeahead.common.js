'use strict';

var LruCache = function () {
  'use strict';

  function LruCache(maxSize) {
    this.maxSize = _.isNumber(maxSize) ? maxSize : 100;
    this.reset();

    if (this.maxSize <= 0) {
      this.set = this.get = $.noop;
    }
  }

  LruCache.prototype.set = function set(key, val) {
    var tailItem = this.list.tail,
        node;

    if (this.size >= this.maxSize) {
      this.list.remove(tailItem);
      delete this.hash[tailItem.key];

      this.size--;
    }

    if (node = this.hash[key]) {
      node.val = val;
      this.list.moveToFront(node);
    } else {
        node = new Node(key, val);

        this.list.add(node);
        this.hash[key] = node;

        this.size++;
      }
  };

  LruCache.prototype.has = function get(key) {
    return this.hash.hasOwnProperty(key);
  };

  LruCache.prototype.get = function get(key) {
    var node = this.hash[key];

    if (node) {
      this.list.moveToFront(node);
      return node.val;
    }
  };

  LruCache.prototype.reset = function reset() {
    this.size = 0;
    this.hash = {};
    this.list = new List();
  };

  function List() {
    this.head = this.tail = null;
  }

  List.prototype.add = function add(node) {
    if (this.head) {
      node.next = this.head;
      this.head.prev = node;
    }

    this.head = node;
    this.tail = this.tail || node;
  };

  List.prototype.remove = function remove(node) {
    node.prev ? node.prev.next = node.next : this.head = node.next;
    node.next ? node.next.prev = node.prev : this.tail = node.prev;
  };

  List.prototype.moveToFront = function (node) {
    this.remove(node);
    this.add(node);
  };

  function Node(key, val) {
    this.key = key;
    this.val = val;
    this.prev = this.next = null;
  }

  return LruCache;
}();
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _vue = require('vue');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
  data: function data() {
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
      rateLimitBy: 'debounce',
      rateLimitWait: 300
    };
  },


  methods: {
    mounted: function mounted() {
      this.ensureCacheInit();
    },
    input: function input() {
      var context = this,
          args = arguments;
      var func = this.update;
      var immediate = false;
      var wait = this.rateLimitWait;

      var later = function later() {
        this.timeout = null;
        if (!immediate) {
          func.apply(context, args);
        }
      };

      var callNow = immediate && !this.timeout;

      clearTimeout(this.timeout);

      this.timeout = setTimeout(later, wait);

      if (callNow) {
        func.apply(context, args);
      }

      return;
    },
    update: function update() {
      var _this = this;

      if (!this.query) {
        return this.reset();
      }

      if (this.query.length < this.minChars) {
        return;
      }

      this.loading = true;
      this.totalFound = null;

      this.ensureCacheInit();

      var cacheKey = this.query.replace(' ', ':');

      if (this.cache && this.sharedCache.has(cacheKey)) {
        var data = this.sharedCache.get(cacheKey);

        return this.processResponseData(data);
      }

      this.fetch().then(function (response) {
        if (_this.query) {
          var _data = response.data;
          _data = _this.prepareResponseData ? _this.prepareResponseData(_data) : _data;

          if (_this.cacheEmptyResults || _data.length > 0) {
            _this.sharedCache.set(cacheKey, _data);
          }

          _this.processResponseData(_data);
        }
      });
    },
    fetch: function fetch() {
      if (!this.$http) {
        return _vue.util.warn('You need to install the `vue-resource` plugin', this);
      }

      if (!this.src) {
        return _vue.util.warn('You need to set the `src` property', this);
      }

      var src = this.queryParamName ? this.src : this.src + this.query;

      var params = this.queryParamName ? (0, _assign2.default)((0, _defineProperty3.default)({}, this.queryParamName, this.query), this.data) : this.data;

      return this.$http.get(src, { params: params });
    },
    processResponseData: function processResponseData(data) {
      this.totalFound = data.length;
      this.items = this.limit ? data.slice(0, this.limit) : data;
      this.current = -1;
      this.loading = false;

      if (this.selectFirst) {
        this.down();
      }
    },
    ensureCacheInit: function ensureCacheInit() {
      if (this.cache && !this.sharedCache) {
        this.sharedCache = new LruCache(this.maxCacheItems);
      }
    },
    reset: function reset() {
      this.items = [];
      this.query = '';
      this.loading = false;
    },
    resetCache: function resetCache() {
      this.sharedCache.reset();
    },
    setCurrent: function setCurrent(index) {
      this.current = index;
    },
    currentItemClass: function currentItemClass(index) {
      return {
        current: this.current === index
      };
    },
    hit: function hit() {
      if (this.current !== -1) {
        this.onHit(this.items[this.current]);
      }
    },
    up: function up() {
      if (this.current > 0) {
        this.current--;
      } else if (this.current === -1) {
        this.current = this.items.length - 1;
      } else {
        this.current = -1;
      }
    },
    down: function down() {
      if (this.current < this.items.length - 1) {
        this.current++;
      } else {
        this.current = -1;
      }
    },
    onHit: function onHit() {
      _vue.util.warn('You need to implement the `onHit` method', this);
    }
  },

  computed: {
    hasItems: function hasItems() {
      return this.items.length > 0;
    },
    isEmpty: function isEmpty() {
      return !this.query;
    },
    isDirty: function isDirty() {
      return !!this.query;
    },
    isLoading: function isLoading() {
      return this.loading;
    },
    hasQuery: function hasQuery() {
      return !this.isEmpty && this.query.length >= this.minChars;
    },
    hasResults: function hasResults() {
      return this.hasQuery && !this.isLoading && this.hasItems;
    },
    hasNoResults: function hasNoResults() {
      return this.hasQuery && !this.isLoading && this.totalFound === 0;
    }
  }

};
