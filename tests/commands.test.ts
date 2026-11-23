import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { parseSpec, cmdUpdate } from "../src/commands.js";
import * as installer from "../src/installer.js";
import { installPlugin, uninstallPlugin } from "../src/registry.js";

describe("parseSpec", () => {
  it("parses marketplace format", () => {
    // This will fail if marketplace is not registered, so we test the error path
    const result = parseSpec("plugin-name");
    expect(result.name).toBe("plugin-name");
    expect(result.source.type).toBe("marketplace");
  });

  it("parses GitHub repo", () => {
    const result = parseSpec("owner/repo");
    expect(result.name).toBe("repo");
    expect(result.source.type).toBe("github");
    if (result.source.type === "github") {
      expect(result.source.repo).toBe("owner/repo");
    }
  });

  it("parses GitHub repo with subdirectory", () => {
    const result = parseSpec("owner/repo:plugins/subdir");
    expect(result.name).toBe("subdir");
    expect(result.source.type).toBe("github");
    if (result.source.type === "github") {
      expect(result.source.repo).toBe("owner/repo");
      expect(result.source.path).toBe("plugins/subdir");
    }
  });

  it("parses git URL", () => {
    const result = parseSpec("https://github.com/owner/repo.git");
    expect(result.name).toBe("repo");
    expect(result.source.type).toBe("git");
    if (result.source.type === "git") {
      expect(result.source.url).toBe("https://github.com/owner/repo.git");
    }
  });

  it("parses local path", () => {
    const result = parseSpec("./my-plugin");
    expect(result.name).toBe("my-plugin");
    expect(result.source.type).toBe("local");
  });

  it("parses absolute local path", () => {
    const result = parseSpec("/home/user/my-plugin");
    expect(result.name).toBe("my-plugin");
    expect(result.source.type).toBe("local");
  });
});

describe("cmdUpdate --all", () => {
  const PLUGIN = "update-all-example";

  beforeEach(() => {
    uninstallPlugin(PLUGIN);
  });

  afterEach(() => {
    uninstallPlugin(PLUGIN);
    vi.restoreAllMocks();
  });

  it("keeps the resolved source path and scope from the registry", async () => {
    const source = {
      type: "github" as const,
      repo: "acme/marketplace",
      path: "plugins/example-plugin",
    };
    installPlugin(PLUGIN, source, "1.0.0", [], [], [], "project");

    const install = vi
      .spyOn(installer, "installPluginPackage")
      .mockResolvedValue({ success: true, pluginName: PLUGIN, mcpServers: [], skills: [], agents: [] });

    await cmdUpdate(undefined, true);

    expect(install).toHaveBeenCalledWith({ name: PLUGIN, source }, true);
  });
});
