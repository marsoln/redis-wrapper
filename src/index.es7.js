const ACTIONS = 'del dump exists expire expireat keys migrate move object persist pexpire pexpireat pttl randomkey rename renamenx restore sort ttl type scan append bitcount bitop decr decrby get getbit getrange getset incr incrby incrbyfloat mget mset msetnx psetex set setbit setex setnx setrange strlen hdel hexists hget hgetall hincrby hincrbyfloat hkeys hlen hmget hmset hset hsetnx hvals hscan blpop brpop brpoplpush lindex linsert llen lpop lpush lpushx lrange lrem lset ltrim rpop rpoplpush rpush rpushx sadd scard sdiff sdiffstore sinter sinterstore sismember smembers smove spop srandmember srem sunion sunionstore sscan zadd zcard zcount zincrby zrange zrangebyscore zrank zrem  zremrangebyrank zremrangebyscore zrevrange zrevrangebyscore zrevrank zscore zunionstore zinterstore zscan psubscribe publish pubsub punsubscribe subscribe unsubscribe discard exec multi unwatch watch info'.split(' ')
const EXTENSIONS = ['getObj', 'setObj']

const __wrapper = function (connection) {
  ACTIONS.forEach((funcName) => {
    if (typeof connection[funcName] === 'function') {
      let __originFunc = connection[funcName]
      connection[funcName] = (...rest) => new Promise((resolve, reject) => {
        __originFunc.apply(connection, rest
          .concat((error, replies) => {
            if (error) {
              console.error(error.message)
              reject(error)
            } else {
              resolve(replies)
            }
            connection.quit()
          }))
      })
    }
  })

  // extensions

  /**
   * 获取一个对象
   * @param {string} key Key
   */
  connection.getObj = function (key) {
    return connection.get(key).then(value => JSON.parse(value))
  }

  /**
   * 保存一个对象
   * @param {string} key Key
   * @param {string|object} value Value
   * @param {number|null} timeout Timeout limitation
   */
  connection.setObj = function (key, value, timeout) {
    if (timeout) {
      return connection.set(key, typeof value === 'string' ? value : JSON.stringify(value), 'EX', timeout)
    } else {
      return connection.set(key, typeof value === 'string' ? value : JSON.stringify(value))
    }
  }

  return connection
}

const init = function (redis, { port, host, ...rest }) {

  let connGen = (function* () {
    while (true) {
      let connection = redis.createClient(port, host, Object.assign({
        retry_strategy: function (options) {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            console.error('Redis server refused the connection.')
          }
          // retry 2 times then return a built in error
          if (options.total_retry_time > 2000 * 2) {
            return undefined
          }
          return 2000 // retry in 2s
        },
      }, {...rest }))

      connection.on('error', (ex) => {
        console.error(ex.message)
      })

      yield __wrapper(connection)
    }
  }())

  let __helper = {}

  ACTIONS.concat(EXTENSIONS).forEach((funcName) => {
    __helper[funcName] = (...rest) => connGen.next()
      .value[funcName](...rest)
      .catch((ex) => {
        console.error(ex.message)
        return null
      })
  })

  return __helper
}

module.exports = init
