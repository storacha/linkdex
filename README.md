# linkdex

Creates an index mapping block CID to linked block CID for a CAR.

## Usage

Here is a quick demo of what the linkdex CLI can do.

```bash
# Print indexes to stdout
$ linkdex print thing-1.car thing-2.car
bafybeiaalbzxtx6jxr5znrtjtxvdn76s7zxl7e4rw6mvrbjz6gahhnc54y --> bafybeietimcnchtujzibl4vqyvrcosagvfandacatiees4zed6updxdssi
bafybeietimcnchtujzibl4vqyvrcosagvfandacatiees4zed6updxdssi --> bafkreic6ukg4v5hi7yt2qcebjpm2hkh34sejiiatr46wtiyntiwvlrskae
bafybeietimcnchtujzibl4vqyvrcosagvfandacatiees4zed6updxdssi --> bafkreiabfvaraoupn66wrdcgy3l2bb7vwfqha2y4u3owtqw5hc75uhneyq

# Writes indexes to file per CAR input
$ linkdex index thing-1.car thing-2.car
$ ls
thing-1.car thing-1.car.linkdex thing-2.car thing-2.car.linkdex

# Report the dag structure from the union of all the CARs
$ linkdex report thing-1.car thing-2.car
{"structure":"Complete","blockCount":21}

# Exit with error if any block links to a CID that is not in the set of blocks.
$ linkdex report thing-1.car --error-if-partial
{"structure":"Partial","blockCount":10}
Error: CAR(s) contain partial DAG
$ echo $? # 1
```

## Getting Stated

Install the deps
```console
npm install
```

pass it one or more car files, it writes the index in mermaid syntax to stdout  ✨🎷🐩

```console
linkdex print --mermaid lols.car
```

```mermaid
graph TD

bafybeibw77p4afchrvmo6ep4fpv7j4aehrn2yqs3tv3uuofc6oag36zq2q --> bafybeih2w5euyf3sodc6efxtpahgwkata46fupjysi4bbnazb4n2b25rry
bafybeibw77p4afchrvmo6ep4fpv7j4aehrn2yqs3tv3uuofc6oag36zq2q --> bafybeia2i6eqwfqrixh446pavwev37kywowmdpgvx34fbv7asdh3qwpm3y
bafybeih2w5euyf3sodc6efxtpahgwkata46fupjysi4bbnazb4n2b25rry --> bafybeif5xvhik6thha5ykg3g73jo3mqd5mhb7orzeznnvwquashmwryhai
bafybeia2i6eqwfqrixh446pavwev37kywowmdpgvx34fbv7asdh3qwpm3y --> bafkreih2bhak5yv7g4vft5c37j7dw5rqnnsyyuzsifczehhhpm3t655oae
bafybeif5xvhik6thha5ykg3g73jo3mqd5mhb7orzeznnvwquashmwryhai --> bafkreidkmypp3asq3xiu6mmtcfbzmmhcobpmnaqcyns6535w3u7bz7el64
bafybeif5xvhik6thha5ykg3g73jo3mqd5mhb7orzeznnvwquashmwryhai --> bafkreid3pefuwyvhsnlrz6xk67f4f6opgqhcrle4bf47kvachwojdgt7re
bafybeif5xvhik6thha5ykg3g73jo3mqd5mhb7orzeznnvwquashmwryhai --> bafkreigr3beehu5ebbgoisx4rl2vyaqebmohubauc6avefodb5jauz3tyi
```

### Generating type declarations

Add good typescript flavour JSDoc comments to the JS source, then **validate** them and **generate** the `index.d.ts` declaration file:

```console
$ npm run tsc
```

This is done automatically via the `prepare` npm lifecycle hook.

see: https://www.typescriptlang.org/docs/handbook/declaration-files/dts-from-js.html
