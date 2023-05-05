import * as Block from 'multiformats/block'
import * as raw from 'multiformats/codecs/raw'
import { sha256 } from 'multiformats/hashes/sha2'
import { identity } from 'multiformats/hashes/identity'
import { equals } from 'multiformats/bytes'
import * as json from '@ipld/dag-json'
import * as cbor from '@ipld/dag-cbor'
import * as pb from '@ipld/dag-pb'

/**
 * @typedef {Record<number, import('multiformats/codecs/interface').BlockDecoder<?, ?>>} BlockDecoders
 * @typedef {Record<number, import('multiformats/hashes/interface').MultihashHasher<any>>} MultihashHashers
 * @typedef {'pass'|'fail'|'unknown'} HashVerificationResult
 */

/** @type {BlockDecoders} */
const decoders = {
  [pb.code]: pb,
  [raw.code]: raw,
  [cbor.code]: cbor,
  [json.code]: json
}

/** @type {MultihashHashers} */
const multihashHashers = {
  [identity.code]: identity,
  [sha256.code]: sha256
}

/**
 * Decode a CAR Block (bytes) into a multiformats Block.
 * Decoding allows us to find out if that block links to any others by CID.
 * @param {import('@ipld/car/api').Block} block
 * @param {object} opts
 * @param {BlockDecoders} [opts.codecs]
 */
export function maybeDecode ({ cid, bytes }, { codecs = decoders } = { codecs: decoders }) {
  const codec = codecs[cid.code]
  if (codec) {
    if (cid.multihash.code === 0x0) {
      // A CAR Block iterator would give us an empty bytes array, so use the cid bytes instead
      return Block.createUnsafe({ cid, bytes: cid.multihash.digest, codec })
    }
    return Block.createUnsafe({ cid, bytes, codec })
  }
}

/**
 * Verify block bytes hash to the expected CID.
 * @param {import('@ipld/car/api').Block} block
 * @param {object} [opts]
 * @param {MultihashHashers} [opts.hashers]
 * @returns {HashVerificationResult|Promise<HashVerificationResult>}
 */
export function verifyHash ({ cid, bytes }, opts = {}) {
  const hashers = opts.hashers || multihashHashers
  const hasher = hashers[cid.multihash.code]
  if (!hasher) return 'unknown'
  const result = hasher.digest(bytes)
  /** @param {import('multiformats/hashes/interface').MultihashDigest} h */
  const compareDigests = h => equals(cid.multihash.bytes, h.bytes) ? 'pass' : 'fail'
  return result instanceof Promise
    ? result.then(compareDigests)
    : compareDigests(result)
}
