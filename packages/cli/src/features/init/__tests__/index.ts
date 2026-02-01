import { inferSystemLocale } from "../index.js";

describe("Init Feature", () => {
	it("Should infer system locale correctly", async () => {
		const locale = inferSystemLocale();
		expect(["en-GB", "ja-JP"].includes(locale)).toBe(true);
	});
});
