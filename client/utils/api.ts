interface ApiConfig {
  baseURL: string;
  defaultHeaders?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, any>; // Query parameters
  pathParams?: Record<string, any>; // URL path parameters like /users/:id
  auth?: {
    type: "bearer" | "basic" | "api-key" | "custom";
    token?: string;
    username?: string;
    password?: string;
    apiKey?: string;
    keyName?: string; // for api-key type
    custom?: string; // for custom auth header
  };
  timeout?: number;
  retries?: number;
  responseType?: "json" | "text" | "blob" | "arrayBuffer" | "formData";
  onUploadProgress?: (progress: number) => void;
  onDownloadProgress?: (progress: number) => void;
  cache?: boolean;
  validateStatus?: (status: number) => boolean;
}

interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
  config: ApiOptions;
}

class ApiService {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;
  private retries: number;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }>;

  constructor(config: ApiConfig) {
    this.baseURL = config.baseURL.replace(/\/$/, ""); // Remove trailing slash
    this.defaultHeaders = {
      "Content-Type": "application/json",
      ...config.defaultHeaders,
    };
    this.timeout = config.timeout || 30000; // 30 seconds default
    this.retries = config.retries || 0;
    this.cache = new Map();
  }

  // Main API method with full flexibility
  async call<T = any>(
    route: string,
    options: ApiOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = "GET",
      headers = {},
      body,
      params = {},
      pathParams = {},
      auth,
      timeout = this.timeout,
      retries = this.retries,
      responseType = "json",
      cache = false,
      validateStatus = (status: number) => status >= 200 && status < 300,
    } = options;

    // Build URL with path parameters
    let url = this.buildUrl(route, pathParams);

    // Add query parameters
    url = this.addQueryParams(url, params);

    // Check cache for GET requests
    if (method === "GET" && cache) {
      const cached = this.getFromCache(url);
      if (cached) {
        return cached;
      }
    }

    // Build headers
    const mergedHeaders = this.buildHeaders(headers, auth, body);

    // Build request options
    const requestOptions = this.buildRequestOptions(
      method,
      mergedHeaders,
      body
    );

    // Execute request with retries
    let lastError: Error;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await this.executeRequest<T>(
          url,
          requestOptions,
          timeout,
          responseType,
          validateStatus,
          options
        );

        // Cache successful GET requests
        if (method === "GET" && cache && response.status < 400) {
          this.setCache(url, response, 300000); // 5 minutes default TTL
        }

        return response;
      } catch (error: unknown) {
        if (error instanceof Error) {
          lastError = error;
          if (attempt < retries && this.shouldRetry(error)) {
            await this.delay(Math.pow(2, attempt) * 1000); // Exponential backoff
            continue;
          }
        } else {
          // if it's something unexpected, wrap it
          lastError = new Error(String(error));
        }
        break;
      }
    }

    throw lastError!;
  }

  // Build complete URL with path parameters
  private buildUrl(route: string, pathParams: Record<string, any>): string {
    let url = route.startsWith("http")
      ? route
      : `${this.baseURL}${route.startsWith("/") ? route : `/${route}`}`;

    // Replace path parameters like /users/:id or /users/{id}
    Object.entries(pathParams).forEach(([key, value]) => {
      url = url.replace(`:${key}`, encodeURIComponent(value.toString()));
      url = url.replace(`{${key}}`, encodeURIComponent(value.toString()));
    });

    return url;
  }

  // Add query parameters to URL
  private addQueryParams(url: string, params: Record<string, any>): string {
    if (Object.keys(params).length === 0) return url;

    const urlObj = new URL(url);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach((v) => urlObj.searchParams.append(key, v.toString()));
        } else {
          urlObj.searchParams.set(key, value.toString());
        }
      }
    });

    return urlObj.toString();
  }

  // Build headers with auth
  private buildHeaders(
    headers: Record<string, string>,
    auth?: ApiOptions["auth"],
    body?: any
  ): Record<string, string> {
    const mergedHeaders = { ...this.defaultHeaders, ...headers };

    // Handle authentication
    if (auth) {
      switch (auth.type) {
        case "bearer":
          if (auth.token) {
            mergedHeaders["Authorization"] = `Bearer ${auth.token}`;
          }
          break;
        case "basic":
          if (auth.username && auth.password) {
            const credentials = btoa(`${auth.username}:${auth.password}`);
            mergedHeaders["Authorization"] = `Basic ${credentials}`;
          }
          break;
        case "api-key":
          if (auth.apiKey && auth.keyName) {
            mergedHeaders[auth.keyName] = auth.apiKey;
          }
          break;
        case "custom":
          if (auth.custom) {
            mergedHeaders["Authorization"] = auth.custom;
          }
          break;
      }
    }

    // Handle different body types
    if (body) {
      if (body instanceof FormData) {
        delete mergedHeaders["Content-Type"]; // Let browser set it
      } else if (typeof body === "string") {
        mergedHeaders["Content-Type"] = "text/plain";
      }
    }

    return mergedHeaders;
  }

  // Build request options
  private buildRequestOptions(
    method: string,
    headers: Record<string, string>,
    body: any
  ): RequestInit {
    const requestOptions: RequestInit = {
      method,
      headers,
    };

    // Add body for non-GET requests
    if (body && !["GET", "HEAD"].includes(method)) {
      if (body instanceof FormData || typeof body === "string") {
        requestOptions.body = body;
      } else {
        requestOptions.body = JSON.stringify(body);
      }
    }

    return requestOptions;
  }

  // Execute the actual request
  private async executeRequest<T>(
    url: string,
    requestOptions: RequestInit,
    timeout: number,
    responseType: string,
    validateStatus: (status: number) => boolean,
    options: ApiOptions
  ): Promise<ApiResponse<T>> {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...requestOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Parse response based on type
      let data: T;
      switch (responseType) {
        case "json":
          try {
            data = await response.json();
          } catch {
            data = null as T;
          }
          break;
        case "text":
          data = (await response.text()) as unknown as T;
          break;
        case "blob":
          data = (await response.blob()) as unknown as T;
          break;
        case "arrayBuffer":
          data = (await response.arrayBuffer()) as unknown as T;
          break;
        case "formData":
          data = (await response.formData()) as unknown as T;
          break;
        default:
          data = await response.json();
      }

      // Validate status
      if (!validateStatus(response.status)) {
        const backendMessage = (data as any)?.error?.message;
        const backendDetails = (data as any)?.error?.details;

        throw new ApiError(backendMessage, response.status, backendDetails, response);
      }

      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        config: options,
      };
    } catch (error: unknown) {
      clearTimeout(timeoutId);

      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof Error && error.name === "AbortError") {
        throw new ApiError("Request timeout", 408);
      }

      if (error instanceof Error) {
        throw new ApiError(error.message, 0);
      }

      // fallback: unknown error type
      throw new ApiError("Network error", 0);
    }
  }

  // Convenience methods with full options support
  async get<T = any>(
    route: string,
    options: Omit<ApiOptions, "method" | "body"> = {}
  ) {
    return this.call<T>(route, { ...options, method: "GET" });
  }

  async post<T = any>(
    route: string,
    body?: any,
    options: Omit<ApiOptions, "method" | "body"> = {}
  ) {
    return this.call<T>(route, { ...options, method: "POST", body });
  }

  async put<T = any>(
    route: string,
    body?: any,
    options: Omit<ApiOptions, "method" | "body"> = {}
  ) {
    return this.call<T>(route, { ...options, method: "PUT", body });
  }

  async patch<T = any>(
    route: string,
    body?: any,
    options: Omit<ApiOptions, "method" | "body"> = {}
  ) {
    return this.call<T>(route, { ...options, method: "PATCH", body });
  }

  async delete<T = any>(
    route: string,
    options: Omit<ApiOptions, "method" | "body"> = {}
  ) {
    return this.call<T>(route, { ...options, method: "DELETE" });
  }

  async head<T = any>(
    route: string,
    options: Omit<ApiOptions, "method" | "body"> = {}
  ) {
    return this.call<T>(route, { ...options, method: "HEAD" });
  }

  async options<T = any>(
    route: string,
    options: Omit<ApiOptions, "method" | "body"> = {}
  ) {
    return this.call<T>(route, { ...options, method: "OPTIONS" });
  }

  // File upload with progress
  async upload<T = any>(
    route: string,
    file: File | FormData,
    options: Omit<ApiOptions, "method" | "body"> = {}
  ) {
    let formData: FormData;

    if (file instanceof FormData) {
      formData = file;
    } else {
      formData = new FormData();
      formData.append("file", file);
    }

    return this.post<T>(route, formData, {
      ...options,
      headers: {
        ...options.headers,
        // Don't set Content-Type, let browser handle it for FormData
      },
    });
  }

  // Utility methods
  setDefaultHeader(key: string, value: string) {
    this.defaultHeaders[key] = value;
  }

  removeDefaultHeader(key: string) {
    delete this.defaultHeaders[key];
  }

  setAuthToken(token: string) {
    this.setDefaultHeader("Authorization", `Bearer ${token}`);
  }

  setApiKey(key: string, value: string) {
    this.setDefaultHeader(key, value);
  }

  removeAuth() {
    this.removeDefaultHeader("Authorization");
  }

  // Cache management
  private getFromCache(key: string) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any, ttl: number) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  clearCache() {
    this.cache.clear();
  }

  // Helper methods
  private shouldRetry(error: Error): boolean {
    return (
      error.name === "AbortError" ||
      (error instanceof ApiError && error.status >= 500)
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Batch requests
  async batch<T = any>(requests: { route: string; options?: ApiOptions }[]) {
    const promises = requests.map((req) =>
      this.call<T>(req.route, req.options)
    );
    return Promise.allSettled(promises);
  }

  // Request/Response interceptors
  private requestInterceptors: ((config: ApiOptions) => ApiOptions)[] = [];
  private responseInterceptors: ((response: ApiResponse) => ApiResponse)[] = [];

  addRequestInterceptor(interceptor: (config: ApiOptions) => ApiOptions) {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(interceptor: (response: ApiResponse) => ApiResponse) {
    this.responseInterceptors.push(interceptor);
  }
}

// Custom error class with enhanced info
class ApiError extends Error {
  public status: number;
  public data?: any;
  public response?: Response;

  constructor(
    message: string,
    status: number,
    data?: any,
    response?: Response
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    this.response = response;
  }
}

// Create and configure the API instance
const api = new ApiService({
  baseURL: process.env.EXPO_PUBLIC_BACKEND_URL || "http://localhost:3000/api",
  defaultHeaders: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 30000, // 30 seconds
  retries: 2, // Retry failed requests twice
});

// Export everything
export default api;
export { ApiError, ApiService };
export type { ApiConfig, ApiOptions, ApiResponse };
