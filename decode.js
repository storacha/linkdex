import * as Block from 'multiformats/block'
import * as raw from 'multiformats/codecs/raw'
import * as json from '@ipld/dag-json'
import * as cbor from '@ipld/dag-cbor'
import * as pb from '@ipld/dag-pb'

/** @typedef {Record<number, import('multiformats/codecs/interface').BlockDecoder<?, ?>>} BlockDecoders */

/** @type BlockDecoders */
const decoders = {
  [pb.code]: pb,
  [raw.code]: raw,
  [cbor.code]: cbor,
  [json.code]: json
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
