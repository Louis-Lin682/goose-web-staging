const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").trim().replace(/\/$/, "");

const buildUrl = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

export const apiRequest = async <T>(
  path: string,
  init: RequestInit = {},
): Promise<T> => {
  const response = await fetch(buildUrl(path), {
    credentials: "include",
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });

  const rawBody = await response.text();
  const data = rawBody ? safeParseJson(rawBody) : null;

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "message" in data
        ? Array.isArray(data.message)
          ? data.message.join(" ")
          : typeof data.message === "string"
            ? data.message
            : `Request failed (${response.status})`
        : `Request failed (${response.status})`;

    throw new Error(message);
  }

  return data as T;
};

const safeParseJson = (value: string) => {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
};
