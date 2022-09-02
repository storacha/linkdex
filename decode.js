import * as Block from 'multiformats/block'
import * as raw from 'multiformats/codecs/raw'
import * as json from '@ipld/dag-json'
import * as cbor from '@ipld/dag-cbor'
import * as pb from '@ipld/dag-pb'

/** @typedef {Record<number, import('multiformats/block').BlockDecoder<?, ?>>} BlockDecoders */

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
 * @returns {Block.Block<?> | undefined}
 */
export function maybeDecode ({ cid, bytes }, { codecs = decoders } = { codecs: decoders }) {
  const codec = codecs[cid.code]
  if (codec) {
    return Block.createUnsafe({ cid, bytes, codec })
  }
}
