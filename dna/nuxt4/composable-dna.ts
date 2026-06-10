import {
  type ComputedRef,
  type Ref,
  computed,
  readonly,
  ref,
  toValue,
  type MaybeRefOrGetter,
} from 'vue';

interface UseCounterOptions {
  initialValue?: MaybeRefOrGetter<number>;
  step?: MaybeRefOrGetter<number>;
}

interface UseCounterReturn {
  count: Readonly<Ref<number>>;
  double: ComputedRef<number>;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

/**
 * @description Standard composable pattern for MAWA.
 * Encapsulates reusable logic and exposes readonly state when possible.
 */
export function useCounter(options: UseCounterOptions = {}): UseCounterReturn {
  const stepValue = toValue(options.step) ?? 1;
  const initialValue = toValue(options.initialValue) ?? 0;

  const count = ref(initialValue);
  const double = computed(() => count.value * 2);

  function increment() {
    count.value += stepValue;
  }

  function decrement() {
    count.value -= stepValue;
  }

  function reset() {
    count.value = initialValue;
  }

  return {
    count: readonly(count),
    double,
    increment,
    decrement,
    reset,
  };
}
