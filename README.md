# REDIS-CONN-WRAPPER

> A wrapper for node ['redis'](https://github.com/NodeRedis/node_redis) with auto connection-closing.

## Usage

install via yarn/npm `yarn add redis-conn-wrapper` `npm install redis-conn-wrapper`

```javascript

const redis = require('redis')
const wrapper = require('redis-conn-wrapper')

const redisConfig = {
    host: 'localhost',
    port: 6379,
}

let conn = wrapper(redis, redisConfig)

// connection will auto close when it finished
conn.get('key')
    .then((data)=>{ 
        //... 
    })
    .catch((err)=> {
        //...
    })
```

# Updates

- 1.0.4: change source to ES6 syntax