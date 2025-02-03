/// <reference types="@sveltejs/kit" />
/// <reference types="svelte" />

declare module "*.svelte" {
  const value: any;
  export default value;
}

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace svelteHTML {
    interface HTMLAttributes<T> {
      'on:inview'?: (event: CustomEvent<IntersectionObserverEntry>) => void;
      'on:outview'?: (event: CustomEvent<IntersectionObserverEntry>) => void;
    }
  }
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

export {};
