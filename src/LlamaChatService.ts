import { Effect, Layer, Context, Stream } from "effect";
import { UnknownException } from "effect/Cause";
import { Settings, ContextChatEngine, Response } from "llamaindex";

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
  LlamaIndex.pipe(
    Effect.andThen((index) =>
      Effect.try(
        () =>
          new ContextChatEngine({
            retriever: index.asRetriever({ similarityTopK: 5 }),
            chatModel: Settings.llm, // global (!)
          })
      )
    ),
    Effect.andThen((chatEngine) => ({
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
    }))
  )
);
