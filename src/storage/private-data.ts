import type { z } from "zod";

import { formatValidationError } from "@/schemas/data-schemas";

export const PRIVATE_STORAGE_VERSION = 1;

export const privateStorageKeys = {
  collection: "beybladeScorebook.collection",
  wishlist: "beybladeScorebook.wishlist",
} as const;

const retiredPrivateStorageKeys = ["beybladeScorebook.inventory"] as const;

export type PrivateDataKind = keyof typeof privateStorageKeys;

export interface StoredPrivateData<T> {
  storageVersion: typeof PRIVATE_STORAGE_VERSION;
  fileName: string;
  savedAt: string;
  data: T;
}

export type StorageReadResult<T> =
  | { status: "empty" }
  | { status: "ready"; value: StoredPrivateData<T> }
  | { status: "invalid"; message: string };

type Schema<T> = z.ZodType<T>;

export function parseJsonText<T>(text: string, schema: Schema<T>): T {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("The selected file is not valid JSON.");
  }

  const result = schema.safeParse(json);
  if (!result.success) {
    throw new Error(formatValidationError(result.error));
  }
  return result.data;
}

export async function parseJsonFile<T>(
  file: File,
  schema: Schema<T>,
): Promise<T> {
  return parseJsonText(await file.text(), schema);
}

export function savePrivateData<T>(
  storage: Storage,
  kind: PrivateDataKind,
  fileName: string,
  data: T,
  now = new Date(),
): StoredPrivateData<T> {
  const value: StoredPrivateData<T> = {
    storageVersion: PRIVATE_STORAGE_VERSION,
    fileName,
    savedAt: now.toISOString(),
    data,
  };
  storage.setItem(privateStorageKeys[kind], JSON.stringify(value));
  return value;
}

export function readPrivateData<T>(
  storage: Storage,
  kind: PrivateDataKind,
  schema: Schema<T>,
): StorageReadResult<T> {
  const key = privateStorageKeys[kind];
  const raw = storage.getItem(key);
  if (!raw) return { status: "empty" };

  try {
    const envelope = JSON.parse(raw) as Record<string, unknown>;
    const storageVersion = envelope.storageVersion ?? PRIVATE_STORAGE_VERSION;
    if (storageVersion !== PRIVATE_STORAGE_VERSION) {
      throw new Error(
        `Unsupported saved-data version: ${String(storageVersion)}`,
      );
    }
    if (
      typeof envelope.fileName !== "string" ||
      typeof envelope.savedAt !== "string"
    ) {
      throw new Error("Saved-data metadata is incomplete.");
    }
    const parsed = schema.safeParse(envelope.data);
    if (!parsed.success) throw new Error(formatValidationError(parsed.error));
    return {
      status: "ready",
      value: {
        storageVersion: PRIVATE_STORAGE_VERSION,
        fileName: envelope.fileName,
        savedAt: envelope.savedAt,
        data: parsed.data,
      },
    };
  } catch (error) {
    storage.removeItem(key);
    return {
      status: "invalid",
      message:
        error instanceof Error ? error.message : "Saved data is invalid.",
    };
  }
}

export function clearPrivateData(storage: Storage): void {
  [...Object.values(privateStorageKeys), ...retiredPrivateStorageKeys].forEach(
    (key) => storage.removeItem(key),
  );
}
