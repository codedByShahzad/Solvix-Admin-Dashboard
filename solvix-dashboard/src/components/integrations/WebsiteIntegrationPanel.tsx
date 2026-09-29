"use client";

import { useState } from "react";
import { KeyRound, Plus, ShieldOff, TerminalSquare } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  ConfirmDialog,
  CopyButton,
  EmptyState,
  ErrorState,
  Modal,
  Skeleton,
} from "@/components/ui";
import {
  useCreateIntegrationMutation,
  useGetIntegrationsQuery,
  useRevokeIntegrationMutation,
} from "@/store/api/integrationApi";
import { useMutationToast } from "@/hooks/useMutationToast";
import { config } from "@/lib/config";
import { formatDate, formatRelative } from "@/utils/format";
import type { WebsiteIntegration } from "@/types";

function mask(key: string) {
  return key.length > 12 ? `${key.slice(0, 10)}••••••${key.slice(-4)}` : key;
}

/**
 * API credentials an external website (e.g. topicler.com) uses to read its
 * published blogs from GET /integration/blogs via X-API-Key / X-API-Secret.
 * Kept completely separate from dashboard JWT auth.
 */
export function WebsiteIntegrationPanel({ websiteId, websiteName }: { websiteId: string; websiteName: string }) {
  const q = useGetIntegrationsQuery();
  const [createIntegration, createState] = useCreateIntegrationMutation();
  const [revokeIntegration, revokeState] = useRevokeIntegrationMutation();
  const run = useMutationToast();
  const [revealed, setRevealed] = useState<WebsiteIntegration | null>(null);
  const [toRevoke, setToRevoke] = useState<WebsiteIntegration | null>(null);

  const items = q.data?.items.filter((i) => i.websiteId === websiteId) ?? [];

  const onCreate = async () => {
    const created = await run(createIntegration({ websiteId }).unwrap(), "API credentials generated");
    if (created) setRevealed(created);
  };

  const onRevoke = async () => {
    if (!toRevoke) return;
    await run(revokeIntegration(toRevoke.id).unwrap(), "Credentials revoked");
    setToRevoke(null);
  };

  const snippet = `const res = await fetch("${config.apiUrl}/integration/blogs", {
  headers: {
    "X-API-Key": process.env.SOLVIX_API_KEY,
    "X-API-Secret": process.env.SOLVIX_API_SECRET,
  },
  // Server-side only — never expose the secret to the browser.
});`;

  return (
    <Card>
      <CardHeader
        icon={<KeyRound />}
        title="Website integration"
        description={`Credentials ${websiteName} uses to fetch its published blogs.`}
        action={
          <Button size="sm" variant="secondary" leftIcon={<Plus />} onClick={onCreate} loading={createState.isLoading}>
            Generate keys
          </Button>
        }
      />
      <div className="p-5">
        {q.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-14 w-full rounded-lg" />
          </div>
        ) : q.isError ? (
          <ErrorState error={q.error} onRetry={() => q.refetch()} compact />
        ) : items.length === 0 ? (
          <EmptyState
            compact
            icon={<KeyRound />}
            title="No API credentials yet"
            description="Generate a key pair so this website can pull its published blogs from Solvix."
          />
        ) : (
          <ul className="space-y-2.5">
            {items.map((it) => (
              <li key={it.id} className="flex flex-col gap-3 rounded-xl border border-border bg-surface-2/40 p-3.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <code className="truncate font-mono text-[13px] text-fg">{mask(it.apiKey)}</code>
                    <Badge tone={it.isActive ? "success" : "danger"} dot>
                      {it.isActive ? "Active" : "Revoked"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    Created {formatDate(it.createdAt)} · Last used {formatRelative(it.lastUsedAt, "never")}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <CopyButton value={it.apiKey} label="Copy key" toastMessage="API key copied" variant="secondary" />
                  {it.isActive && (
                    <Button size="sm" variant="danger-soft" leftIcon={<ShieldOff />} onClick={() => setToRevoke(it)}>
                      Revoke
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5 overflow-hidden rounded-xl border border-border">
          <div className="flex items-center justify-between border-b border-border bg-surface-2/60 px-3.5 py-2">
            <span className="flex items-center gap-2 text-xs font-medium text-muted">
              <TerminalSquare className="size-3.5" />
              Usage on the website (server-side)
            </span>
            <CopyButton value={snippet} toastMessage="Snippet copied" />
          </div>
          <pre className="scrollbar-thin overflow-x-auto bg-surface p-3.5 font-mono text-xs leading-relaxed text-fg">{snippet}</pre>
        </div>
      </div>

      <Modal
        open={!!revealed}
        onClose={() => setRevealed(null)}
        title="Save these credentials now"
        description="For security, the secret may not be shown again. Store both values in the website's server environment."
        footer={<Button onClick={() => setRevealed(null)}>I&apos;ve saved them</Button>}
      >
        {revealed && (
          <div className="space-y-3 pb-2">
            {[
              ["X-API-Key", revealed.apiKey],
              ["X-API-Secret", revealed.apiSecret ?? "— not returned by the server —"],
            ].map(([label, value]) => (
              <div key={label}>
                <div className="mb-1 text-xs font-medium text-muted">{label}</div>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2">
                  <code className="min-w-0 flex-1 break-all font-mono text-[13px] text-fg">{value}</code>
                  <CopyButton value={value} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!toRevoke}
        title="Revoke these credentials?"
        description="The website using this key will immediately lose access to its blogs from Solvix."
        confirmLabel="Revoke"
        loading={revokeState.isLoading}
        onConfirm={onRevoke}
        onCancel={() => setToRevoke(null)}
      />
    </Card>
  );
}
