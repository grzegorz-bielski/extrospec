import { Effect, Layer, Context, Console } from "effect";

import {
  Document,
  VectorStoreIndex,
  storageContextFromDefaults,
} from "llamaindex";
import type { UnknownException } from "effect/Cause";

export class LlamaIndex extends Context.Tag("LlamaIndex")<
  LlamaIndex,
  VectorStoreIndex
>() {}

export class LlamaIndexService extends Context.Tag("LlamaIndex")<
  LlamaIndexService,
  {
    readonly createOrLoadIndex: (
      ...docs: Document[]
    ) => Effect.Effect<VectorStoreIndex, UnknownException>;
  }
>() {}

export const LlamaPersistedIndexServiceLive = Layer.effect(
  LlamaIndexService,
  Effect.gen(function* () {
    const storageContext = yield* Effect.tryPromise(() =>
      // TODO: make it configurable
      storageContextFromDefaults({ persistDir: "./storage" })
    );

    return {
      createOrLoadIndex: (
        ...docs: Document[]
      ): Effect.Effect<VectorStoreIndex, UnknownException> =>
        // TODO: measure duration
        Console.log(`Creating or loading embeddings`).pipe(
          Effect.andThen(() =>
            Effect.tryPromise(() =>
              VectorStoreIndex.fromDocuments(docs, { storageContext })
            )
          )
        ),
    };
  })
);
