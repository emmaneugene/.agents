#!/usr/bin/env bun

/**
 * Navigate the browser to a URL via CDP.
 *
 * - Navigates the most recently active tab to the given URL.
 * - Waits for DOMContentLoaded before returning.
 *
 * - Flags:
 *   --new     Open the URL in a new tab instead of reusing the current one.
 *   --reload  Force a full page reload after navigation (hard-refresh).
 */

import puppeteer from "puppeteer-core";

const args = process.argv.slice(2);
const newTab = args.includes("--new");
const reload = args.includes("--reload");
const url = args.find(a => !a.startsWith("--"));

if (!url) {
	console.log("Usage: browser-nav.js <url> [--new] [--reload]");
	console.log("\nExamples:");
	console.log("  browser-nav.js https://example.com          # Navigate current tab");
	console.log("  browser-nav.js https://example.com --new    # Open in new tab");
	console.log("  browser-nav.js https://example.com --reload # Navigate and force reload");
	process.exit(1);
}

const b = await Promise.race([
	puppeteer.connect({
		browserURL: "http://localhost:9222",
		defaultViewport: null,
	}),
	new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 5000)),
]).catch((e) => {
	console.error("✗ Could not connect to browser:", e.message);
	console.error("  Run: browser-start.js");
	process.exit(1);
});

if (newTab) {
	const p = await b.newPage();
	await p.goto(url, { waitUntil: "domcontentloaded" });
	console.log("✓ Opened:", url);
} else {
	const p = (await b.pages()).at(-1);
	await p.goto(url, { waitUntil: "domcontentloaded" });
	if (reload) {
		await p.reload({ waitUntil: "domcontentloaded" });
	}
	console.log("✓ Navigated to:", url);
}

await b.disconnect();
