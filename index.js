import { CarBlockIterator } from '@ipld/car/iterator'
import { validateBlock, UnsupportedHashError, HashMismatchError } from '@web3-storage/car-block-validator'
import { maybeDecode } from './decode.js'

/** @typedef { 'Complete' | 'Partial' | 'Unknown' } DagStructure */

/**
 * @typedef {Object} Report
 * @property {DagStructure} structure - Are there any Linked CIDs that are not present in the set of blocks
 * @property {number} blocksIndexed - How many blocks were indexed
 * @property {number} uniqueCids - How many unique CIDs
 * @property {number} undecodeable - How many blocks/CIDs failed to decode
 * @property {number} hashPassed - How many CIDs were verified as matching block bytes
 * @property {number} hashFailed - How many CIDs failed verification that they matched block bytes
 * @property {number} hashUnknown - How many CIDs could not be verified because the hash was unknown
 */

/**
 * @param {AsyncIterable<Uint8Array>} carStream
 */
export async function * decodedBlocks (carStream) {
  const car = await CarBlockIterator.fromIterable(carStream)
  for await (const block of car) {
    const decoded = maybeDecode(block)
    if (!decoded) {
      throw new Error(`unknown codec ${block.cid.code}`)
    }
    yield decoded
  }
}

/**
 * @param {AsyncIterable<Uint8Array>} carStream
 */
export async function * linkdex (carStream) {
  for await (const block of decodedBlocks(carStream)) {
    let hasLinks = false
    for (const [, targetCid] of block.links()) {
      hasLinks = true
      yield { src: block.cid.toString(), dest: targetCid.toString() }
    }
    if (!hasLinks) {
      yield { src: block.cid.toString() }
    }
  }
}

/**
 * A util to record all the links from a given set of Blocks.
 * Pass blocks to `decodeAndIndex` as you iterate over a CAR.
 * Then call `getDagStructureLabel` to find out if the dag is
 * complete... if all linked to CIDs are also contained in in
 * the set, then it is complete.
 */
export class LinkIndexer {
  constructor () {
    /**
     * Map block CID to the set of CIDs it links to
     * @type {Map<string, Set<string>>}
     * */
    this.idx = new Map()
    this.blocksIndexed = 0
    this.undecodable = 0
    this.hashPassed = 0
    this.hashFailed = 0
    this.hashUnknown = 0
  }

  /**
   * Decode the block and index any CIDs it links to
   * @param {import('@ipld/car/api').Block} block
   * @param {object} [opts]
   * @param {import('./decode.js').BlockDecoders} [opts.codecs] - bring your own codecs
   */
  decodeAndIndex ({ cid, bytes }, opts) {
    const block = maybeDecode({ cid, bytes }, opts)
    if (!block) {
      this.undecodable++
    } else {
      this._index(block)
      this.blocksIndexed++
    }
  }

  /**
   * Hash the block bytes to verify the CID matches, decode the block and index
   * any CIDs the block links to.
   * @param {import('@ipld/car/api').Block} block
   * @param {object} [opts]
   * @param {import('./decode').BlockDecoders} [opts.codecs] - bring your own codecs
   */
  hashAndIndex ({ cid, bytes }, opts) {
    const handleValidateSuccess = () => {
      this.hashPassed++
      return this.decodeAndIndex({ cid, bytes }, opts)
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
      return this.decodeAndIndex({ cid, bytes }, opts)
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

  /**
   * Decode and index identity CID but don't count it as a block.
   * Where a link is an identity cid, The bytes are in the CID!
   * We consider a CAR complete even if an identity CID appears only as a link, not a block entry.
   * To make that work we index it, but don't count it as a block.
   * @param {import('multiformats/cid').CID} cid
   * @param {object} [opts]
   * @param {import('./decode.js').BlockDecoders} [opts.codecs] - bring your own codecs
   */
  _decodeAndIndexIdentityCidLink (cid, opts) {
    const block = maybeDecode({ cid, bytes: cid.multihash.digest }, opts)
    if (!block) {
      this.undecodable++
    } else {
      this._index(block)
      // do not increment this.blocksIndexed here as its a link.
    }
  }

  /**
   * Index all the links from the block
   * @template T
   * @template {number} C
   * @template {number} A
   * @template {import('multiformats').Version} V
   * @param {import('multiformats/block/interface').BlockView<T, C, A, V>} block
   */
  _index (block) {
    const key = block.cid.toString()
    if (this.idx.has(key)) {
      return // already indexed this block
    }
    const targets = new Set()
    for (const [, targetCid] of block.links()) {
      targets.add(targetCid.toString())
      if (targetCid.multihash.code === 0x0) {
        this._decodeAndIndexIdentityCidLink(targetCid)
      }
    }
    this.idx.set(key, targets)
  }

  /**
   * Find out if any of the links point to a CID that isn't in the CAR
   * @returns {boolean}
   */
  isCompleteDag () {
    if (this.hashFailed > 0) {
      throw new Error('DAG completeness unknown! Some blocks failed hash verification')
    }
    if (this.hashUnknown > 0) {
      throw new Error('DAG completeness unknown! Some CIDs use unknown hash functions')
    }
    if (this.undecodable > 0) {
      throw new Error('DAG completeness unknown! Some blocks failed to decode')
    }
    if (this.idx.size === 0) {
      throw new Error('No blocks were indexed.')
    }
    for (const targets of this.idx.values()) {
      for (const target of targets) {
        if (!this.idx.has(target)) {
          return false
        }
      }
    }
    return true
  }

  /**
   * Provide a value for the `structure` metadata for the CAR.
   * @returns {DagStructure}
   */
  getDagStructureLabel () {
    if (this.undecodable > 0 || this.hashFailed > 0 || this.hashUnknown > 0) {
      return 'Unknown'
    }
    if (this.isCompleteDag()) {
      return 'Complete'
    }
    return 'Partial'
  }

  /**
   * Get the results after all blocks are indexed.
   * @returns {Report}
   */
  report () {
    return {
      structure: this.getDagStructureLabel(),
      blocksIndexed: this.blocksIndexed,
      uniqueCids: this.idx.size,
      undecodeable: this.undecodable,
      hashPassed: this.hashPassed,
      hashFailed: this.hashFailed,
      hashUnknown: this.hashUnknown
    }
  }
}
