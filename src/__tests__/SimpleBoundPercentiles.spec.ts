import SimpleBoundPercentiles from '../SimpleBoundPercentiles'

function prepareInput() {
  const min = Math.round(Math.random() * 1000 / 2)
  const max = Math.round((1 + Math.random()) * 1000 / 2)
  const eps = 1 / (Math.random() * 100000)
  const delta = (max - min) * eps
  const length = 200 + Math.round(Math.random() * 300)
  return { min, max, eps, delta, length }
}

function prepareValue(min: number, max: number): number {
  return Math.round(min + Math.random() * (max - min))
}

function prepareStream(min: number, max: number, length: number): Array<number> {
  let stream = []
  for (let j = 0; j < length; ++j) {
    stream.push(prepareValue(min, max))
  }
  return stream
}

describe('SimpleBoundPercentiles', () => {
  it('returns `null` if no values were inserted', () => {
    const min = 0, max = 100, eps = 0.01
    const perc = new SimpleBoundPercentiles(min, max, eps)
    expect(perc.percentile(0)).toBe(null)
    expect(perc.percentile(50)).toBe(null)
    expect(perc.percentile(100)).toBe(null)
  })

  it('returns approximately inserted value if only one value were inserted', () => {
    for (let i = 0; i < 100; ++i) {
      const { min, max, eps, delta } = prepareInput()
      const perc = new SimpleBoundPercentiles(min, max, eps)
      const value = prepareValue(min, max)
      perc.insert(value)
      expect(Math.abs(value - perc.percentile(0))).toBeLessThanOrEqual(delta)
      expect(Math.abs(value - perc.percentile(50))).toBeLessThanOrEqual(delta)
      expect(Math.abs(value - perc.percentile(100))).toBeLessThanOrEqual(delta)
    }
  })

  it('ignores out of lower bound values by default', () => {
    const { min, max, eps } = prepareInput()
    const perc = new SimpleBoundPercentiles(min, max, eps)
    perc.insert(min - 1)
    expect(perc.percentile(0)).toBe(null)
    expect(perc.percentile(50)).toBe(null)
    expect(perc.percentile(100)).toBe(null)
  })

  it('ignores out of upper bound values by default', () => {
    const { min, max, eps } = prepareInput()
    const perc = new SimpleBoundPercentiles(min, max, eps)
    perc.insert(min - 1)
    expect(perc.percentile(0)).toBe(null)
    expect(perc.percentile(50)).toBe(null)
    expect(perc.percentile(100)).toBe(null)
  })

  it('trims out of lower bound values with `options.outOfBoundsStrategy` set to `trim`', () => {
    const { min, max, eps, delta } = prepareInput()
    const perc = new SimpleBoundPercentiles(min, max, eps, { outOfBoundsStrategy: 'trim' })
    perc.insert(min - 1)
    const percMin = perc.percentile(0)
    const percHalf = perc.percentile(50)
    const percMax = perc.percentile(100)
    expect(Math.abs(min - percMin)).toBeLessThanOrEqual(delta)
    expect(Math.abs(min - percHalf)).toBeLessThanOrEqual(delta)
    expect(Math.abs(min - percMax)).toBeLessThanOrEqual(delta)
  })

  it('trims out of upper bound values with `options.outOfBoundsStrategy` set to `trim`', () => {
    const { min, max, eps, delta } = prepareInput()
    const perc = new SimpleBoundPercentiles(min, max, eps, { outOfBoundsStrategy: 'trim' })
    perc.insert(max + 1)
    const percMin = perc.percentile(0)
    const percHalf = perc.percentile(50)
    const percMax = perc.percentile(100)
    expect(Math.abs(max - percMin)).toBeLessThanOrEqual(delta)
    expect(Math.abs(max - percHalf)).toBeLessThanOrEqual(delta)
    expect(Math.abs(max - percMax)).toBeLessThanOrEqual(delta)
  })

  it('returns appropriate percentiles for the stream data', () => {
    for (let i = 0; i < 1000; ++i) {
      const { min, max, eps, delta, length } = prepareInput()
      let stream = prepareStream(min, max, length)
      const perc = new SimpleBoundPercentiles(min, max, eps)
      stream.forEach(v => perc.insert(v))
      stream.sort((a, b) => a - b)
      const streamMin = stream[0]
      const streamHalf = stream[
        stream.length % 2 === 0
          ? stream.length / 2 - 1
          : Math.floor(stream.length / 2)
      ]
      const streamMax = stream[stream.length - 1]
      const percMin = perc.percentile(0)
      const percMax = perc.percentile(100)
      const percHalf = perc.percentile(50)
      expect(Math.abs(streamMin - percMin)).toBeLessThanOrEqual(delta)
      expect(Math.abs(streamMax - percMax)).toBeLessThanOrEqual(delta)
      expect(Math.abs(streamHalf - percHalf)).toBeLessThanOrEqual(delta)
    }
  })
})
