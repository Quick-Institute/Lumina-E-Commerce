/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{js,jsx}"],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: "#f0fdfa",
                    100: "#ccfbf1",
                    200: "#99f6e4",
                    300: "#5eead4",
                    400: "#2dd4bf",
                    500: "#14b8a6",
                    600: "#0d9488",
                    700: "#0f766e",
                    800: "#115e59",
                    900: "#134e4a",
                },
                ink: {
                    "50": "#edf0f7",
                    "100": "#dce2ef",
                    "200": "#b8c5e0",
                    "300": "#95a8d0",
                    "400": "#718ac1",
                    "500": "#4e6db1",
                    "600": "#3e578e",
                    "700": "#2f426a",
                    "800": "#1f2c47",
                    "900": "#101623",
                    "950": "#0b0f19",
                },
                teal: {
                    "50": "#eafafa",
                    "100": "#d6f5f5",
                    "200": "#aceceb",
                    "300": "#83e2e0",
                    "400": "#5ad8d6",
                    "500": "#30cfcc",
                    "600": "#27a5a3",
                    "700": "#1d7c7a",
                    "800": "#135352",
                    "900": "#0a2929",
                    "950": "#071d1d"
                },
                cyan: {
                    "50": "#e8fdfb",
                    "100": "#d0fbf7",
                    "200": "#a1f7f0",
                    "300": "#72f3e8",
                    "400": "#43efe0",
                    "500": "#14ebd9",
                    "600": "#10bcad",
                    "700": "#0c8d82",
                    "800": "#085e57",
                    "900": "#042f2b",
                    "950": "#03211e"
                },
            },
            fontFamily: {
                sans: [
                    "Poppins",
                    "ui-sans-serif",
                    "system-ui",
                    "-apple-system",
                    "Segoe UI",
                    "Roboto",
                    "Helvetica Neue",
                    "Arial",
                    "sans-serif",
                ],
            },
            boxShadow: {
                card: "0 1px 3px 0 rgb(15 23 42 / 0.06), 0 1px 2px -1px rgb(15 23 42 / 0.06)",
                lift: "0 10px 24px -8px rgb(15 23 42 / 0.15)",
            },
            maxWidth: {
                "8xl": "88rem",
            },
        },
    },
    plugins: [],
};
