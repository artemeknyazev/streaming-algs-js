import test from '../'

describe('it runs a test', () => {
  it('outputs "Hello, World!"', () => {
    expect(test()).toBe('Hello, World!')
  })
})