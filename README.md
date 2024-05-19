# extrospection

A toy AI RAG tool for chatting with your documents. Made with [LLamaIndex](https://www.llamaindex.ai/) and [Effect.ts](https://effect.website/).

Supports only PDF and it's hardcoded to use Ollama with lama3 for both embeddings and chat.


## Setup

```bash
bun install
```

To run:

```bash
bun run ./src/index.ts ./your-book.pdf
# it will create an vector index in ./storage
```
