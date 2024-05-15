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
import { LlamaIndex, LlamaIndexService, LlamaPersistedIndexServiceLive } from "./LLamaIndexService";
import { LlamaChatService, LlamaChatServiceLive } from "./LlamaChatService";

const configureOllama = Effect.try(() => {
  const ollama = new Ollama({
    model: "llama3",
    config: { temperature: 0.75 },
  });

  Settings.llm = ollama;
  Settings.embedModel = ollama;
});

const program = (path: string) =>
  Effect.gen(function* () {
    const program = LlamaChatService.pipe(
      Effect.andThen((chatService) => 
        tty.display(`Q: `).pipe(
          Effect.andThen(tty.readLine),
          Effect.tap(tty.display(`A: `)),
          Effect.andThen((question) =>
            chatService.ask(question).pipe(
              Stream.map((res) => res.response),
              Stream.tap(tty.display),
              Stream.runDrain
            )
          ),
          Effect.tap(tty.display(`\n`)),
          Effect.forever
        )
      )
    );

    const tty = yield* Terminal.Terminal;
    const fs = yield* FileSystem.FileSystem;

    // TODO: this should be configurable
    yield* configureOllama;

    yield* Console.log(`Loading the document at ${path}`);
    const text = yield* fs.readFileString(path);
    const document = new Document({ text, id_: path });

    const indexService = yield* LlamaIndexService
    const index = yield* indexService.createOrLoadIndex(document)

    const indexLive = Layer.succeed(LlamaIndex, index);
    const chatLive = LlamaChatServiceLive.pipe(Layer.provide(indexLive));

    yield* Effect.provide(program, chatLive);
  });

const docPath = Args.text({ name: "docPath" }).pipe(Args.atMost(1));
const command = Command.make("extrospec", { docPath }, ({ docPath }) =>
  Array.match(docPath, {
    onEmpty: () => Console.log("No document path provided"),
    onNonEmpty: (paths) => program(Array.headNonEmpty(paths)),
  })
);

const cli = Command.run(command, {
  name: "extspec",
  version: "0.0.1",
});

Effect.suspend(() => cli(process.argv)).pipe(
  Effect.provide(
    Layer.merge(
      BunContext.layer,
      LlamaPersistedIndexServiceLive
    )
  ),
  BunRuntime.runMain
);
