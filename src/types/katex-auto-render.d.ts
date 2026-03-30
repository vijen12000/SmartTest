declare module 'katex/contrib/auto-render' {
  export interface DelimiterConfig {
    left: string;
    right: string;
    display: boolean;
  }

  export interface AutoRenderOptions {
    delimiters?: DelimiterConfig[];
    throwOnError?: boolean;
    errorCallback?: (message: string, error: Error) => void;
  }

  export default function renderMathInElement(
    element: HTMLElement,
    options?: AutoRenderOptions
  ): void;
}
