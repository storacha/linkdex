import { CarBlockIterator } from '@ipld/car/iterator'
import { maybeDecode, decoders } from './decode.js'

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
  /**
   * @param {object} [opts]
   * @param {AnyBlockDecoder[]} [opts.codecs] - bring your own codecs
   * @typedef { import('multiformats/block').BlockDecoder<?, ?> } AnyBlockDecoder
   */
  constructor (opts) {
    /**
     * Map block CID to the set of CIDs it links to
     * @type {Map<string, Set<string>>}
     */
    this.idx = new Map()
    this.blocksIndexed = 0
    this.undecodable = 0
    /**
     * @template {number} Code
     * @template T
     * @typedef {Map<Code, import('multiformats/block').BlockDecoder<Code, T>>} BlockDecoderMap
     */
    /** @type BlockDecoderMap<?, ?> */
    this.codecs = opts?.codecs ? new Map(opts.codecs.map(c => [c.code, c])) : decoders
  }

  /**
   * Decode the block and index any CIDs it links to
   * @param {import('@ipld/car/api').Block} block
   */
  decodeAndIndex ({ cid, bytes }) {
    const block = maybeDecode({ cid, bytes }, this)
    if (!block) {
      this.undecodable++
    } else {
      this._index(block)
      this.blocksIndexed++
    }
  }

  /**
   * Decode and index identity CID but don't count it as a block.
   * Where a link is an identity cid, The bytes are in the CID!
   * We consider a CAR complete even if an identity CID appears only as a link, not a block entry.
   * To make that work we index it, but don't count it as a block.
   * @param {import('multiformats/cid').CID} cid
   */
  _decodeAndIndexIdentityCidLink (cid) {
    const block = maybeDecode({ cid, bytes: cid.multihash.digest }, this)
    if (!block) {
      this.undecodable++
    } else {
      this._index(block)
      // do not increment this.blocksIndexed here as its a link.
    }
  }

  /**
   * Index all the links from the block
   * @param {import('multiformats/block').Block<?>} block
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
   * @typedef { 'Complete' | 'Partial' | 'Unknown' } DagStructure
   * @returns DagStructure
   */
  getDagStructureLabel () {
    if (this.undecodable > 0) {
      return 'Unknown'
    }
    if (this.isCompleteDag()) {
      return 'Complete'
    }
    return 'Partial'
  }

  /**
   * @typedef {Object} Report
   * @property {DagStructure} structure - Are there any Linked CIDs that are not present in the set of blocks
   * @property {number} blocksIndexed - How many blocks were indexed
   * @property {number} uniqueCids - How many unique CIDs
   * @property {number} undecodeable - How many blocks/CIDs failed to decode
   */

  /**
   * Get the results after all blocks are indexed.
   * @returns Report
   */
  report () {
    return {
      structure: this.getDagStructureLabel(),
      blocksIndexed: this.blocksIndexed,
      uniqueCids: this.idx.size,
      undecodeable: this.undecodable
    }
  }
}
