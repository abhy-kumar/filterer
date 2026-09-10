/** @type {import('tailwindcss').Config} */

/**
 * The type scale, radii and control heights are defined once in
 * src/index.css as custom properties and surfaced here so that a
 * component can reach them through a utility class as well.
 *
 * Font stacks are the platform's own UI face on every platform: SF on
 * Apple, Segoe UI Variable on Windows 11, Roboto on Android. Nothing is
 * downloaded. The previous stack pulled Plus Jakarta Sans and JetBrains
 * Mono from Google Fonts on every visit — two render-blocking requests
 * for faces that an Apple device never reaches, because -apple-system
 * wins ahead of them in the same list.
 */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        apple: {
          DEFAULT: 'var(--apple-border)',
          bg: 'var(--apple-bg)',
          subtle: 'var(--apple-bg-subtle)',
          tertiary: 'var(--apple-bg-tertiary)',
          surface: 'var(--apple-surface)',
          'surface-hover': 'var(--apple-surface-hover)',
          'surface-active': 'var(--apple-surface-active)',
          card: 'var(--apple-card-bg)',
          raised: 'var(--apple-card-raised)',
          border: 'var(--apple-border)',
          'border-subtle': 'var(--apple-border-subtle)',
          'border-strong': 'var(--apple-border-strong)',
          primary: 'var(--apple-text-primary)',
          label: 'var(--apple-text-primary)',
          secondary: 'var(--apple-text-secondary)',
          muted: 'var(--apple-text-muted)',
          faint: 'var(--apple-text-faint)',
          blue: 'var(--apple-blue)',
          'blue-subtle': 'var(--apple-blue-subtle)',
          green: 'var(--apple-green)',
          'green-subtle': 'var(--apple-green-subtle)',
          red: 'var(--apple-red)',
          'red-subtle': 'var(--apple-red-subtle)',
          amber: 'var(--apple-amber)',
          'amber-subtle': 'var(--apple-amber-subtle)',
          indigo: 'var(--apple-indigo)',
          'indigo-subtle': 'var(--apple-indigo-subtle)',
        },
      },
      /**
       * Named for the role the text plays, not the pixels it happens to
       * be. Line height and tracking travel with the size, so a caption
       * cannot end up set at body tracking by accident.
       */
      fontSize: {
        caption2: ['var(--text-caption2)', { lineHeight: '1.35', letterSpacing: 'var(--tracking-caption2)' }],
        caption1: ['var(--text-caption1)', { lineHeight: '1.4', letterSpacing: 'var(--tracking-caption1)' }],
        footnote: ['var(--text-footnote)', { lineHeight: '1.45', letterSpacing: 'var(--tracking-body)' }],
        subheadline: ['var(--text-subheadline)', { lineHeight: '1.5', letterSpacing: 'var(--tracking-body)' }],
        callout: ['var(--text-callout)', { lineHeight: '1.5', letterSpacing: 'var(--tracking-body)' }],
        /* Headings carry their weight with them: a title set at regular
           weight is not a title, and leaving it to the call site is how
           the same heading ends up at three different weights. */
        headline: ['var(--text-headline)', { lineHeight: '1.4', letterSpacing: '-0.012em', fontWeight: '590' }],
        title3: ['var(--text-title3)', { lineHeight: '1.32', letterSpacing: '-0.015em', fontWeight: '600' }],
        title2: ['var(--text-title2)', { lineHeight: '1.24', letterSpacing: 'var(--tracking-title)', fontWeight: '640' }],
        title1: ['var(--text-title1)', { lineHeight: '1.18', letterSpacing: '-0.022em', fontWeight: '680' }],
        largetitle: ['var(--text-largetitle)', { lineHeight: '1.1', letterSpacing: 'var(--tracking-largetitle)', fontWeight: '700' }],
      },
      borderRadius: {
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
      },
      height: {
        'control-sm': 'var(--control-sm)',
        'control-md': 'var(--control-md)',
        'control-lg': 'var(--control-lg)',
      },
      borderWidth: {
        hairline: 'var(--hairline)',
      },
      boxShadow: {
        xs: 'var(--apple-shadow-sm)',
        sm: 'var(--apple-shadow-sm)',
        DEFAULT: 'var(--apple-shadow)',
        lg: 'var(--apple-shadow-lg)',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          '"Segoe UI Variable Text"',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        display: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"Segoe UI Variable Display"',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'ui-monospace',
          '"SF Mono"',
          'SFMono-Regular',
          'Menlo',
          '"Cascadia Mono"',
          'Consolas',
          '"Liberation Mono"',
          'monospace',
        ],
      },
    },
  },
  plugins: [],
};
