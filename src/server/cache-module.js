import Cache from './cache';
import { defaultBuildKey } from './utils';

export const cacheInitContextMiddleware = cache =>
  function injectCacheInContext() {
    this.cache = cache;
    this.next();
  };

/* eslint-disable no-param-reassign */
export const cachePresenceForMiddleware = (buildKey = defaultBuildKey) =>
  function checkPresenceInCache(req, res, next) {
    const { method, originalUrl } = req;
    const key = buildKey(method, originalUrl, this.params);
    const hit = this.cache.get(key);

    if (hit) {
      this.logger.info('info_cache_hit', key);
      res.statusCode = hit.status;
      switch (res.statusCode) {
        case 200:
          req.dynamicHead = hit.head;
          req.dynamicBody = hit.body;
          this.out();
          break;

        case 302:
          res.redirect(302, hit.url);
          break;

        case 404:
          res.statusMessage = 'Not found.';
          req.dynamicHead = hit.head;
          req.dynamicBody = hit.body;
          this.out();
          break;

        default:
      }

      this.logger.info('info_response_sended', hit.status);
      this.logger.verbose('verbose_response_sended', hit.head, hit.body);
      this.logger.debug('debug_response_sended', originalUrl, hit.status);
    } else {
      next();

      if (res.statusCode !== 500) {
        this.cache.processQueue(req, res);
      }
    }
  };
/* eslint-enable */

export const enableCache = (
  maxAge = 86400000,
  buildKey = defaultBuildKey
) =>
  function enablingCacheMiddleware(req) {
    const { method, originalUrl } = req;

    this.cache.addInQueue({
      key: buildKey(method, originalUrl, this.params),
      maxAge,
      url: originalUrl
    });

    this.next();
  };

/** @class */
export class CacheModule {
  /**
   * @constructor
   * @param {object} [options={}]
   * @param {array} [options.collections=[]]
   * @param {number} [options.max=1024]
   * @param {number} [options.maxAge=86400000] 1000 * 60 * 60 * 24
   */
  constructor(options) {
    this.cache = new Cache(options);
  }

  /**
   * @summary Returns global cache middleware
   * @locus Server
   * @memberof CacheModule
   * @method getMiddlewares
   * @instance
   * @return {array.<function>}
   */
  getMiddlewares() {
    return [
      cacheInitContextMiddleware(this.cache),
      cachePresenceForMiddleware()
    ];
  }
}
