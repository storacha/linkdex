import test from 'ava'
import { encode } from 'multiformats/block'
import * as json from '@ipld/dag-json'
import { sha256 as hasher } from 'multiformats/hashes/sha2'
import { Reporter } from '../reporter.js'

test('should report correctly when adding blocks that link to already indexed blocks', async t => {
  const leaf0 = await encode({ value: 'leaf0', codec: json, hasher })
  const leaf1 = await encode({ value: 'leaf1', codec: json, hasher })
  const branch = await encode({ value: [leaf0.cid, leaf1.cid], codec: json, hasher })
  const root = await encode({ value: { branch: branch.cid }, codec: json, hasher })

  const reporter = new Reporter()
  await reporter.decodeAndIndex(leaf0)
  await reporter.decodeAndIndex(branch) // target (leaf0) already indexed
  await reporter.decodeAndIndex(leaf1)
  await reporter.decodeAndIndex(root) // target (branch) already indexed

  t.is(reporter.getDagStructureLabel(), 'Complete')
  t.is(reporter.isCompleteDag(), true)
  t.deepEqual(reporter.report(), {
    structure: 'Complete',
    blocksIndexed: 4,
    uniqueCids: 4,
    undecodeable: 0,
    hashPassed: 4,
    hashFailed: 0,
    hashUnknown: 0
  })
})
