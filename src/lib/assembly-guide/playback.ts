export interface PlaybackTimeline {
  step: number;
  progress: number;
  playing: boolean;
  speed: number;
  continuous: boolean;
}

export function locateTimeline(durations: readonly number[], value: number) {
  const fraction = Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
  let seconds = durations.reduce((sum, duration) => sum + duration, 0) * fraction;
  for (let step = 0; step < durations.length; step++) {
    if (seconds < durations[step] || step === durations.length - 1) return { step, progress: Math.min(1, seconds / durations[step]) };
    seconds -= durations[step];
  }
  return { step: 0, progress: 0 };
}

/** Real elapsed seconds: playback speed does not depend on browser frame rate. */
export function advanceTimeline(state: PlaybackTimeline, durations: readonly number[], elapsedSeconds: number) {
  if (!state.playing || !Number.isFinite(elapsedSeconds) || elapsedSeconds <= 0) return state;
  let remaining = elapsedSeconds * state.speed;
  let step = state.step;
  let progress = state.progress;
  let playing = true;
  while (remaining > 0) {
    const duration = durations[step];
    if (!Number.isFinite(duration) || duration <= 0) throw new RangeError('Invalid chapter duration');
    const toEnd = (1 - progress) * duration;
    if (remaining < toEnd) { progress += remaining / duration; break; }
    remaining -= toEnd;
    if (!state.continuous || step === durations.length - 1) { progress = 1; playing = false; break; }
    step++;
    progress = 0;
  }
  return { ...state, step, progress, playing };
}
