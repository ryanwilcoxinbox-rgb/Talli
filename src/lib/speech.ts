/** Reads text aloud so pre-readers can use the app on their own. */
export function speak(text: string) {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.92;
    u.pitch = 1.1;
    synth.speak(u);
  } catch {
    /* speech is a nice-to-have */
  }
}
