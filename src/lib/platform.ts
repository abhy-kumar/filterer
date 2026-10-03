/** The modifier the keyboard shortcuts use, named the way this platform names it. */
export const isApple =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

export const modKey = isApple ? '⌘' : 'Ctrl';
