import { expect, test } from "@playwright/test";

test.describe("Terminal Component", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		// Wait for the terminal to be ready
		await expect(page.locator("#terminal-wrapper")).toBeVisible();
		await expect(page.locator("#input")).toBeVisible();
	});

	test("should display welcome message and available commands", async ({
		page,
	}) => {
		// Check welcome message
		await expect(page.locator("text=Welcome to icepuma.dev")).toBeVisible();

		// Check that commands are listed in the welcome section
		await expect(page.locator("text=Available commands:")).toBeVisible();
		await expect(
			page.locator("#welcome-commands-list strong", { hasText: "help" }),
		).toBeVisible();
		await expect(
			page.locator("#welcome-commands-list strong", { hasText: "clear" }),
		).toBeVisible();
		await expect(
			page.locator("#welcome-commands-list strong", { hasText: "mode" }),
		).toBeVisible();
		await expect(
			page.locator("#welcome-commands-list strong", { hasText: "links" }),
		).toBeVisible();
		await expect(
			page.locator("#welcome-commands-list strong", { hasText: "bio" }),
		).toBeVisible();
		await expect(
			page.locator("#welcome-commands-list strong", { hasText: "projects" }),
		).toBeVisible();
	});

	test("should focus input when clicking terminal area", async ({ page }) => {
		// Click somewhere in the terminal
		await page.locator("#terminal-wrapper").click();

		// Input should be focused
		await expect(page.locator("#input")).toBeFocused();
	});

	test("should execute help command", async ({ page }) => {
		// Type help command and press enter
		await page.locator("#input").fill("help");
		await page.keyboard.press("Enter");

		// Check that command history is shown
		const promptCount = await page.locator("text=guest@icepuma.dev").count();
		expect(promptCount).toBeGreaterThanOrEqual(2); // Original + command history

		// Check that help output is displayed by looking for the second occurrence (from help command, not welcome)
		await expect(
			page
				.locator("#output span", { hasText: "Clears the terminal screen" })
				.nth(1),
		).toBeVisible();
	});

	test("should execute clear command", async ({ page }) => {
		// First type some command to have content
		await page.locator("#input").fill("help");
		await page.keyboard.press("Enter");

		// Verify there's content
		const outputDivCount = await page.locator("#output").locator("div").count();
		expect(outputDivCount).toBeGreaterThanOrEqual(3);

		// Now clear
		await page.locator("#input").fill("clear");
		await page.keyboard.press("Enter");

		// Output should be empty (only the welcome message should be gone)
		await expect(page.locator("#output")).toBeEmpty();
	});

	test("should execute bio command", async ({ page }) => {
		await page.locator("#input").fill("bio");
		await page.keyboard.press("Enter");

		// Check bio content
		await expect(
			page.locator("text=38-year-old software developer"),
		).toBeVisible();
		await expect(page.locator("text=Berlin, Germany")).toBeVisible();
		await expect(page.locator("text=3D printing")).toBeVisible();
		await expect(page.locator("text=Rust")).toBeVisible();
	});

	test("should execute links command", async ({ page }) => {
		await page.locator("#input").fill("links");
		await page.keyboard.press("Enter");

		// Check that social links are displayed (look for them in the command output)
		await expect(
			page.locator("#output span", { hasText: "GitHub" }),
		).toBeVisible();
		await expect(
			page.locator("#output span", { hasText: "Bluesky" }),
		).toBeVisible();
		await expect(
			page.locator("#output span", { hasText: "LinkedIn" }),
		).toBeVisible();

		// Check that links are clickable
		const githubLink = page.locator('a[href="https://github.com/icepuma"]');
		await expect(githubLink).toBeVisible();
		await expect(githubLink).toHaveAttribute("target", "_blank");
	});

	test("should execute projects command", async ({ page }) => {
		await page.locator("#input").fill("projects");
		await page.keyboard.press("Enter");

		// Check project listings (look for them in the command output, specifically as links)
		await expect(
			page.locator("#output a", { hasText: "icepuma.dev" }),
		).toBeVisible();
		await expect(
			page.locator("#output a", { hasText: "fbtoggl" }),
		).toBeVisible();
		await expect(
			page.locator("#output a", { hasText: "rawkode.studio" }),
		).toBeVisible();

		// Check that project links work
		const projectLink = page.locator('a[href*="github.com"]').first();
		await expect(projectLink).toBeVisible();
	});

	test("should handle unknown command", async ({ page }) => {
		await page.locator("#input").fill("unknowncommand");
		await page.keyboard.press("Enter");

		// Should show error message
		await expect(
			page.locator("text=Command not found: unknowncommand"),
		).toBeVisible();
	});
});

test.describe("Terminal Autocompletion", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		await expect(page.locator("#input")).toBeVisible();
	});

	test("should show ghost completion for partial command", async ({ page }) => {
		// Type partial command
		await page.locator("#input").fill("he");

		// Wait for ghost completion and verify
		await page.waitForTimeout(100);
		const ghostText = await page.locator("#ghost-completion").textContent();
		expect(ghostText).toBe("lp");
	});

	test("should complete command with tab", async ({ page }) => {
		// Type partial command
		await page.locator("#input").fill("he");

		// Press tab to complete
		await page.keyboard.press("Tab");

		// Should complete to "help"
		await expect(page.locator("#input")).toHaveValue("help");
	});

	test("should complete exact command match and add space", async ({
		page,
	}) => {
		// Type exact command
		await page.locator("#input").fill("mode");

		// Press tab
		await page.keyboard.press("Tab");

		// Should add space and show first argument
		await expect(page.locator("#input")).toHaveValue("mode ");

		// Wait a bit for the ghost completion to appear, then check
		await page.waitForTimeout(100);
		const ghostText = await page.locator("#ghost-completion").textContent();
		expect(ghostText).toBe("dark");
	});

	test("should cycle through mode arguments with tab", async ({ page }) => {
		// Type "mode " (with space) to start argument completion
		await page.locator("#input").fill("mode ");

		// Wait for ghost completion and verify
		await page.waitForTimeout(100);
		const ghostText = await page.locator("#ghost-completion").textContent();
		expect(ghostText).toBe("dark");

		// Press tab multiple times to cycle through arguments
		await page.keyboard.press("Tab");
		await expect(page.locator("#input")).toHaveValue("mode dark");

		await page.keyboard.press("Tab");
		await expect(page.locator("#input")).toHaveValue("mode light");

		await page.keyboard.press("Tab");
		await expect(page.locator("#input")).toHaveValue("mode system");

		// Should cycle back to dark
		await page.keyboard.press("Tab");
		await expect(page.locator("#input")).toHaveValue("mode dark");
	});

	test("should complete partial mode arguments", async ({ page }) => {
		// Type partial argument
		await page.locator("#input").fill("mode d");

		// Wait for ghost completion and verify
		await page.waitForTimeout(100);
		const ghostText = await page.locator("#ghost-completion").textContent();
		expect(ghostText).toBe("ark");

		// Press tab to complete
		await page.keyboard.press("Tab");
		await expect(page.locator("#input")).toHaveValue("mode dark");
	});

	test("should complete partial mode arguments for light", async ({ page }) => {
		await page.locator("#input").fill("mode l");

		await page.waitForTimeout(100);
		const ghostText = await page.locator("#ghost-completion").textContent();
		expect(ghostText).toBe("ight");

		await page.keyboard.press("Tab");
		await expect(page.locator("#input")).toHaveValue("mode light");
	});

	test("should complete partial mode arguments for system", async ({
		page,
	}) => {
		await page.locator("#input").fill("mode s");

		await page.waitForTimeout(100);
		const ghostText = await page.locator("#ghost-completion").textContent();
		expect(ghostText).toBe("ystem");

		await page.keyboard.press("Tab");
		await expect(page.locator("#input")).toHaveValue("mode system");
	});

	test("should handle typing 'm' and pressing TAB 3 times without duplication", async ({
		page,
	}) => {
		// Type "m"
		await page.locator("#input").fill("m");

		// Wait for ghost completion
		await page.waitForTimeout(100);
		const ghostText = await page.locator("#ghost-completion").textContent();
		// Could be either "ode" or "ovies" depending on which command is shown first
		expect(ghostText).toMatch(/^(ode|ovies)$/);

		// Press TAB once - should complete to either "mode" or "movies"
		await page.keyboard.press("Tab");
		const firstValue = await page.locator("#input").inputValue();
		expect(firstValue).toMatch(/^(mode|movies)$/);

		if (firstValue === "mode") {
			// If we got "mode", next TAB should cycle to "movies"
			await page.keyboard.press("Tab");
			await expect(page.locator("#input")).toHaveValue("movies");

			// Next TAB should cycle back to "mode"
			await page.keyboard.press("Tab");
			await expect(page.locator("#input")).toHaveValue("mode");
		} else {
			// If we got "movies", we're already cycling
			// Next TAB should give us "mode"
			await page.keyboard.press("Tab");
			await expect(page.locator("#input")).toHaveValue("mode");

			// Next TAB should cycle back to "movies"
			await page.keyboard.press("Tab");
			await expect(page.locator("#input")).toHaveValue("movies");
		}
	});

	test("should work after command execution", async ({ page }) => {
		// Execute a command first
		await page.locator("#input").fill("help");
		await page.keyboard.press("Enter");

		// Wait for command to complete
		await page.waitForTimeout(100);

		// Now try autocompletion - should work normally
		await page.locator("#input").fill("m");

		await page.waitForTimeout(100);
		const ghostText = await page.locator("#ghost-completion").textContent();
		expect(ghostText).toBe("ode");

		// TAB should complete to "mode"
		await page.keyboard.press("Tab");
		await expect(page.locator("#input")).toHaveValue("mode");
	});

	test("should work after successful autocompletion and command execution", async ({
		page,
	}) => {
		// First, do a successful autocompletion and execute it
		await page.locator("#input").fill("m");
		await page.keyboard.press("Tab"); // Complete to "mode"
		await page.keyboard.press("Tab"); // Transition to "mode "
		await page.keyboard.press("Tab"); // Complete to "mode dark"
		await page.keyboard.press("Enter"); // Execute the command

		// Wait for command to complete
		await page.waitForTimeout(200);

		// Now try autocompletion again - this should work normally
		await page.locator("#input").fill("m");

		await page.waitForTimeout(100);
		const ghostText = await page.locator("#ghost-completion").textContent();
		expect(ghostText).toBe("ode");

		// TAB should complete to "mode"
		await page.keyboard.press("Tab");
		await expect(page.locator("#input")).toHaveValue("mode");
	});
});

test.describe("Terminal Theme Switching", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		await expect(page.locator("#input")).toBeVisible();
	});

	test("should switch to dark theme", async ({ page }) => {
		await page.locator("#input").fill("mode dark");
		await page.keyboard.press("Enter");

		// Check success message
		await expect(page.locator("text=Theme set to dark")).toBeVisible();

		// Check that dark class is applied
		await expect(page.locator("html")).toHaveClass(/dark/);
	});

	test("should switch to light theme", async ({ page }) => {
		// First set to dark
		await page.locator("#input").fill("mode dark");
		await page.keyboard.press("Enter");

		// Then switch to light
		await page.locator("#input").fill("mode light");
		await page.keyboard.press("Enter");

		await expect(page.locator("text=Theme set to light")).toBeVisible();
		await expect(page.locator("html")).not.toHaveClass(/dark/);
	});

	test("should switch to system theme", async ({ page }) => {
		await page.locator("#input").fill("mode system");
		await page.keyboard.press("Enter");

		await expect(page.locator("text=Theme set to system")).toBeVisible();
	});

	test("should show error for invalid theme", async ({ page }) => {
		await page.locator("#input").fill("mode invalid");
		await page.keyboard.press("Enter");

		await expect(
			page.locator("text=Invalid theme. Use: mode <dark|light|system>"),
		).toBeVisible();
	});

	test("should preserve theme setting across page reloads", async ({
		page,
	}) => {
		// Set dark theme
		await page.locator("#input").fill("mode dark");
		await page.keyboard.press("Enter");

		// Reload page
		await page.reload();
		await expect(page.locator("#input")).toBeVisible();

		// Should still be dark
		await expect(page.locator("html")).toHaveClass(/dark/);
	});
});

test.describe("Terminal UI Elements", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		await expect(page.locator("#input")).toBeVisible();
	});

	test("should show cursor animation", async ({ page }) => {
		const cursor = page.locator("#custom-cursor");
		await expect(cursor).toBeVisible();
		await expect(cursor).toHaveClass(/animate-blink/);
	});

	test("should hide cursor when input loses focus", async ({ page }) => {
		const cursor = page.locator("#custom-cursor");

		// Input should be focused by default and cursor visible
		await expect(cursor).toHaveCSS("opacity", "1");

		// Click outside to blur input
		await page.locator("body").click();

		// Cursor should be hidden
		await expect(cursor).toHaveCSS("opacity", "0");
	});

	test("should show fake input display matching real input", async ({
		page,
	}) => {
		const fakeDisplay = page.locator("#fake-input-display");
		const input = page.locator("#input");

		// Type some text
		await input.fill("test command");

		// Fake display should match
		await expect(fakeDisplay).toHaveText("test command");
	});

	test("should scroll to bottom after command execution", async ({ page }) => {
		const terminal = page.locator("#terminal-wrapper");

		// Execute multiple commands to create scrollable content
		for (let i = 0; i < 5; i++) {
			await page.locator("#input").fill("help");
			await page.keyboard.press("Enter");
		}

		// Terminal should be scrolled to bottom
		const scrollTop = await terminal.evaluate((el) => el.scrollTop);
		const scrollHeight = await terminal.evaluate((el) => el.scrollHeight);
		const clientHeight = await terminal.evaluate((el) => el.clientHeight);

		expect(scrollTop).toBeGreaterThanOrEqual(scrollHeight - clientHeight - 10); // Small tolerance
	});

	test("should have hidden scrollbars", async ({ page }) => {
		const terminal = page.locator("#terminal-wrapper");

		// Check that scrollbars are hidden via CSS
		const scrollbarWidth = await terminal.evaluate((el) => {
			const htmlEl = el as HTMLElement;
			// Create overflow to trigger scrollbar, then measure
			const originalHeight = htmlEl.style.height;
			htmlEl.style.height = "100px";

			// Force content to overflow
			for (let i = 0; i < 10; i++) {
				const div = document.createElement("div");
				div.textContent = "Test line to create overflow";
				htmlEl.appendChild(div);
			}

			// Measure difference between offsetWidth and clientWidth
			const widthDiff = htmlEl.offsetWidth - htmlEl.clientWidth;

			// Clean up
			htmlEl.style.height = originalHeight;
			const testDivs = htmlEl.querySelectorAll("div:last-child");
			for (const div of testDivs) {
				if (div.textContent === "Test line to create overflow") {
					div.remove();
				}
			}

			return widthDiff;
		});

		// Should be 0 if scrollbars are hidden
		expect(scrollbarWidth).toBe(0);
	});
});
