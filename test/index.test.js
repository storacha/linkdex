import test from 'ava'
import { encode } from 'multiformats/block'
import * as pb from '@ipld/dag-pb'
import * as json from '@ipld/dag-json'
import { identity } from 'multiformats/hashes/identity'
import { sha256 as hasher } from 'multiformats/hashes/sha2'
import { blake2b256 } from '@multiformats/blake2/blake2b'
import { LinkIndexer } from '../index.js'

test('should index dag-json block with identity links (logically complete car)', async t => {
  const id = await encode({ value: 'itsa me! mario!', codec: json, hasher: identity })
  const block = await encode({ value: { Links: [id.cid] }, codec: json, hasher })
  const linkIndexer = new LinkIndexer()
  // logically complete CAR has a dag-json block that links to an identity CID that does not appear as a block entry in the car.
  linkIndexer.decodeAndIndex({ cid: block.cid, bytes: block.bytes })
  t.is(linkIndexer.isCompleteDag(), true)
  t.is(linkIndexer.getDagStructureLabel(), 'Complete')
  t.deepEqual(linkIndexer.report(), {
    structure: 'Complete',
    blocksIndexed: 1,
    uniqueCids: 2,
    undecodeable: 0,
    hashPassed: 0,
    hashFailed: 0,
    hashUnknown: 0
  })
})

test('should index dag-json block and identity block (explicitly complete car)', async t => {
  const id = await encode({ value: 'itsa me! mario!', codec: json, hasher: identity })
  const block = await encode({ value: { Links: [id.cid] }, codec: json, hasher })
  const linkIndexer = new LinkIndexer()
  // logically complete CAR has a dag-json block that links to an identity CID that does not appear as a block entry in the car.
  linkIndexer.decodeAndIndex({ cid: block.cid, bytes: block.bytes })
  linkIndexer.decodeAndIndex({ cid: id.cid, bytes: new Uint8Array() })
  t.is(linkIndexer.isCompleteDag(), true)
  t.is(linkIndexer.getDagStructureLabel(), 'Complete')
  t.deepEqual(linkIndexer.report(), {
    structure: 'Complete',
    blocksIndexed: 2,
    uniqueCids: 2,
    undecodeable: 0,
    hashPassed: 0,
    hashFailed: 0,
    hashUnknown: 0
  })
})

test('should index identity cid blocks (explicitly complete car)', async t => {
  const id = await encode({ value: 'itsa me! mario!', codec: json, hasher: identity })
  const id2 = await encode({ value: { foo: id.cid }, codec: json, hasher: identity })
  const linkIndexer = new LinkIndexer()
  // very complete CAR has 2 identity links that are explicitly encoded as blocks in the CAR
  linkIndexer.decodeAndIndex({ cid: id.cid, bytes: new Uint8Array() })
  linkIndexer.decodeAndIndex({ cid: id2.cid, bytes: new Uint8Array() })
  t.is(linkIndexer.isCompleteDag(), true)
  t.is(linkIndexer.getDagStructureLabel(), 'Complete')
  t.deepEqual(linkIndexer.report(), {
    structure: 'Complete',
    blocksIndexed: 2,
    uniqueCids: 2,
    undecodeable: 0,
    hashPassed: 0,
    hashFailed: 0,
    hashUnknown: 0
  })
})

test('should index identity cids with dangling links (patitial via identity)', async t => {
  const block = await encode({ value: pb.prepare({ Links: [] }), codec: pb, hasher })
  const id = await encode({ value: { foo: block.cid }, codec: json, hasher: identity })
  const linkIndexer = new LinkIndexer()
  // we index the identity cid which links to a non-identity link that we don't index
  linkIndexer.decodeAndIndex({ cid: id.cid, bytes: new Uint8Array() })
  t.is(linkIndexer.isCompleteDag(), false)
  t.is(linkIndexer.getDagStructureLabel(), 'Partial')
  t.deepEqual(linkIndexer.report(), {
    structure: 'Partial',
    blocksIndexed: 1,
    uniqueCids: 1,
    undecodeable: 0,
    hashPassed: 0,
    hashFailed: 0,
    hashUnknown: 0
  })
})

test('should index dag-pb with no links', async t => {
  const block = await encode({ value: pb.prepare({ Links: [] }), codec: pb, hasher })
  const linkIndexer = new LinkIndexer()
  linkIndexer.decodeAndIndex({ cid: block.cid, bytes: block.bytes })
  t.is(linkIndexer.isCompleteDag(), true)
  t.is(linkIndexer.getDagStructureLabel(), 'Complete')
  t.deepEqual(linkIndexer.report(), {
    structure: 'Complete',
    blocksIndexed: 1,
    uniqueCids: 1,
    undecodeable: 0,
    hashPassed: 0,
    hashFailed: 0,
    hashUnknown: 0
  })
})

test('should index dag-pb with links for complete dag', async t => {
  const child = await encode({ value: pb.prepare({ Links: [] }), codec: pb, hasher })
  const block = await encode({ value: pb.prepare({ Links: [child.cid] }), codec: pb, hasher })
  const linkIndexer = new LinkIndexer()

  linkIndexer.decodeAndIndex({ cid: block.cid, bytes: block.bytes })
  t.is(linkIndexer.isCompleteDag(), false)
  t.is(linkIndexer.getDagStructureLabel(), 'Partial')

  linkIndexer.decodeAndIndex({ cid: child.cid, bytes: child.bytes })
  t.is(linkIndexer.isCompleteDag(), true)
  t.is(linkIndexer.getDagStructureLabel(), 'Complete')

  t.deepEqual(linkIndexer.report(), {
    structure: 'Complete',
    blocksIndexed: 2,
    uniqueCids: 2,
    undecodeable: 0,
    hashPassed: 0,
    hashFailed: 0,
    hashUnknown: 0
  })
})

test('should index dag-json with no links', async t => {
  const block = await encode({ value: { foo: 'bar ' }, codec: json, hasher })
  const linkIndexer = new LinkIndexer()
  linkIndexer.decodeAndIndex({ cid: block.cid, bytes: block.bytes })
  t.is(linkIndexer.isCompleteDag(), true)
  t.is(linkIndexer.getDagStructureLabel(), 'Complete')
  t.deepEqual(linkIndexer.report(), {
    structure: 'Complete',
    blocksIndexed: 1,
    uniqueCids: 1,
    undecodeable: 0,
    hashPassed: 0,
    hashFailed: 0,
    hashUnknown: 0
  })
})

test('should index dag-json with links for complete dag', async t => {
  const child = await encode({ value: { foo: 'bar' }, codec: json, hasher })
  const block = await encode({ value: { child: child.cid }, codec: json, hasher })
  const linkIndexer = new LinkIndexer()

  linkIndexer.decodeAndIndex({ cid: block.cid, bytes: block.bytes })
  t.is(linkIndexer.isCompleteDag(), false)
  t.is(linkIndexer.getDagStructureLabel(), 'Partial')

  linkIndexer.decodeAndIndex({ cid: child.cid, bytes: child.bytes })
  t.is(linkIndexer.isCompleteDag(), true)
  t.is(linkIndexer.getDagStructureLabel(), 'Complete')

  t.deepEqual(linkIndexer.report(), {
    structure: 'Complete',
    blocksIndexed: 2,
    uniqueCids: 2,
    undecodeable: 0,
    hashPassed: 0,
    hashFailed: 0,
    hashUnknown: 0
  })
})

test('should handle unknown codecs', async t => {
  const block = await encode({ value: { foo: 'bar ' }, codec: json, hasher })
  const linkIndexer = new LinkIndexer()
  // simulate not having a codec
  linkIndexer.decodeAndIndex({ cid: block.cid, bytes: block.bytes }, { codecs: [] })
  t.is(linkIndexer.getDagStructureLabel(), 'Unknown')
  t.throws(() => linkIndexer.isCompleteDag())
  t.deepEqual(linkIndexer.report(), {
    structure: 'Unknown',
    blocksIndexed: 0,
    uniqueCids: 0,
    undecodeable: 1,
    hashPassed: 0,
    hashFailed: 0,
    hashUnknown: 0
  })
})

test('should do hash verification', async t => {
  const block = await encode({ value: { pass: 'block' }, codec: json, hasher })

  const linkIndexer = new LinkIndexer()
  await linkIndexer.hashAndIndex(block)

  t.is(linkIndexer.getDagStructureLabel(), 'Complete')
  t.is(linkIndexer.isCompleteDag(), true)
  t.deepEqual(linkIndexer.report(), {
    structure: 'Complete',
    blocksIndexed: 1,
    uniqueCids: 1,
    undecodeable: 0,
    hashPassed: 1,
    hashFailed: 0,
    hashUnknown: 0
  })
})

test('should handle failed hash verification', async t => {
  const block = {
    cid: (await encode({ value: 'xxx', codec: json, hasher })).cid,
    bytes: (await encode({ value: 'yyy', codec: json, hasher })).bytes
  }

  const linkIndexer = new LinkIndexer()
  await linkIndexer.hashAndIndex(block)

  t.is(linkIndexer.getDagStructureLabel(), 'Unknown')
  t.throws(() => linkIndexer.isCompleteDag(), { message: /blocks failed hash verification/ })
  t.deepEqual(linkIndexer.report(), {
    structure: 'Unknown',
    blocksIndexed: 1,
    uniqueCids: 1,
    undecodeable: 0,
    hashPassed: 0,
    hashFailed: 1,
    hashUnknown: 0
  })
})

test('should handle unknown hash functions', async t => {
  const block = await encode({ value: 'yyy', codec: json, hasher: blake2b256 })

  const linkIndexer = new LinkIndexer()
  await linkIndexer.hashAndIndex(block)

  t.is(linkIndexer.getDagStructureLabel(), 'Unknown')
  t.throws(() => linkIndexer.isCompleteDag(), { message: /CIDs use unknown hash functions/ })
  t.deepEqual(linkIndexer.report(), {
    structure: 'Unknown',
    blocksIndexed: 1,
    uniqueCids: 1,
    undecodeable: 0,
    hashPassed: 0,
    hashFailed: 0,
    hashUnknown: 1
  })
})
