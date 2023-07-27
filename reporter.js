import { HashingLinkIndexer } from './hashing-indexer.js'

class DiscardingLinkIndexer extends HashingLinkIndexer {
  /**
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
      // if we have already indexed this link, do not add as a target, we don't
      // need to check it for the report.
      if (this.idx.has(targetCid.toString())) {
        continue
      }
      targets.add(targetCid.toString())
      if (targetCid.multihash.code === 0x0) {
        this._decodeAndIndexIdentityCidLink(targetCid)
      }
    }
    this.idx.set(key, targets)
  }
}

/**
 * A linkdex reporter is an indexer that makes efficient use of memory by
 * discarding linked CIDs that are known to already be indexed.
 *
 * Use this class if you only need the report and do not care about the index
 * (`LinkIndexer.idx`) after you have finished adding blocks.
 */
export class Reporter {
  #indexer

  constructor () {
    this.#indexer = new DiscardingLinkIndexer()
  }

  /**
   * Decode the block and index any CIDs it links to.
   * @param {import('@ipld/car/api').Block} block
   * @param {object} [opts]
   * @param {import('./decode.js').BlockDecoders} [opts.codecs] Bring your own codecs
   */
  decodeAndIndex ({ cid, bytes }, opts) {
    return this.#indexer.decodeAndIndex({ cid, bytes }, opts)
  }

  isCompleteDag () {
    return this.#indexer.isCompleteDag()
  }

  getDagStructureLabel () {
    return this.#indexer.getDagStructureLabel()
  }

  report () {
    return this.#indexer.report()
  }
}
