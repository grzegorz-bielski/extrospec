import { Effect, Layer, Context, Console } from "effect";
import { FileSystem, Error as PError } from "@effect/platform";
import { Document, SimpleDirectoryReader } from "llamaindex";
import type { UnknownException } from "effect/Cause";

import { type Result as PdfParseResult } from "pdf-parse";
// @ts-ignore
import pdf from "pdf-parse/lib/pdf-parse"; // omit the buggy index.js, see https://gitlab.com/autokent/pdf-parse/-/issues/24

export type LoadedDocuments = Effect.Effect<
  Document[],
  UnknownException | PError.PlatformError | DocumentsLoadingError
>;

export class DocumentLoaderService extends Context.Tag("DocumentLoaderService")<
  DocumentLoaderService,
  {
    readonly loadDocuments: (path: string) => LoadedDocuments;
  }
>() {}

export const DocumentLoaderServiceLive = Layer.effect(
  DocumentLoaderService,
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;

    const loadPDFs = (path: string) =>
      Effect.gen(function* () {
        const content = yield* fs.readFile(path);

        // TODO: handle multiple files
        const pdfContent = yield* Effect.tryPromise(
          () => pdf(Buffer.from(content)) as Promise<PdfParseResult>
        );

        // TODO: make a Document from each page
        return [new Document({ text: pdfContent.text, id_: path })];
      });

    const loadOther = (path: string) =>
      Effect.tryPromise(() => new SimpleDirectoryReader().loadData(path));

    return {
      loadDocuments: (path: string) =>
        Effect.gen(function* () {
          const documentLoader = path.endsWith(".pdf") ? loadPDFs : loadOther;
          const documents = yield* documentLoader(path);

          if (documents.length === 0) {
            yield* Console.log(`No documents loaded`);
            yield* Effect.fail(new DocumentsLoadingError());
          }

          yield* Console.log(`Loaded documents: ${documents.length}`);

          return documents;
        }),
    };
  })
);

class DocumentsLoadingError {
  readonly _tag = "DocumentsLoadingError";
}
