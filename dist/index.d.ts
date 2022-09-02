/** @typedef { 'Complete' | 'Partial' | 'Unknown' } DagStructure */
/**
 * @param {AsyncIterable<Uint8Array>} carStream
 */
export function decodedBlocks(carStream: AsyncIterable<Uint8Array>): AsyncGenerator<import("multiformats/block").Block<any>, void, unknown>;
/**
 * @param {AsyncIterable<Uint8Array>} carStream
 */
export function linkdex(carStream: AsyncIterable<Uint8Array>): AsyncGenerator<{
    src: string;
    dest: string;
} | {
    src: string;
    dest?: undefined;
}, void, unknown>;
/**
 * A util to record all the links from a given set of Blocks.
 * Pass blocks to `decodeAndIndex` as you iterate over a CAR.
 * Then call `getDagStructureLabel` to find out if the dag is
 * complete... if all linked to CIDs are also contained in in
 * the set, then it is complete.
 */
export class LinkIndexer {
    /**
     * Map block CID to the set of CIDs it links to
     * @type {Map<string, Set<string>>}
     * */
    idx: Map<string, Set<string>>;
    indexed: number;
    undecodable: number;
    /**
     * Decode the block and index any CIDs it links to
     * @param {import('@ipld/car/api').Block} block
     * @param {object} [opts]
     * @param {import('./decode.js').BlockDecoders} [opts.codecs]
     */
    decodeAndIndex({ cid, bytes }: import('@ipld/car/api').Block, opts?: {
        codecs?: import("./decode.js").BlockDecoders | undefined;
    } | undefined): void;
    /**
     * Index all the links from the block
     * @param {import('multiformats/block').Block<?>} block
     */
    _index(block: import('multiformats/block').Block<unknown>): void;
    /**
     * Find out if any of the links point to a CID that isn't in the CAR
     * @returns {boolean}
     */
    isCompleteDag(): boolean;
    /**
     * Provide a value for the `structure` metadata for the CAR.
     * @returns DagStructure
     */
    getDagStructureLabel(): "Complete" | "Partial" | "Unknown";
    /**
     * @typedef {Object} Report
     * @property {DagStructure} structure - Are there any Linked CIDs that are not present in the set of blocks
     * @property {number} blocksIndexed - How many blocks were indexed
     * @property {number} blocksUnique - How many unique CIDs
     * @property {number} blocksUndecodeable - How many blocks failed to decode
     */
    /**
     * Get the results after all blocks are indexed.
     * @returns Report
     */
    report(): {
        structure: string;
        blocksIndexed: number;
        blocksUnique: number;
        blocksUndecodeable: number;
    };
}
export type DagStructure = 'Complete' | 'Partial' | 'Unknown';
//# sourceMappingURL=index.d.ts.map