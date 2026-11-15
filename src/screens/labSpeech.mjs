/**
 * The girl's speech bubble in the Lab, after the mission. Same difficulty contract as
 * Phases 1 to 6: Cadet coaches every step, Engineer only hears the verdict,
 * Flight Director gets no bubble (null = render nothing).
 *
 * step: 'verdict' | 'report'. strong: the evidence rejects the hypothesis.
 */

export function labSpeech(difficulty, { step, strong = false }) {
  if (difficulty === 'director') return null
  if (step === 'verdict') {
    if (difficulty === 'engineer') return strong ? 'No cheese. Just rock.' : 'We need better proof.'
    return strong
      ? 'The lab agrees: rock and dust, no cheese! Open the math to see why.'
      : 'Pictures were not enough. Next time bring a spectrometer or a sample.'
  }
  if (difficulty === 'engineer') return null
  return 'Here is your whole mission on one page, phase by phase.'
}
