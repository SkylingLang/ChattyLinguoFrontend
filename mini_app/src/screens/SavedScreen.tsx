import { useEffect, useState } from "react";
import { api } from "../api/client";
import { SavedWord } from "../types";

export function SavedScreen() {
  const [words, setWords] = useState<SavedWord[]>([]);

  useEffect(() => {
    api.savedWords().then(setWords).catch(() => setWords([]));
  }, []);

  if (words.length === 0) {
    return (
      <div className="screen">
        <section className="panel instructions">
          <p>You don't have any words saved yet! To save a word:</p>
          <p>1️⃣ Open transcription of a Chatty response</p>
          <p>2️⃣ Click on a word you want to save</p>
          <p>3️⃣ Click bookmark icon</p>
        </section>
      </div>
    );
  }

  return (
    <div className="screen list-screen">
      {words.map((word) => (
        <article className="panel word-card" key={word.id}>
          <h2>{word.word}</h2>
          <p>{word.translation}</p>
          <span>{word.part_of_speech}</span>
        </article>
      ))}
    </div>
  );
}

