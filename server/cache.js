/* eslint-disable import/no-unresolved */
import assert from 'assert';
import LRU from 'lru-cache';
/* eslint-enable */

import {
  jsperfFind,
  jsperfForEach
} from 'meteor/c0r3y8:octopus';

/** @class */
export default class Cache {
  /**
   * @constructor
   * @param {object} [options={}]
   * @param {array} [options.collections=[]]
   * @param {number} [options.max=1024]
   * @param {number} [options.maxAge=86400000] 1000 * 60 * 60 * 24
   */
  constructor(options = {}) {
    assert(options, 'You must provide `options`');

    this.options = {
      collections: [],
      max: 1024,
      maxAge: 86400000,
      ...options
    };
    this.cache = new LRU(this.options);
    this.queue = {};

    // lru-cache API
    this.del = this.cache.del.bind(this.cache);
    this.dump = this.cache.dump.bind(this.cache);
    this.forEach = this.cache.forEach.bind(this.cache);
    this.get = this.cache.get.bind(this.cache);
    this.has = this.cache.has.bind(this.cache);
    this.itemCount = this.cache.itemCount;
    this.keys = this.cache.keys.bind(this.cache);
    this.length = this.cache.length;
    this.load = this.cache.load.bind(this.cache);
    this.peek = this.cache.peek.bind(this.cache);
    this.prune = this.cache.prune.bind(this.cache);
    this.reset = this.cache.reset.bind(this.cache);
    this.rforEach = this.cache.rforEach.bind(this.cache);
    this.set = this.cache.set.bind(this.cache);
    this.values = this.cache.values.bind(this.cache);

    // jsPerf
    this.options.collections.jsperfForEach = jsperfForEach;

    this._initCursorsObserver();
  }

  /**
   * @locus Server
   * @memberof Cache
   * @method _initCursorsObserver
   * @instance
   */
  _initCursorsObserver() {
    const { collections } = this.options;

    collections.jsperfForEach((collection) => {
      const { cursor, callback } = collection;

      cursor.observeChanges({
        added: (id, fields) => {
          callback.call(this, 'added', id, fields);
        },
        changed: (id, fields) => {
          callback.call(this, 'changed', id, fields);
        },
        removed: (id) => {
          callback.call(this, 'removed', id);
        }
      });
    });
  }

  /**
   * @summary Adds key in queue
   * @locus Server
   * @memberof Cache
   * @method addInQueue
   * @instance
   * @param {object} route
   * @param {string} route.key
   * @param {number} route.ttl
   * @param {string} route.url
   */
  addInQueue(route) {
    if (!this.queue[ route.key ]) {
      this.queue[ route.key ] = route;
    }
  }

  /**
   * @summary Delete multiple keys
   * @locus Server
   * @memberof Cache
   * @method mdel
   * @instance
   * @param {array.<String>} keys
   */
  mdel(keys) {
    // eslint-disable-next-line no-param-reassign
    keys.jsperfForEach = jsperfForEach;

    keys.jsperfForEach((key) => {
      this.del(key);
    });
  }

  /**
   * @summary Gets multiple keys
   * @locus Server
   * @memberof Cache
   * @method mget
   * @instance
   * @param {array.<String>} keys
   * @return {array}
   */
  mget(keys) {
    return keys.map(key => this.get(key));
  }

  /**
   * @summary Process all queue callback
   * @locus Server
   * @memberof Cache
   * @method processQueue
   * @instance
   */
  processQueue(req, res) {
    const { dynamicBody, dynamicHead, originalUrl } = req;
    const { statusCode } = res;
    const keys = Object.keys(this.queue);
    // jsPerf
    keys.jsperfFind = jsperfFind;

    const current = keys.jsperfFind(
      key => this.queue[ key ].url === originalUrl
    );

    let route;

    if (current) {
      route = this.queue[ current ];

      this.cache.set(route.key, {
        body: dynamicBody,
        head: dynamicHead,
        status: statusCode,
        url: res.getHeader('Location')
      }, route.maxAge);

      delete this.queue[ current ];
    }
  }
}
