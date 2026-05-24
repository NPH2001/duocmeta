export function buildMediaUrlFromStorageKey(storageKey: string, baseUrl?: string): string {
  const encodedStorageKey = storageKey
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  if (!baseUrl) {
    return `/media/${encodedStorageKey}`;
  }

  if (baseUrl.startsWith("/")) {
    const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
    return `${normalizedBaseUrl}${encodedStorageKey}`;
  }

  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(encodedStorageKey, normalizedBaseUrl).toString();
}
