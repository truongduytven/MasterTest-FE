import { env } from "@/config/env";
import type {
  CreateProjectPayload,
  CreateTestCasePayload,
  GenerateScenariosPayload,
  IngestDomainPayload,
  IngestFigmaPayload,
  Project,
  TestCase,
  TestExecutionItem,
  TestRun,
  UpdateExecutionItemPayload,
  UpdateTestCasePayload,
} from "@/types";

function getBaseUrl(): string {
  if (!env.NEXT_PUBLIC_API_URL) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not defined in environment variables. Please check .env configuration."
    );
  }
  return env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const defaultHeaders: Record<string, string> = {
    Accept: "application/json",
  };

  // Don't set Content-Type for FormData
  if (!(options?.body instanceof FormData)) {
    defaultHeaders["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options?.headers,
    },
  });

  if (!response.ok) {
    let errorMessage = `API Error: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.message) errorMessage = errorData.message;
      else if (errorData.error) errorMessage = errorData.error;
    } catch {
      // ignore json parse error on non-json body
    }
    throw new Error(errorMessage);
  }

  // Check if response is JSON or empty
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    const json = await response.json();
    if (json && typeof json === "object" && "success" in json && "data" in json) {
      return json.data as T;
    }
    return json as T;
  }

  return response.text() as unknown as T;
}

export const api = {
  // Check API health
  async checkHealth(): Promise<{ status: string }> {
    return request<{ status: string }>("/health").catch(() => ({ status: "offline" }));
  },

  // Projects
  async getProjects(): Promise<Project[]> {
    return request<Project[]>("/projects");
  },

  async getProject(id: string): Promise<Project> {
    return request<Project>(`/projects/${id}`);
  },

  async createProject(payload: CreateProjectPayload): Promise<Project> {
    return request<Project>("/projects", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async deleteProject(id: string): Promise<{ success: boolean; message?: string }> {
    return request<{ success: boolean; message?: string }>(`/projects/${id}`, {
      method: "DELETE",
    });
  },

  // Ingestion
  async ingestFigma(projectId: string, payload: IngestFigmaPayload): Promise<unknown> {
    return request(`/projects/${projectId}/ingest/figma`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async ingestDocumentFile(projectId: string, file: File): Promise<unknown> {
    const formData = new FormData();
    formData.append("file", file);
    return request(`/projects/${projectId}/ingest/document`, {
      method: "POST",
      body: formData,
    });
  },

  async ingestDocumentText(projectId: string, text: string, fileName?: string): Promise<unknown> {
    return request(`/projects/${projectId}/ingest/document`, {
      method: "POST",
      body: JSON.stringify({ text, fileName }),
    });
  },

  async ingestDomain(projectId: string, payload: IngestDomainPayload): Promise<unknown> {
    return request(`/projects/${projectId}/ingest/domain`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // AI Generation
  async generateScenarios(
    projectId: string,
    payload?: GenerateScenariosPayload
  ): Promise<{ useCasesCount: number; testCasesCount: number }> {
    return request<{ useCasesCount: number; testCasesCount: number }>(
      `/projects/${projectId}/generate`,
      {
        method: "POST",
        body: JSON.stringify(payload || {}),
      }
    );
  },

  // Test Cases
  async createTestCase(useCaseId: string, payload: CreateTestCasePayload): Promise<TestCase> {
    return request<TestCase>(`/use-cases/${useCaseId}/test-cases`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updateTestCase(tcId: string, payload: UpdateTestCasePayload): Promise<TestCase> {
    return request<TestCase>(`/test-cases/${tcId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  async deleteTestCase(tcId: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/test-cases/${tcId}`, {
      method: "DELETE",
    });
  },

  // Test Runs
  async triggerTestRun(projectId: string): Promise<TestRun> {
    return request<TestRun>(`/projects/${projectId}/runs`, {
      method: "POST",
    });
  },

  async getTestRun(runId: string): Promise<TestRun> {
    return request<TestRun>(`/runs/${runId}`);
  },

  async updateExecutionItem(
    itemId: string,
    payload: UpdateExecutionItemPayload
  ): Promise<TestExecutionItem> {
    return request<TestExecutionItem>(`/execution-items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  // SSE Stream URL Helper
  getRunStreamUrl(runId: string): string {
    const baseUrl = getBaseUrl();
    return `${baseUrl}/runs/${runId}/stream`;
  },

  // Export URLs
  getExcelExportUrl(runId: string): string {
    const baseUrl = getBaseUrl();
    return `${baseUrl}/runs/${runId}/export/excel`;
  },

  getPdfExportUrl(runId: string): string {
    const baseUrl = getBaseUrl();
    return `${baseUrl}/runs/${runId}/export/pdf`;
  },
};
