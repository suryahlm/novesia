import { Easing, makeMutable, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

// Shared value TUNGGAL level-modul - dipake bareng oleh SEMUA instance ShimmerText/ShimmerIcon/GoldSurface
export const shimmerProgress = makeMutable(0);

const SWEEP_DURATION_MS = 1500;
const PAUSE_MS = 1900;

let started = false;

export function startShimmerClock() {
  if (started) return;
  started = true;
  shimmerProgress.value = withRepeat(
    withSequence(
      withTiming(1, { duration: SWEEP_DURATION_MS, easing: Easing.out(Easing.cubic) }),
      withDelay(PAUSE_MS, withTiming(0, { duration: 0 }))
    ),
    -1,
    false
  );
}
