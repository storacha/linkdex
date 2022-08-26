#!/usr/bin/env node

import fs from 'fs'
import { linkdex } from "./index.js"

const input = process.argv[2]
const inStream = fs.createReadStream(input)

linkdex(inStream)
