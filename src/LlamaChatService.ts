import { Effect, Layer, Context, Stream } from "effect";
import { UnknownException } from "effect/Cause";
import { Settings, ContextChatEngine, Response, Ollama } from "llamaindex";

import { LlamaIndex } from "./LLamaIndexService";

export type ChatResponse = Stream.Stream<Response, UnknownException, never>;

export class LlamaChatService extends Context.Tag("LlamaChatService")<
  LlamaChatService,
  {
    readonly ask: (message: string) => ChatResponse;
  }
>() {}

export const LlamaChatServiceLive = Layer.effect(
  LlamaChatService,
  Effect.gen(function* () {
    const index = yield* LlamaIndex;

    const chatEngine = yield* Effect.try(
      () =>
        new ContextChatEngine({
          retriever: index.asRetriever({ similarityTopK: 5 }),
          chatModel: Settings.llm, // global (!)
        })
    );

    return {
      ask: (message: string): ChatResponse =>
        Stream.fromEffect(
          Effect.tryPromise(() => chatEngine.chat({ message, stream: true }))
        ).pipe(
          Stream.flatMap((a) =>
            Stream.fromAsyncIterable(
              a,
              (e) => new UnknownException(`Got an error ${e}`)
            )
          )
        ),
    };
  })
);
