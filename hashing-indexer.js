import { validateBlock, UnsupportedHashError, HashMismatchError } from '@web3-storage/car-block-validator'
import { LinkIndexer } from './index.js'

/**
 * @typedef {object} HashReport
 * @property {number} hashPassed How many CIDs were verified as matching block bytes.
 * @property {number} hashFailed How many CIDs failed verification that they matched block bytes.
 * @property {number} hashUnknown How many CIDs could not be verified because the hashing function was unknown.
*/

/**
 * A link indexer that also verifies that block bytes hash to their reported CID.
 */
export class HashingLinkIndexer extends LinkIndexer {
  constructor () {
    super()
    this.hashPassed = 0
    this.hashFailed = 0
    this.hashUnknown = 0
  }

  /**
   * Hash the block bytes to verify the CID matches, decode the block and index
   * any CIDs the block links to.
   * @param {import('@ipld/car/api').Block} block
   * @param {object} [opts]
   * @param {import('./decode').BlockDecoders} [opts.codecs] - bring your own codecs
   */
  decodeAndIndex ({ cid, bytes }, opts) {
    const handleValidateSuccess = () => {
      this.hashPassed++
      return super.decodeAndIndex({ cid, bytes }, opts)
    }
    /** @param {Error} err */
    const handleValidateFailure = err => {
      if (err instanceof UnsupportedHashError) {
        this.hashUnknown++
      } else if (err instanceof HashMismatchError) {
        this.hashFailed++
      } else {
        throw err
      }
      return super.decodeAndIndex({ cid, bytes }, opts)
    }
    try {
      // @ts-expect-error
      const result = validateBlock({ cid, bytes })
      if (result instanceof Promise) {
        return result.then(handleValidateSuccess, handleValidateFailure)
      }
      return handleValidateSuccess()
    } catch (/** @type {any} */ err) {
      return handleValidateFailure(err)
    }
  }

  isCompleteDag () {
    if (this.hashFailed > 0) {
      throw new Error('DAG completeness unknown! Some blocks failed hash verification')
    }
    if (this.hashUnknown > 0) {
      throw new Error('DAG completeness unknown! Some CIDs use unknown hash functions')
    }
    return super.isCompleteDag()
  }

  getDagStructureLabel () {
    if (this.hashFailed > 0 || this.hashUnknown > 0) {
      return 'Unknown'
    }
    return super.getDagStructureLabel()
  }

  /** @returns {import('./index').Report & HashReport} */
  report () {
    return Object.assign(super.report(), {
      hashPassed: this.hashPassed,
      hashFailed: this.hashFailed,
      hashUnknown: this.hashUnknown
    })
  }
}
