import { Console, Effect, Clock, Layer, Context, Array, Stream } from "effect";

import { BunContext, BunRuntime } from "@effect/platform-bun";
import { FileSystem, Terminal } from "@effect/platform";
import { Args, Command, Options } from "@effect/cli";

import {
  Document,
  MetadataMode,
  type NodeWithScore,
  VectorStoreIndex,
  Ollama,
  Settings,
  ContextChatEngine,
  Response,
  storageContextFromDefaults,
} from "llamaindex";

export class LlamaIndex extends Context.Tag("LlamaIndex")<LlamaIndex, VectorStoreIndex>() {}

// export class LlamaIndexService extends Context.Tag("LlamaIndexService")<
//   LlamaIndexService,
//   {
//     readonly loadIndex: (text: string) => Effect.Effect<VectorStoreIndex>;
//   }>() {}

// // export class LlamaIndex extends Context.Tag("LlamaIndex")<LlamaIndex, VectorStoreIndex>() {}

// export const LlamaPersistedIndexLive = Layer.effect(
//     LlamaIndexService,
//     Effect.tryPromise(() => storageContextFromDefaults({ persistDir: "./storage" })),
//     Effect.andThen(storageCtx => {
//         const kek = VectorStoreIndex.init({ storageCtx });
//         // const index = new VectorStoreIndex({ storageCtx });
//         // return Effect.tryPromise(() => index.load());
//     })
// )
