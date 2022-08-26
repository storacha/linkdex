import { CarBlockIterator } from '@ipld/car/iterator'
import { decode } from './decode.js'

export async function * decodedBlocks (carStream) {
  const car = await CarBlockIterator.fromIterable(carStream)
  for await (const { cid, bytes } of car) {
    yield decode({ cid, bytes })
  }
}

export async function linkdex (inStream) {
  for await (const block of decodedBlocks(inStream)) {
    for (const [path, targetCid] of block.links()) {
      console.log(`${block.cid.toString()} --> ${targetCid.toString()}`)
    }
  }
}
