import { expect, test, describe } from 'bun:test'
import { FileSystem } from '@effect/platform'
import { Effect, Layer } from 'effect'
import { DocumentLoaderService, DocumentLoaderServiceLive } from './DocumentLoaderService'
import { BunContext } from '@effect/platform-bun'

describe('DocumentLoaderService', () => {
  test('loadDocuments works correctly with one PDF', () => {
    const testProgram = Effect.gen(function* () {
      const docLoader = yield* DocumentLoaderService
      const documents = yield* docLoader.loadDocuments('./resources/test-slide.pdf')

      expect(documents.length).toBe(1)
      expect(documents[0].text).toBe('\n\nNothing interesting here')
    })

    return runTest(testProgram)
  })

  test('loadDocuments works correctly with folder of PDFs', () => {
    const testProgram = Effect.gen(function* () {
      const docLoader = yield* DocumentLoaderService
      const documents = yield* docLoader.loadDocuments('./resources')

      expect(documents.length).toBe(2)
      expect(documents[1].text).toBe('\n\nNothing interesting here')
      expect(documents[0].text).toBe('\n\nNothing interesting here')
    })

    return runTest(testProgram)
  })

  const runTest = <A, E>(testProgram: Effect.Effect<A, E, DocumentLoaderService>) =>
    Effect.provide(testProgram, DocumentLoaderServiceLive.pipe(Layer.provide(BunContext.layer))).pipe(Effect.runPromise)
})
