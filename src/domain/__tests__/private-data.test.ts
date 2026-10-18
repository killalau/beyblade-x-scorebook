import { describe, expect, it } from "vitest";

import { collectionSchema } from "../../schemas/data-schemas";
import {
  clearPrivateData,
  parseJsonText,
  readPrivateData,
  savePrivateData,
} from "../../storage/private-data";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() {
    return this.values.size;
  }
  clear() {
    this.values.clear();
  }
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.values.delete(key);
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

const collection = {
  version: 1 as const,
  inventory: { parts: [], beys: [] },
  purchases: { items: [] },
};

describe("private browser storage", () => {
  it("parses useful JSON errors", () => {
    expect(() => parseJsonText("not json", collectionSchema)).toThrow(
      /not valid JSON/,
    );
    expect(() => parseJsonText('{"version":2}', collectionSchema)).toThrow(
      /version/,
    );
  });

  it("saves, restores, and clears private data", () => {
    const storage = new MemoryStorage();
    savePrivateData(
      storage,
      "collection",
      "collection.local.json",
      collection,
      new Date("2026-10-17T00:00:00Z"),
    );
    const restored = readPrivateData(storage, "collection", collectionSchema);
    expect(restored.status).toBe("ready");
    if (restored.status === "ready") {
      expect(restored.value.fileName).toBe("collection.local.json");
      expect(restored.value.data.version).toBe(1);
    }
    storage.setItem("beybladeScorebook.inventory", "retired data");
    clearPrivateData(storage);
    expect(storage.length).toBe(0);
  });

  it("removes corrupt and future-version saved data", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      "beybladeScorebook.collection",
      JSON.stringify({
        storageVersion: 99,
        fileName: "future.json",
        savedAt: "now",
        data: collection,
      }),
    );
    expect(
      readPrivateData(storage, "collection", collectionSchema).status,
    ).toBe("invalid");
    expect(storage.length).toBe(0);
  });
});
