import { Effect, Layer, Context, Console, Data } from 'effect'
import { FileSystem, Error as PError, Path } from '@effect/platform'
import type { UnknownException } from 'effect/Cause'
import { Document } from 'llamaindex'

import { type Result as PdfParseResult } from 'pdf-parse'
// @ts-ignore
import pdf from 'pdf-parse/lib/pdf-parse' // omit the buggy index.js, see https://gitlab.com/autokent/pdf-parse/-/issues/24

export type LoadedDocuments = Effect.Effect<Document[], UnknownException | PError.PlatformError | DocumentsLoadingError>

export class DocumentLoaderService extends Context.Tag('DocumentLoaderService')<
  DocumentLoaderService,
  {
    readonly loadDocuments: (path: string) => LoadedDocuments
  }
>() {}

// Avoids `SimpleDirectoryReader` from llamaindex for a more fine-grained control
export const DocumentLoaderServiceLive = Layer.effect(
  DocumentLoaderService,
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const ph = yield* Path.Path

    const loadPDF = (path: string) =>
      Effect.gen(function* () {
        const content = yield* fs.readFile(path)
        const pdfContent = yield* Effect.tryPromise(() => pdf(Buffer.from(content)) as Promise<PdfParseResult>)

        // TODO: make a Document from each page
        return [new Document({ text: pdfContent.text })]
      })

    const loadFile = (path: string) =>
      Effect.gen(function* () {
        if (!path.endsWith('.pdf')) {
          yield* new DocumentsLoadingError({ message: `Unsupported file ${path}.` })
        }

        return yield* loadPDF(path)
      })

    const loadData = (path: string) =>
      fs.stat(path).pipe(
        Effect.andThen(info =>
          info.type === 'Directory'
            ? fs.readDirectory(path).pipe(
                Effect.andThen(paths =>
                  Effect.forEach(
                    paths.map(p => ph.resolve(path, p)),
                    loadFile
                  )
                ),
                Effect.andThen(a => a.flat())
              )
            : loadFile(path)
        )
      )

    return {
      loadDocuments: (path: string) =>
        Effect.gen(function* () {
          const documents = yield* loadData(path)

          if (documents.length === 0) {
            yield* new DocumentsLoadingError({ message: 'No documents loaded' })
          }

          yield* Console.log(`Loaded documents: ${documents.length}`)

          return documents
        }),
    }
  })
)

class DocumentsLoadingError extends Data.TaggedError('DocumentsLoadingError')<{
  message: string
}> {}
