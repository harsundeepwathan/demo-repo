import { getServerUrl } from "./storage";
import type { Entry, Insights } from "./types";

class ApiError extends Error {}

async function baseUrl(): Promise<string> {
  const url = await getServerUrl();
  if (!url) {
    throw new ApiError(
      "No server configured yet. Add your backend's address in Settings."
    );
  }
  return url;
}

export async function uploadEntry(recordingUri: string): Promise<Entry> {
  const url = await baseUrl();

  const form = new FormData();
  // React Native's fetch/FormData accepts this shape directly for file uploads.
  form.append("audio", {
    uri: recordingUri,
    name: "entry.m4a",
    type: "audio/m4a",
  } as unknown as Blob);

  const response = await fetch(`${url}/api/entries`, {
    method: "POST",
    body: form,
    headers: { "Content-Type": "multipart/form-data" },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new ApiError(`Could not save your check-in (${response.status}): ${body}`);
  }

  return response.json();
}

export async function listEntries(): Promise<Entry[]> {
  const url = await baseUrl();
  const response = await fetch(`${url}/api/entries?limit=100`);
  if (!response.ok) throw new ApiError("Could not load your entries.");
  return response.json();
}

export async function getEntry(id: string): Promise<Entry> {
  const url = await baseUrl();
  const response = await fetch(`${url}/api/entries/${id}`);
  if (!response.ok) throw new ApiError("Could not load that entry.");
  return response.json();
}

export async function getInsights(): Promise<Insights> {
  const url = await baseUrl();
  const response = await fetch(`${url}/api/insights`);
  if (!response.ok) throw new ApiError("Could not load patterns.");
  return response.json();
}

export async function deleteAllEntries(): Promise<void> {
  const url = await baseUrl();
  const response = await fetch(`${url}/api/entries`, { method: "DELETE" });
  if (!response.ok && response.status !== 204) {
    throw new ApiError("Could not delete your data.");
  }
}

export async function checkServerHealth(candidateUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${candidateUrl.replace(/\/+$/, "")}/api/health`, {
      method: "GET",
    });
    return response.ok;
  } catch {
    return false;
  }
}
