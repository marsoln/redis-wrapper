import { ClientOpts, createClient, RedisClient } from 'redis'

import { IWrappedRedisClient } from './define'

const originActions: string[] = [
  'del',
  'dump',
  'exists',
  'expire',
  'expireat',
  'keys',
  'migrate',
  'move',
  'object',
  'persist',
  'pexpire',
  'pexpireat',
  'pttl',
  'randomkey',
  'rename',
  'renamenx',
  'restore',
  'sort',
  'ttl',
  'type',
  'scan',
  'append',
  'bitcount',
  'bitop',
  'decr',
  'decrby',
  'get',
  'getbit',
  'getrange',
  'getset',
  'incr',
  'incrby',
  'incrbyfloat',
  'mget',
  'mset',
  'msetnx',
  'psetex',
  'set',
  'setbit',
  'setex',
  'setnx',
  'setrange',
  'strlen',
  'hdel',
  'hexists',
  'hget',
  'hgetall',
  'hincrby',
  'hincrbyfloat',
  'hkeys',
  'hlen',
  'hmget',
  'hmset',
  'hset',
  'hsetnx',
  'hvals',
  'hscan',
  'blpop',
  'brpop',
  'brpoplpush',
  'lindex',
  'linsert',
  'llen',
  'lpop',
  'lpush',
  'lpushx',
  'lrange',
  'lrem',
  'lset',
  'ltrim',
  'rpop',
  'rpoplpush',
  'rpush',
  'rpushx',
  'sadd',
  'scard',
  'sdiff',
  'sdiffstore',
  'sinter',
  'sinterstore',
  'sismember',
  'smembers',
  'smove',
  'spop',
  'srandmember',
  'srem',
  'sunion',
  'sunionstore',
  'sscan',
  'zadd',
  'zcard',
  'zcount',
  'zincrby',
  'zrange',
  'zrangebyscore',
  'zrank',
  'zrem',
  'zremrangebyrank',
  'zremrangebyscore',
  'zrevrange',
  'zrevrangebyscore',
  'zrevrank',
  'zscore',
  'zunionstore',
  'zinterstore',
  'zscan',
  'psubscribe',
  'publish',
  'pubsub',
  'punsubscribe',
  'subscribe',
  'unsubscribe',
  'discard',
  'exec',
  'multi',
  'unwatch',
  'watch',
  'info',
]

const extensionActions: string[] = ['getObj', 'setObj']

const Actions = originActions.concat(extensionActions)

const wrapper: (connection: RedisClient) => IWrappedRedisClient = (
  connection,
) => {
  const wrappedConn: any = {}

  Actions.forEach((funcName) => {
    if (typeof connection[funcName] === 'function') {
      const originFunc = connection[funcName]

      wrappedConn[funcName] = wrappedConn[funcName.toUpperCase()] = (
        ...args: any[]
      ) =>
        new Promise((resolve, reject) => {
          originFunc.apply(
            connection,
            args.concat((error: Error, replies: any) => {
              if (error) {
                reject(error)
              } else {
                resolve(replies)
              }
            }),
          )
        })
    }
  })

  /**
   * 获取一个对象
   * @param {string} key Key
   */
  wrappedConn.getObj = (key: string) => wrappedConn.get(key).then(JSON.parse)

  /**
   * 保存一个对象
   * @param {string} key Key
   * @param {string|object} value Value
   * @param {number|null} timeout Timeout limitation
   */
  wrappedConn.setObj = (
    key: string,
    value: string | object,
    timeout?: number,
  ) => {
    if (timeout) {
      return wrappedConn.set(
        key,
        typeof value === 'string' ? value : JSON.stringify(value),
        'EX',
        timeout,
      )
    } else {
      return wrappedConn.set(
        key,
        typeof value === 'string' ? value : JSON.stringify(value),
      )
    }
  }

  return wrappedConn
}

export type ExWrappedRedisClient = {
  getObj: (key: string) => Promise<any>
  setObj: (key: string, value: any, timeout?: number) => Promise<any>
} & IWrappedRedisClient

/**
 * 构建 redis 临时查询链接对象
 */
const init: (configs: ClientOpts) => ExWrappedRedisClient = (configs) => {
  const connection = createClient(configs.port, configs.host, {
    retry_strategy(options) {
      if (options.error && options.error.code === 'ECONNREFUSED') {
        console.error('Redis server refused the connection.')
      }
      // retry 2 times then return a built in error
      if (options.total_retry_time > 2000 * 2) {
        return undefined
      }
      return 2000 // retry in 2s
    },
    ...configs,
  })

  const wrappedConn = wrapper(connection)

  return wrappedConn as ExWrappedRedisClient
}

export default init
