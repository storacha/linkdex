/**
 * Decode a CAR Block (bytes) into a multiformats Block.
 * Decoding allows us to find out if that block links to any others by CID.
 * @param {import('@ipld/car/api').Block} block
 * @param {object} opts
 * @param {BlockDecoders} [opts.codecs]
 * @returns {Block.Block<?> | undefined}
 */
export function maybeDecode({ cid, bytes }: import('@ipld/car/api').Block, { codecs }?: {
    codecs?: BlockDecoders | undefined;
}): Block.Block<unknown> | undefined;
export type BlockDecoders = Record<number, import('multiformats/block').BlockDecoder<unknown, unknown>>;
import * as Block from "multiformats/block";
//# sourceMappingURL=decode.d.ts.map