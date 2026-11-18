import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchMarketplace } from "../src/marketplace.js";

const MANIFEST = { name: "test-marketplace", plugins: [] };

function okResponse(): Response {
  return new Response(JSON.stringify(MANIFEST), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function notFoundResponse(): Response {
  return new Response(null, { status: 404 });
}

beforeEach(() => {
  vi.unstubAllGlobals();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchMarketplace branch fallback", () => {
  it("uses main when it exists", async () => {
    const fetchMock = vi.fn(async () => okResponse());
    vi.stubGlobal("fetch", fetchMock);

    const { manifest } = await fetchMarketplace("avhb/mkt-main", true);

    expect(manifest.name).toBe("test-marketplace");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain("/main/");
  });

  it("falls back to master when main returns 404", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("/main/")) return notFoundResponse();
      return okResponse();
    });
    vi.stubGlobal("fetch", fetchMock);

    const { manifest } = await fetchMarketplace("avhb/mkt-main-404", true);

    expect(manifest.name).toBe("test-marketplace");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1][0])).toContain("/master/.github/plugin/marketplace.json");
  });

  it("falls back to master when the main request fails", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("/main/")) throw new Error("network down");
      return okResponse();
    });
    vi.stubGlobal("fetch", fetchMock);

    const { manifest } = await fetchMarketplace("avhb/mkt-main-error", true);

    expect(manifest.name).toBe("test-marketplace");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("reports the status when both branches are missing", async () => {
    const fetchMock = vi.fn(async () => notFoundResponse());
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchMarketplace("avhb/mkt-missing", true)).rejects.toThrow(/HTTP 404/);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
