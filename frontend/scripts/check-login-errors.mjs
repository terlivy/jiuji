import assert from 'node:assert/strict'
import { isAlreadyRegisteredError } from '../src/utils/auth-errors.mjs'

assert.equal(
  isAlreadyRegisteredError({ response: { status: 409, data: { code: 409 } } }),
  true,
  'HTTP 409 register errors should fall back to login',
)

assert.equal(
  isAlreadyRegisteredError({ response: { status: 500, data: { code: 500 } } }),
  false,
  'Server errors should not fall back to login',
)

assert.equal(
  isAlreadyRegisteredError({ code: 409 }),
  true,
  'Non-throw response objects with code 409 should still be supported',
)

console.log('Login error checks passed')
