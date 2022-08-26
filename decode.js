import { sha256 as hasher } from 'multiformats/hashes/sha2'
import * as Block from 'multiformats/block'
import * as raw from 'multiformats/codecs/raw'
import * as dagPb from '@ipld/dag-pb'
import * as dagCbor from '@ipld/dag-cbor'
import * as dagJson from '@ipld/dag-json'

/** @type {BlockDecoders} */
const Decoders = {
  [raw.code]: raw,
  [dagPb.code]: dagPb,
  [dagCbor.code]: dagCbor,
  [dagJson.code]: dagJson
}

export async function decode ({ cid, bytes }) {
  const decoder = Decoders[cid.code]
  if (!decoder) throw new Error(`unknown codec: ${cid.code}`)
  return Block.decode({ bytes, codec: decoder, hasher })
}
