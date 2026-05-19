// Wrap the `open` package so a failure (e.g. headless box, no default browser
// registered) downgrades to "just print the URL" rather than crashing the CLI.

export async function openBrowser(url: string): Promise<boolean> {
  try {
    const mod = await import("open");
    const open = (mod as { default: (target: string) => Promise<unknown> }).default;
    await open(url);
    return true;
  } catch {
    console.log(`Open this URL: ${url}`);
    return false;
  }
}
