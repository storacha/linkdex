#!/usr/bin/env node

import * as fs from 'fs'
import sade from 'sade'
import { linkdex, LinkIndexer } from './index.js'
import { CarBlockIterator } from '@ipld/car/iterator'
import { pipeline } from 'node:stream/promises'

const pkg = JSON.parse(fs.readFileSync(new URL('./package.json', import.meta.url), { encoding: 'utf-8' }))

const cli = sade('linkdex')

cli
  .version(pkg.version)
  .example('report partial.car')

cli.command('report <car>')
  .describe('Print a linkdex report for a car')
  .option('--error-if-partial')
  .action(async (first, opts) => {
    const cars = [first, ...opts._]
    const index = new LinkIndexer()
    for (const car of cars) {
      const carStream = fs.createReadStream(car)
      const carBlocks = await CarBlockIterator.fromIterable(carStream)
      for await (const block of carBlocks) {
        index.decodeAndIndex(block)
      }
    }
    const report = index.report()
    console.log(JSON.stringify(report))
    if (opts['error-if-partial'] && report.structure === 'Partial') {
      console.error('Error: CAR(s) contain partial DAG')
      process.exit(1)
    }
  })

cli.command('print <car>')
  .describe('Print index for a car')
  .option('--mermaid')
  .action(async (first, opts) => {
    const cars = [first, ...opts._]
    if (opts.mermaid) {
      console.log('```mermaid')
      console.log('graph LR')
    }
    for (const car of cars) {
      const inStream = fs.createReadStream(car)
      for await (const { src, dest } of linkdex(inStream)) {
        console.log(dest ? `${src} --> ${dest}` : src)
      }
    }
    if (opts.mermaid) {
      console.log('```')
    }
  })

cli.command('index <car>')
  .describe('Write out an index for a car to <car>.linkdex')
  .action(async (first, opts) => {
    const cars = [first, ...opts._]
    for (const car of cars) {
      const file = `${car}.linkdex`
      await pipeline(
        fs.createReadStream(car),
        async function * (source) {
          for await (const { src, dest } of linkdex(source)) {
            yield `${src} --> ${dest}\n`
          }
        },
        fs.createWriteStream(file)
      )
    }
  })

cli.parse(process.argv)
