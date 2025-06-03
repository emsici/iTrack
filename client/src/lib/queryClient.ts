import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { Capacitor } from '@capacitor/core';
import { CapacitorHttp } from '@capacitor/core';

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const isNative = Capacitor.isNativePlatform();
  const baseUrl = isNative ? 'https://' + window.location.hostname : '';
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

  if (isNative) {
    // Pe platformele native folosim CapacitorHttp
    const httpResponse = await CapacitorHttp.request({
      url: fullUrl,
      method: method.toUpperCase() as any,
      headers: data ? { 'Content-Type': 'application/json' } : {},
      data: data
    });
    
    const res = {
      ok: httpResponse.status >= 200 && httpResponse.status < 300,
      status: httpResponse.status,
      statusText: httpResponse.status.toString(),
      text: async () => JSON.stringify(httpResponse.data),
      json: async () => httpResponse.data
    } as Response;
    
    await throwIfResNotOk(res);
    return res;
  } else {
    // Pe browser folosim fetch
    const res = await fetch(fullUrl, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return res;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const isNative = Capacitor.isNativePlatform();
    const baseUrl = isNative ? 'https://' + window.location.hostname : '';
    const url = queryKey[0] as string;
    const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

    if (isNative) {
      // Pe platformele native folosim CapacitorHttp
      const httpResponse = await CapacitorHttp.request({
        url: fullUrl,
        method: 'GET'
      });

      if (unauthorizedBehavior === "returnNull" && httpResponse.status === 401) {
        return null;
      }

      const res = {
        ok: httpResponse.status >= 200 && httpResponse.status < 300,
        status: httpResponse.status,
        statusText: httpResponse.status.toString(),
        text: async () => JSON.stringify(httpResponse.data),
        json: async () => httpResponse.data
      } as Response;

      await throwIfResNotOk(res);
      return httpResponse.data;
    } else {
      // Pe browser folosim fetch
      const res = await fetch(fullUrl, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
