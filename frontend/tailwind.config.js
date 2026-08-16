/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Preserved Original Tokens (Backward Compatibility)
        primary: '#09b69b',
        secondary: '#f9f9f9',
        dark: '#111827',

        // Brand Accent Tokens
        'brand-orange': {
          DEFAULT: '#f97316',
          hover: '#ea580c',
          light: '#ffedd5',
        },

        // Semantic Accent Tokens
        'accent-primary': {
          DEFAULT: '#09b69b',
          hover: '#059669',
          light: '#ecfdf5',
        },

        // Semantic Surface Tokens
        surface: {
          DEFAULT: '#ffffff',
          subtle: '#f9f9f9',
          muted: '#f3f4f6',
        },

        // Semantic Border Tokens
        'border-subtle': {
          DEFAULT: '#f3f4f6',
          medium: '#e5e7eb',
          strong: '#d1d5db',
        },

        // Semantic Text Tokens
        'text-muted': {
          DEFAULT: '#6b7280',
          light: '#9ca3af',
          dark: '#4b5563',
        },

        // Semantic Status Tokens
        status: {
          success: {
            DEFAULT: '#10b981',
            bg: '#ecfdf5',
            text: '#047857',
          },
          warning: {
            DEFAULT: '#f59e0b',
            bg: '#fffbe6',
            text: '#b45309',
          },
          error: {
            DEFAULT: '#ef4444',
            bg: '#fef2f2',
            text: '#b91c1c',
          },
          info: {
            DEFAULT: '#3b82f6',
            bg: '#eff6ff',
            text: '#1d4ed8',
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
