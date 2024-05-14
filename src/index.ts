import { Console, Effect, Clock, Layer, Context, Array } from "effect";

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
} from "llamaindex";

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
    const tty = yield* Terminal.Terminal;
    const fs = yield* FileSystem.FileSystem;

    // TODO: this should be configurable
    yield* configureOllama

    yield* Console.log(`Loading the document at ${path}`);
    const text = yield* fs.readFileString(path);
    const document = new Document({ text, id_: path });

    yield* Console.log(`Creating embeddings`);
    const index = yield* Effect.tryPromise(() =>
      VectorStoreIndex.fromDocuments([document])
    );

    const queryEngine = index.asQueryEngine();

    const ask = (query: string) =>
      Effect.tryPromise(() => queryEngine.query({ query }));

    yield* Console.log(`Please provide your query`);
    yield* tty.readLine.pipe(
      Effect.andThen(ask),
      Effect.andThen(res => Console.log(`>> ${res.response}`)),
      Effect.forever
    );
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
  Effect.provide(BunContext.layer),
  BunRuntime.runMain
);
