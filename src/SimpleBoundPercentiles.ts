/**
 * This is a simple algorithm for calculating quantiles
 */

type OutOfBoundsStrategy = 'ignore'|'trim'

type SimpleBoundPercentilesOptions = {
  // What to do with out-of-bounds values: ignore or trim to [min, max] interval
  outOfBoundsStrategy?: OutOfBoundsStrategy,
}

/**
 * @class SimpleBoundPercentiles
 *
 * This is a simple algorithm for calculating percentiles
 *
 * It divides the input domain, defined by [`min`, `max`] interval,
 * to a number of bins, defined by `eps` value governing the precision
 * When value is inserted, the count of objects in the appropriate bin
 * increases. Then, when we want to acquire percentile, we scan the bins
 * for a first bin where a running total exceed the population threshold
 * for that percentile, and return that bin's value
 *
 * Requirements:
 *   * storage — `O(n)` memory,
 *   * insert — `O(1)` memory, `O(1)` steps,
 *   * percentile — `O(1)` memory, `O(n)` steps,
 *   * where `n = [1 / eps]`
 */
class SimpleBoundPercentiles {
  private min: number
  private max: number
  private oobStrategy: OutOfBoundsStrategy
  private bucketCount: number
  private buckets: Array<number>
  private totalCount: number

  /**
   * @param min        An expected minimum in the input
   * @param max        An expected maximum in the input
   * @param [eps=0.01] A precision of the algorithm. Must be between 0 and 0.5
   * @param [options]  An algorithm's options. Currently just one for out-of-bounds value handling strategy
   */
  public constructor(
    min: number,
    max: number,
    eps: number = 0.01,
    options: SimpleBoundPercentilesOptions = {},
  ) {
    this._validateConstructorParams(min, max, eps, options)

    this.min = min
    this.max = max
    this.oobStrategy = options.outOfBoundsStrategy || 'ignore'
    this.bucketCount = Math.floor(1 / eps)
    this.buckets = this._prepareBuckets(this.bucketCount)
    this.totalCount = 0
  }

  private _prepareBuckets(bucketCount: number): Array<number> {
    const buckets = []
    for (let i = 0; i < bucketCount; ++i)
      buckets[i] = 0
    return buckets
  }

  private _validateConstructorParams(
    min: number,
    max: number,
    eps: number,
    options: SimpleBoundPercentilesOptions,
  ) {
    if (min > max) {
      throw new Error('\'min\' is greater than \'max\'')
    }
    if (eps <= 0 || eps > 0.5) {
      throw new Error('\'eps\' should be between 0 and 0.5')
    }
    if (options.outOfBoundsStrategy)
      if (
        options.outOfBoundsStrategy !== 'ignore' &&
        options.outOfBoundsStrategy !== 'trim'
      ) {
        throw new Error(`Unknown 'options.outOfBoundsStrategy' ${this.oobStrategy}`)
      }
  }

  /**
   * Insert value into the percentile tracker
   * @param value
   */
  public insert(value: number): void {
    if (value < this.min) {
      if (this.oobStrategy === 'ignore') {
        return
      } else if (this.oobStrategy === 'trim') {
        value = this.min
      }
    }

    if (value > this.max) {
      if (this.oobStrategy === 'ignore') {
        return
      } else if (this.oobStrategy === 'trim') {
        value = this.max
      }
    }

    // Increase value count in the appropriate bucket
    let bucketNum = Math.floor(this.bucketCount * (value - this.min) / (this.max - this.min))
    // Values that equal the maximum allowed should go to the rightmost bin
    if (bucketNum === this.bucketCount) bucketNum = this.bucketCount - 1
    this.buckets[bucketNum]++
    this.totalCount++
  }

  /**
   * Calculate `p`-th percentile
   * @param p A percentile to calculate
   * @returns The percentile value
   */
  public percentile(p: number): number {
    if (p < 0 || p > 100) {
      return null
    }

    // Find first non-empty bucket
    let left = 0
    for (; left < this.bucketCount; ++left)
      if (this.buckets[left] !== 0)
        break


    // Find last non-empty bucket
    let right = this.bucketCount - 1
    for (; right >= 0; --right)
      if (this.buckets[right] !== 0)
        break

    // If all buckets are empty, return null
    if (left > right)
      return null

    const threshold = p * this.totalCount / 100
    let pivot = left
    for (let total = 0; pivot <= right; ++pivot) {
      const count = this.buckets[pivot]
      if (count === 0) continue
      total += count
      if (total >= threshold) break
    }

    return this.min + (this.max - this.min) * (pivot + 0.5) / this.bucketCount
  }
}

export default SimpleBoundPercentiles
