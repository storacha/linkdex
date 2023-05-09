import test from 'ava'
import { encode } from 'multiformats/block'
import * as json from '@ipld/dag-json'
import { sha256 as hasher } from 'multiformats/hashes/sha2'
import { blake2b512 } from '@multiformats/blake2/blake2b'
import { HashingLinkIndexer } from '../hashing-indexer.js'

test('should do hash verification', async t => {
  const block = await encode({ value: { pass: 'block' }, codec: json, hasher })

  const linkIndexer = new HashingLinkIndexer()
  await linkIndexer.decodeAndIndex(block)

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

  const linkIndexer = new HashingLinkIndexer()
  await linkIndexer.decodeAndIndex(block)

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
  const block = await encode({ value: 'yyy', codec: json, hasher: blake2b512 })

  const linkIndexer = new HashingLinkIndexer()
  await linkIndexer.decodeAndIndex(block)

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
