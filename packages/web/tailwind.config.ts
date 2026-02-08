export default {
	content: [
		"./src/**/*.{js,ts,jsx,tsx}" // Ensure this matches your file structure
	],
	theme: {
		extend: {
			fontFamily: {
				sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
				mono: ["JetBrains Mono", "monospace"]
			}
		}
	},
	plugins: []
};
