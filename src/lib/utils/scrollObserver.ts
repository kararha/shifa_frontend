export function createScrollObserver(callback: (entry: IntersectionObserverEntry) => void) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(callback);
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -10% 0px'
  });

  return observer;
}
