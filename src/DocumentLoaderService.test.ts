import { expect, test, describe } from "bun:test";
import { FileSystem } from "@effect/platform";
import { Effect, Layer } from "effect";
import {
  DocumentLoaderService,
  DocumentLoaderServiceLive,
} from "./DocumentLoaderService";

describe("DocumentLoaderService", () => {
  test("loadDocuments works correctly with PDFs", () => {
    const docLayer = DocumentLoaderServiceLive.pipe(
      Layer.provide(fsWithLoadedFileAt("./resources/test-slide.pdf"))
    );

    const testProgram = Effect.gen(function* () {
      const docLoader = yield* DocumentLoaderService;
      const documents = yield* docLoader.loadDocuments("test.pdf");

      expect(documents.length).toBe(1);
      expect(documents[0].id_).toBe("test.pdf");
      expect(documents[0].text).toBe("\n\nNothing interesting here");
    });

    return Effect.provide(testProgram, docLayer).pipe(Effect.runPromise);
  });

  const fsWithLoadedFileAt = (path: string) =>
    FileSystem.layerNoop({
      readFile: (path: string) =>
        // assuming this will always succeed
        Effect.promise(() => Bun.file(path).arrayBuffer()).pipe(
          Effect.andThen((arrBuffer) => new Uint8Array(arrBuffer))
        ),
    });
});
