/**
 * Decode a CAR Block (bytes) into a multiformats Block.
 * Decoding allows us to find out if that block links to any others by CID.
 * @param {import('@ipld/car/api').Block} block
 * @param {object} opts
 * @param {object} [opts.codecs]
 * @returns {Block.Block | undefined}
 */
export function maybeDecode({ cid, bytes }: import('@ipld/car/api').Block, { codecs }?: {
    codecs?: object;
}): Block.Block<any> | undefined;
import * as Block from "multiformats/block";
