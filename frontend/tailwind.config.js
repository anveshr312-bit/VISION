/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aero: {
          bg: '#0f172a',      // Primary dark background
          card: '#1e293b',    // Surface / card panel
          cyan: '#38bdf8',    // Telemetry sky / accent
          green: '#22c55e',   // Healthy / nominal status
          amber: '#f59e0b',   // Warning / advisory status
          red: '#ef4444',     // Critical / failure risk
        }
      }
    },
  },
  plugins: [],
}

