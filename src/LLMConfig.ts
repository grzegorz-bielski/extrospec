import { Effect } from "effect";
import { Ollama, Settings } from "llamaindex";

export const configureOllama = Effect.try(() => {
  const ollama = new Ollama({
    model: "llama3",
    config: { temperature: 0.75 },
  });

  // globals (!)

  // set the model for the chat engine
  Settings.llm = ollama;
  // set the model for the embeddings
  Settings.embedModel = ollama;
});
