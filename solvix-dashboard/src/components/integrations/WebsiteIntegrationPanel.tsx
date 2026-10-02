"use client";

import { useState, type FormEvent } from "react";
import { AlertTriangle, KeyRound, Pencil, PlugZap, RefreshCw, ShieldOff, TerminalSquare } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  ConfirmDialog,
  CopyButton,
  DetailList,
  ErrorState,
  Field,
  Input,
  Modal,
  Skeleton,
  type BadgeTone,
} from "@/components/ui";
import {
  useCreateIntegrationMutation,
  useDeleteIntegrationMutation,
  useGetIntegrationQuery,
  useTestConnectionMutation,
  useUpdateIntegrationMutation,
} from "@/store/api/integrationApi";
import { useMutationToast } from "@/hooks/useMutationToast";
import { isNotFound } from "@/lib/api/errors";
import { config } from "@/lib/config";
import { formatDateTime, formatRelative, siteUrl } from "@/utils/format";
import type { IntegrationCredentials, IntegrationStatus } from "@/types";
import { useSubmitLock } from "@/hooks/useSubmitLock";

const STATUS: Record<IntegrationStatus, { tone: BadgeTone; label: string }> = {
  connected: { tone: "success", label: "Connected" },
  disconnected: { tone: "neutral", label: "Not tested" },
  error: { tone: "danger", label: "Connection error" },
};

const isUrl = (v: string) => /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(v.trim());

/**
 * Website integration + API credentials (website-integrations routes).
 *
 *  - One integration per website. The BACKEND generates apiKey + apiSecret on
 *    POST /website-integrations and returns them in that response only
 *    (both fields are select:false). The dashboard shows them once.
 *  - "Regenerate" = DELETE then POST (the backend has no rotate route).
 *  - "Test connection" = POST /:websiteId/test — the backend calls `apiUrl`
 *    with the stored X-API-Key / X-API-Secret and records the result.
 *  - External sites read content from /integration/blogs and /integration/media
 *    using those two headers.
 */
export function WebsiteIntegrationPanel({ websiteId, websiteName, websiteDomain }: { websiteId: string; websiteName: string; websiteDomain: string }) {
  const q = useGetIntegrationQuery(websiteId);
  const [createIntegration, createState] = useCreateIntegrationMutation();
  const [updateIntegration, updateState] = useUpdateIntegrationMutation();
  const [deleteIntegration, deleteState] = useDeleteIntegrationMutation();
  const [testConnection, testState] = useTestConnectionMutation();
  const run = useMutationToast();
  const { locked, lock } = useSubmitLock();

  const suggestedUrl = siteUrl(websiteDomain, "/api/solvix") ?? "";
  const [apiUrl, setApiUrl] = useState(suggestedUrl);
  const [editingUrl, setEditingUrl] = useState(false);
  const [credentials, setCredentials] = useState<IntegrationCredentials | null>(null);
  const [confirm, setConfirm] = useState<"revoke" | "regenerate" | null>(null);

  const notSetUp = q.isError && isNotFound(q.error);
  const integration = q.data;

  const onCreate = async (e?: FormEvent) => {
    e?.preventDefault();
    const created = await run(createIntegration({ websiteId, apiUrl: apiUrl.trim() }).unwrap(), "API credentials generated");
    if (created) setCredentials(created);
  };

  const onSaveUrl = async (e?: FormEvent) => {
    e?.preventDefault();
    const ok = await run(updateIntegration({ websiteId, apiUrl: apiUrl.trim() }).unwrap(), "Integration updated successfully");
    if (ok) setEditingUrl(false);
  };

  const onTest = async () => {
    await run(testConnection(websiteId).unwrap(), "Website connection successful");
  };

  const onConfirm = async () => {
    if (!integration) return;
    if (confirm === "revoke") {
      await run(deleteIntegration(websiteId).unwrap().then(() => true), "Integration deleted — credentials revoked");
    } else if (confirm === "regenerate") {
      const url = integration.apiUrl;
      const deleted = await run(deleteIntegration(websiteId).unwrap().then(() => true), "Old credentials revoked");
      if (deleted) {
        const created = await run(createIntegration({ websiteId, apiUrl: url }).unwrap(), "New API credentials generated");
        if (created) setCredentials(created);
      }
    }
    setConfirm(null);
  };

  const snippet = `// Server-side only — never expose the secret to the browser.
const res = await fetch("${config.apiUrl}/integration/blogs", {
  headers: {
    "X-API-Key": process.env.SOLVIX_API_KEY,
    "X-API-Secret": process.env.SOLVIX_API_SECRET,
  },
});
const { data: blogs } = await res.json(); // published blogs for ${websiteName}`;

  return (
    <Card>
      <CardHeader
        icon={<KeyRound />}
        title="Website integration"
        description={`API credentials ${websiteName} uses to read its content from Solvix.`}
        action={integration ? <Badge tone={STATUS[integration.status].tone} dot>{STATUS[integration.status].label}</Badge> : undefined}
      />
      <div className="space-y-5 p-5">
        {q.isLoading ? (
          <Skeleton className="h-28 w-full rounded-xl" />
        ) : notSetUp ? (
          <form onSubmit={lock(onCreate)} className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-dashed border-border-strong bg-surface-2/40 p-4">
              <KeyRound className="mt-0.5 size-5 shrink-0 text-brand" />
              <div className="text-sm">
                <p className="font-medium text-fg">No integration yet</p>
                <p className="mt-0.5 text-muted">
                  Generating an integration creates an API key and secret on the server. The secret is shown <strong>once</strong>.
                </p>
              </div>
            </div>
            <Field
              label="Website API URL"
              htmlFor="apiUrl"
              required
              error={apiUrl && !isUrl(apiUrl) ? "Enter a full URL starting with https://" : undefined}
              hint="An endpoint on the website that Solvix calls when you click “Test connection”."
            >
              <Input id="apiUrl" value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} placeholder="https://topicler.com/api/solvix" />
            </Field>
            <div className="flex justify-end">
              <Button type="submit" loading={createState.isLoading || locked} disabled={!isUrl(apiUrl)} leftIcon={<KeyRound />}>
                Generate API credentials
              </Button>
            </div>
          </form>
        ) : q.isError || !integration ? (
          <ErrorState error={q.error} onRetry={() => q.refetch()} compact />
        ) : (
          <>
            {editingUrl ? (
              <form onSubmit={lock(onSaveUrl)} className="space-y-3">
                <Field label="Website API URL" htmlFor="editApiUrl" error={apiUrl && !isUrl(apiUrl) ? "Enter a full URL starting with https://" : undefined}>
                  <Input id="editApiUrl" value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} autoFocus />
                </Field>
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setEditingUrl(false)} disabled={updateState.isLoading}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" loading={updateState.isLoading || locked} disabled={!isUrl(apiUrl)}>
                    Save URL
                  </Button>
                </div>
              </form>
            ) : (
              <DetailList
                items={[
                  {
                    label: "API URL",
                    value: (
                      <span className="inline-flex items-center gap-1">
                        <code className="font-mono text-xs">{integration.apiUrl}</code>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="size-6"
                          aria-label="Edit API URL"
                          onClick={() => {
                            setApiUrl(integration.apiUrl);
                            setEditingUrl(true);
                          }}
                        >
                          <Pencil />
                        </Button>
                      </span>
                    ),
                  },
                  { label: "Type", value: integration.type },
                  { label: "API key & secret", value: <span className="text-muted">Hidden — shown once at generation</span> },
                  { label: "Last connected", value: formatRelative(integration.lastConnectedAt, "Never") },
                  { label: "Created", value: formatDateTime(integration.createdAt) },
                ]}
              />
            )}

            {integration.status === "error" && (
              <div className="flex items-start gap-2.5 rounded-xl border border-danger/20 bg-danger-soft px-3.5 py-3 text-sm text-fg">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" />
                The last connection test failed. Check that the API URL is reachable and accepts the Solvix credentials.
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" leftIcon={<PlugZap />} onClick={lock(onTest)} loading={testState.isLoading || locked}>
                Test connection
              </Button>
              <Button variant="secondary" size="sm" leftIcon={<RefreshCw />} onClick={() => setConfirm("regenerate")} disabled={deleteState.isLoading || createState.isLoading}>
                Regenerate keys
              </Button>
              <Button variant="danger-soft" size="sm" leftIcon={<ShieldOff />} onClick={() => setConfirm("revoke")}>
                Revoke
              </Button>
            </div>
          </>
        )}

        <div className="overflow-hidden rounded-xl border border-border">
          <div className="flex items-center justify-between border-b border-border bg-surface-2/60 px-3.5 py-2">
            <span className="flex items-center gap-2 text-xs font-medium text-muted">
              <TerminalSquare className="size-3.5" />
              Reading content from the website&apos;s server
            </span>
            <CopyButton value={snippet} toastMessage="Snippet copied" />
          </div>
          <pre className="scrollbar-thin overflow-x-auto bg-surface p-3.5 font-mono text-xs leading-relaxed text-fg">{snippet}</pre>
        </div>
      </div>

      <Modal
        open={!!credentials}
        onClose={() => setCredentials(null)}
        dismissible={false}
        title="Save these credentials now"
        description="This is the only time the API secret is shown. Store both values in the website's server environment variables."
        footer={<Button onClick={() => setCredentials(null)}>I&apos;ve saved them</Button>}
      >
        {credentials && (
          <div className="space-y-3 pb-2">
            {(
              [
                ["X-API-Key", "SOLVIX_API_KEY", credentials.apiKey],
                ["X-API-Secret", "SOLVIX_API_SECRET", credentials.apiSecret],
              ] as const
            ).map(([label, envName, value]) => (
              <div key={label}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-muted">{label}</span>
                  <code className="font-mono text-subtle">{envName}</code>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2">
                  <code className="min-w-0 flex-1 break-all font-mono text-[12px] text-fg">{value}</code>
                  <CopyButton value={value} toastMessage={`${label} copied`} />
                </div>
              </div>
            ))}
            <CopyButton
              value={`SOLVIX_API_KEY=${credentials.apiKey}\nSOLVIX_API_SECRET=${credentials.apiSecret}`}
              label="Copy as .env lines"
              variant="secondary"
              toastMessage="Copied both values"
            />
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={confirm !== null}
        title={confirm === "regenerate" ? "Regenerate API credentials?" : "Revoke integration?"}
        description={
          confirm === "regenerate"
            ? "The current key and secret stop working immediately and new ones are generated. Update the website's environment variables afterwards."
            : `${websiteName} will immediately lose access to its content from Solvix. You can generate new credentials later.`
        }
        confirmLabel={confirm === "regenerate" ? "Regenerate" : "Revoke"}
        loading={deleteState.isLoading || createState.isLoading || locked}
        onConfirm={lock(onConfirm)}
        onCancel={() => setConfirm(null)}
      />
    </Card>
  );
}
