require('babel-register')
require('babel-polyfill')

const redis = require('redis')
const initRedis = require('../src/index')
const assert = require('assert')

const redisConfig = {
  host: 'localhost',
  port: 6379,
}

let conn = initRedis(redis, redisConfig)

describe('connection', () => {

  it('should set the string data correctly', async () => {
    let input_key = 'test-key'
    let input_value = 'test-value'

    await conn.set(input_key, input_value)

    let res = await conn.get(input_key)

    assert.equal(res, input_value)
  })

  it('should also be able to set a hash value', async () => {
    let table = 'test-table'
    let input_key = 'test-key'
    let input_value = 'test-value'

    await conn.hset(table, input_key, input_value)

    let res = await conn.hget(table, input_key)

    assert.equal(res, input_value)
  })

  it('should storage an object', async () => {
    let input_key = 'test-object-key'
    let input_value = { name: 'haha' }

    await conn.setObj(input_key, input_value)

    let res = await conn.getObj(input_key)

    assert.equal(res.name, 'haha')
  })
})
