export function debounce<T extends Function>(fn: T, interval = 500): T {
  let timer: number;
  return function() {
    clearTimeout(timer);
    timer = setTimeout(()=> {
      fn.apply(this, arguments);
    }, interval);
  } as unknown as T;
}
