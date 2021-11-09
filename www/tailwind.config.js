const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
    mode: 'jit',
    darkMode: 'class',
    purge: ['./pages/**/*.{js,ts,jsx,tsx}', './containers/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            fontFamily: {
                heading: ["Poppins", ...defaultTheme.fontFamily.sans],
                body: ["Noto Sans", "Noto Sans JP", ...defaultTheme.fontFamily.serif],
                mono: [...defaultTheme.fontFamily.mono]
            }
        }
    },
    variants: {
        extend: {},
    },
    plugins: [],
};
