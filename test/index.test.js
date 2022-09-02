import test from 'ava'
import { encode } from 'multiformats/block'
import * as pb from '@ipld/dag-pb'
import * as json from '@ipld/dag-json'
import { sha256 as hasher } from 'multiformats/hashes/sha2'
import { LinkIndexer } from '../index.js'

test('should index dag-pb with no links', async t => {
  const block = await encode({ value: pb.prepare({ Links: [] }), codec: pb, hasher })
  const linkIndexer = new LinkIndexer()
  linkIndexer.decodeAndIndex({ cid: block.cid, bytes: block.bytes })
  t.is(linkIndexer.isCompleteDag(), true)
  t.is(linkIndexer.getDagStructureLabel(), 'Complete')
  t.deepEqual(linkIndexer.report(), {
    structure: 'Complete',
    blocksIndexed: 1,
    blocksUnique: 1,
    blocksUndecodeable: 0
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
    blocksUnique: 2,
    blocksUndecodeable: 0
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
    blocksUnique: 1,
    blocksUndecodeable: 0
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
    blocksUnique: 2,
    blocksUndecodeable: 0
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
    blocksUnique: 0,
    blocksUndecodeable: 1
  })
})
