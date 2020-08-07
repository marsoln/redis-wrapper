# REDIS-CONN-WRAPPER

> A wrapper for node ['redis'](https://github.com/NodeRedis/node_redis) with auto connection-closing.

## Usage

install via yarn/npm `yarn add redis-conn-wrapper` `npm install redis-conn-wrapper`

```javascript

const wrapper = require('redis-conn-wrapper')

const redisConfig = {
    host: 'localhost',
    port: 6379,
}

let conn = wrapper(redisConfig)

// connection will auto close when it finished
conn.get('key').then((data)=> {
        //...
    }).catch((err)=> {
        //...
    })

// with obj

conn.setObj('key1', { name : 1 }).then(()=> {
    conn.getObj('key1').then(({name})=>{ console.log(`name is ${name}`)})
})

```

## Updates

- 1.0.4: change source to ES6 syntax
- 1.1.0: add setObj and getObj
- 1.1.1: change to typescript
- 1.2.0: add ts declaration, remove auto close
- 1.2.1: update dependencies
