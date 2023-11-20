/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./src/**/*.{html,js,ts}", "./index.html"],
	theme: {
		extend: {},
	},
	plugins: [],
	plugins: [require("daisyui")],
};
