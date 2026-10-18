import '@testing-library/jest-dom/vitest'

// jsdom lacks a few browser APIs that Radix UI / the PDF viewer rely on.
if (!('ResizeObserver' in globalThis)) {
  class ResizeObserverStub {
    private readonly callback: ResizeObserverCallback

    constructor(callback: ResizeObserverCallback) {
      this.callback = callback
    }

    observe(target: Element): void {
      this.callback(
        [
          {
            target,
            contentRect: { width: 800, height: 600 },
            borderBoxSize: [],
            contentBoxSize: [],
            devicePixelContentBoxSize: [],
          } as unknown as ResizeObserverEntry,
        ],
        this as unknown as ResizeObserver,
      )
    }

    unobserve(): void {}
    disconnect(): void {}
  }
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver
}

if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList
}

if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}
