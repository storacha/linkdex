# linkdex

Creates an index mapping block CID to linked block CID for a CAR.

Origin story: https://gist.github.com/alanshaw/876aafba676b13890398500b96f82d8e

## Getting Stated

Install the deps
```console
npm install
```

pass it a car file, it writes the index in mermaid syntax to stdout  ✨🎷🐩

```console
npm start ~/Code/olizilla/cardex-cli/lols.car
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
