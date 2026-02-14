export function throttle<T extends (...args: unknown[]) => void>(fn: T, ms: number) {
  let last = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: unknown[] | null = null;

  return (...args: unknown[]) => {
    const now = Date.now();
    const remain = ms - (now - last);

    if (remain <= 0) {
      last = now;
      fn(...(args as Parameters<T>));
      return;
    }

    pending = args;
    if (timer) return;

    timer = setTimeout(() => {
      timer = null;
      last = Date.now();
      if (pending) {
        fn(...(pending as Parameters<T>));
        pending = null;
      }
    }, remain);
  };
}
