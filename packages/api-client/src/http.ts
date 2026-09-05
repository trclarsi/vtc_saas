export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface HttpClientConfig {
  baseUrl: string;
  getAccessToken?: () => string | null;
}

// Point unique de connaissance des routes API (Doc 06 §6) --- aucun module
// applicatif ne doit construire une URL ou un header d'auth par lui-meme.
export class HttpClient {
  constructor(private readonly config: HttpClientConfig) {}

  async request<T>(path: string, init?: RequestInit): Promise<T> {
    const token = this.config.getAccessToken?.();
    const res = await fetch(`${this.config.baseUrl}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers ?? {}),
      },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new ApiError(res.status, body || res.statusText);
    }

    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }
}
