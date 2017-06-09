# REDIS-CONN-WRAPPER

> A wrapper for node ['redis'](https://github.com/NodeRedis/node_redis) with auto connection-closing.

## Usage

```javascript

const redis = require('redis')
const wrapper = require('redis-conn-wrapper')

const redisConfig = {
    host: 'localhost',
    port: 6379,
}

let conn = wrapper(redis, redisConfig)

// all the connection functions will auto close when they finished
// conn.get('key').then((data)=>{ ... }).catch((err)=> { ... })

```

