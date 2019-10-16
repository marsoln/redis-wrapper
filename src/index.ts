import { ClientOpts, createClient, RedisClient } from "redis";

import { WrappedRedisClient } from "./define";

const ACTIONS: string[] = [
  "del", "dump", "exists", "expire", "expireat", "keys",
  "migrate", "move", "object", "persist", "pexpire", "pexpireat",
  "pttl", "randomkey", "rename", "renamenx", "restore", "sort",
  "ttl", "type", "scan", "append", "bitcount", "bitop", "decr",
  "decrby", "get", "getbit", "getrange", "getset", "incr",
  "incrby", "incrbyfloat", "mget", "mset", "msetnx", "psetex", "set",
  "setbit", "setex", "setnx", "setrange", "strlen", "hdel", "hexists",
  "hget", "hgetall", "hincrby", "hincrbyfloat", "hkeys", "hlen", "hmget",
  "hmset", "hset", "hsetnx", "hvals", "hscan", "blpop", "brpop", "brpoplpush",
  "lindex", "linsert", "llen", "lpop", "lpush", "lpushx", "lrange", "lrem",
  "lset", "ltrim", "rpop", "rpoplpush", "rpush", "rpushx", "sadd", "scard",
  "sdiff", "sdiffstore", "sinter", "sinterstore", "sismember", "smembers",
  "smove", "spop", "srandmember", "srem", "sunion", "sunionstore", "sscan",
  "zadd", "zcard", "zcount", "zincrby", "zrange", "zrangebyscore", "zrank",
  "zrem", "zremrangebyrank", "zremrangebyscore", "zrevrange", "zrevrangebyscore",
  "zrevrank", "zscore", "zunionstore", "zinterstore", "zscan", "psubscribe",
  "publish", "pubsub", "punsubscribe", "subscribe", "unsubscribe",
  "discard", "exec", "multi", "unwatch", "watch", "info",
];

const EXTENSIONS: string[] = ["getObj", "setObj"];

const wrapper: (connection: RedisClient) => WrappedRedisClient = (connection) => {

  const wrappedConn: any = {};

  ACTIONS.forEach((funcName) => {
    if (typeof connection[funcName] === "function") {
      const __originFunc = connection[funcName];

      wrappedConn[funcName] =
        wrappedConn[funcName.toUpperCase()] =
        (...args: any[]) => new Promise((resolve, reject) => {
          __originFunc.apply(connection, args
            .concat((error: Error, replies: any) => {
              if (error) {
                console.error(error.message);
                reject(error);
              } else {
                resolve(replies);
              }
              connection.quit();
            }));
        });
    }
  });

  /**
   * 获取一个对象
   * @param {string} key Key
   */
  wrappedConn.getObj = (key: string) => wrappedConn.get(key).then(JSON.parse);

  /**
   * 保存一个对象
   * @param {string} key Key
   * @param {string|object} value Value
   * @param {number|null} timeout Timeout limitation
   */
  wrappedConn.setObj = (key: string, value: string | object, timeout?: number) => {
    if (timeout) {
      return wrappedConn.set(key, typeof value === "string" ? value : JSON.stringify(value), "EX", timeout);
    } else {
      return wrappedConn.set(key, typeof value === "string" ? value : JSON.stringify(value));
    }
  };

  return wrappedConn;
};

/**
 * 构建 redis 临时查询链接对象
 * @param {object} configs 配置
 * @returns {any}
 */
const init: (configs: ClientOpts) => any = (configs) => {

  const connGen: () => WrappedRedisClient = () => {
    const connection = createClient(
      configs.port,
      configs.host,
      {
        retry_strategy(options) {
          if (options.error && options.error.code === "ECONNREFUSED") {
            console.error("Redis server refused the connection.");
          }
          // retry 2 times then return a built in error
          if (options.total_retry_time > 2000 * 2) {
            return undefined;
          }
          return 2000; // retry in 2s
        },
        ...configs,
      },
    );

    connection.on("error", (ex) => {
      console.error(ex.message);
    });

    return wrapper(connection);
  };

  const __helper = {};

  ACTIONS
    .concat(EXTENSIONS)
    .forEach((funcName) => {
      __helper[funcName] = (...args: Array<string | number>) =>
        connGen()[funcName]
          .apply(null, args)
          .catch((ex: Error) => {
            console.error(ex.message);
            return null;
          });
    });

  return __helper;
};

export default init;
