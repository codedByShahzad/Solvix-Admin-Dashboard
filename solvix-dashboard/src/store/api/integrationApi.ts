import { baseApi } from "./baseApi";
import {
  mapIntegration,
  mapIntegrationCredentials,
  type DataEnvelope,
  type RawIntegration,
  type RawIntegrationCredentials,
} from "@/lib/api/mappers";
import type { IntegrationCredentials, IntegrationStatus, WebsiteIntegration } from "@/types";

export interface CreateIntegrationInput {
  websiteId: string;
  apiUrl: string;
}

export interface ConnectionTestResult {
  status: IntegrationStatus;
  lastConnectedAt?: string;
  message: string;
}

export type CredentialCheckTarget = "integration.blogs" | "integration.media";

export interface CredentialCheckResult {
  count: number;
  first: unknown;
}

export const integrationApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    /** GET /website-integrations/:websiteId — 404 means "not set up yet". Never returns key/secret. */
    getIntegration: b.query<WebsiteIntegration, string>({
      query: (websiteId) => ({ endpoint: "integrations.get", pathParams: { websiteId } }),
      transformResponse: (res: DataEnvelope<RawIntegration>) => mapIntegration(res.data),
      providesTags: (_r, _e, websiteId) => [{ type: "Integration", id: websiteId }],
    }),
    /** POST /website-integrations → the ONLY response that contains apiKey + apiSecret. */
    createIntegration: b.mutation<IntegrationCredentials, CreateIntegrationInput>({
      query: ({ websiteId, apiUrl }) => ({
        endpoint: "integrations.create",
        body: { websiteId, apiUrl, type: "REST_API" },
      }),
      transformResponse: (res: DataEnvelope<RawIntegrationCredentials>) => mapIntegrationCredentials(res.data),
      invalidatesTags: (_r, _e, { websiteId }) => [{ type: "Integration", id: websiteId }],
    }),
    /** PATCH /website-integrations/:websiteId { apiUrl } — resets status to disconnected */
    updateIntegration: b.mutation<WebsiteIntegration, { websiteId: string; apiUrl: string }>({
      query: ({ websiteId, apiUrl }) => ({ endpoint: "integrations.update", pathParams: { websiteId }, body: { apiUrl } }),
      transformResponse: (res: DataEnvelope<RawIntegration>) => mapIntegration(res.data),
      invalidatesTags: (_r, _e, { websiteId }) => [{ type: "Integration", id: websiteId }],
    }),
    /** DELETE /website-integrations/:websiteId — revokes the credentials */
    deleteIntegration: b.mutation<void, string>({
      query: (websiteId) => ({ endpoint: "integrations.delete", pathParams: { websiteId } }),
      transformResponse: () => undefined,
      invalidatesTags: (_r, _e, websiteId) => [{ type: "Integration", id: websiteId }],
    }),
    /** POST /website-integrations/:websiteId/test — backend calls apiUrl with the stored credentials */
    testConnection: b.mutation<ConnectionTestResult, string>({
      query: (websiteId) => ({ endpoint: "integrations.test", pathParams: { websiteId } }),
      transformResponse: (res: DataEnvelope<{ status: IntegrationStatus; lastConnectedAt?: string }>) => ({
        status: res.data.status,
        lastConnectedAt: res.data.lastConnectedAt,
        message: res.message ?? "Website connection successful",
      }),
      // Success or failure, the backend updates the stored status.
      invalidatesTags: (_r, _e, websiteId) => [{ type: "Integration", id: websiteId }],
    }),
    /**
     * Calls the external API exactly as a website would: X-API-Key + X-API-Secret,
     * no dashboard JWT. Values are used for this request only and never stored.
     */
    checkCredentials: b.mutation<CredentialCheckResult, { apiKey: string; apiSecret: string; target: CredentialCheckTarget }>({
      query: ({ apiKey, apiSecret, target }) => ({
        endpoint: target,
        headers: { "X-API-Key": apiKey, "X-API-Secret": apiSecret },
      }),
      transformResponse: (res: DataEnvelope<unknown[]>) => ({ count: res.count ?? res.data.length, first: res.data[0] ?? null }),
    }),
  }),
});

export const {
  useGetIntegrationQuery,
  useCreateIntegrationMutation,
  useUpdateIntegrationMutation,
  useDeleteIntegrationMutation,
  useTestConnectionMutation,
  useCheckCredentialsMutation,
} = integrationApi;
