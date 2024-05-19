import { Console, Effect, Layer, Array, Stream } from 'effect'
import { BunContext, BunRuntime } from '@effect/platform-bun'
import { Terminal } from '@effect/platform'
import { Args, Command } from '@effect/cli'

import { LlamaIndex, LlamaIndexService, LlamaPersistedIndexServiceLive } from './LLamaIndexService'
import { LlamaChatService, LlamaChatServiceLive } from './LlamaChatService'
import { configureOllama } from './LLMConfig'
import { DocumentLoaderService, DocumentLoaderServiceLive } from './DocumentLoaderService'

const repl = Effect.gen(function* () {
  const chatService = yield* LlamaChatService
  const tty = yield* Terminal.Terminal

  yield* tty.display(`Q: `).pipe(
    Effect.andThen(tty.readLine),
    Effect.tap(tty.display(`A: `)),
    Effect.andThen(question =>
      chatService.ask(question).pipe(
        Stream.map(res => res.response),
        Stream.tap(tty.display),
        Stream.runDrain
      )
    ),
    Effect.tap(tty.display(`\n`)),
    Effect.forever
  )
})

const program = (path: string) =>
  Effect.gen(function* () {
    const docLoader = yield* DocumentLoaderService

    const documents = yield* docLoader.loadDocuments(path)

    yield* configureOllama

    const index = yield* LlamaIndexService.pipe(Effect.andThen(service => service.createOrLoadIndex(...documents)))

    const indexLive = Layer.succeed(LlamaIndex, index)
    const chatLive = LlamaChatServiceLive.pipe(Layer.provide(indexLive))

    yield* Effect.provide(repl, chatLive)
  })

const docPath = Args.text({ name: 'docPath' }).pipe(Args.atMost(1))
const command = Command.make('extrospec', { docPath }, ({ docPath }) =>
  Array.match(docPath, {
    onEmpty: () => Console.log('No document path provided'),
    onNonEmpty: paths => program(Array.headNonEmpty(paths)),
  })
)

const cli = Command.run(command, {
  name: 'extspec',
  version: '0.0.1',
})

Effect.suspend(() => cli(process.argv)).pipe(
  Effect.provide(Layer.mergeAll(LlamaPersistedIndexServiceLive, DocumentLoaderServiceLive)),
  Effect.provide(BunContext.layer),
  BunRuntime.runMain
)
