"use client";

import { useState } from "react";
import { CheckCircle2, Palette, PlugZap, Server, XCircle } from "lucide-react";
import { Badge, Card, CardHeader, DetailList, PageHeader, Skeleton, Tabs, type BadgeTone } from "@/components/ui";
import { ThemeSelector } from "@/components/dashboard/ThemeToggle";
import { IntegrationTester } from "@/components/integrations/IntegrationTester";
import { ENDPOINTS, ENDPOINT_GROUPS, type EndpointDef } from "@/lib/api/endpoints";
import { config } from "@/lib/config";
import { useGetMeQuery } from "@/store/api/authApi";
import { getErrorMessage } from "@/lib/api/errors";

type Tab = "connection" | "integrations" | "appearance";

const ACCESS: Record<EndpointDef["access"], { tone: BadgeTone; label: string }> = {
  public: { tone: "neutral", label: "Public" },
  admin: { tone: "brand", label: "Admin" },
  "admin+editor": { tone: "info", label: "Admin + Editor" },
  "api-key": { tone: "warning", label: "API key" },
};

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("connection");
  const me = useGetMeQuery();

  return (
    <>
      <PageHeader title="Settings" description="Backend connection, website integrations and appearance." />
      <Tabs<Tab>
        className="mb-6"
        value={tab}
        onChange={setTab}
        items={[
          { value: "connection", label: "Backend connection", icon: <Server /> },
          { value: "integrations", label: "Integrations", icon: <PlugZap /> },
          { value: "appearance", label: "Appearance", icon: <Palette /> },
        ]}
      />

      {tab === "connection" && (
        <div className="grid items-start gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader icon={<Server />} title="API" />
            <div className="p-5">
              <DetailList
                items={[
                  { label: "Base URL", value: <code className="font-mono text-xs">{config.apiUrl}</code> },
                  {
                    label: "Status",
                    value: me.isLoading ? (
                      <Skeleton className="h-5 w-20" />
                    ) : me.isError ? (
                      <Badge tone="danger">
                        <XCircle className="size-3" />
                        Unreachable
                      </Badge>
                    ) : (
                      <Badge tone="success">
                        <CheckCircle2 className="size-3" />
                        Connected
                      </Badge>
                    ),
                  },
                  { label: "Auth", value: "JWT · Bearer header" },
                  { label: "Routes used", value: <span className="tabular-nums">{Object.keys(ENDPOINTS).length}</span> },
                ]}
              />
              {me.isError && <p className="mt-3 text-xs text-danger">{getErrorMessage(me.error)}</p>}
              <p className="mt-4 text-xs leading-relaxed text-muted">
                Change the backend URL with <code className="font-mono">NEXT_PUBLIC_API_URL</code> in <code className="font-mono">.env.local</code>.
              </p>
            </div>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader title="Backend routes" description="Every route the dashboard calls, traced from the Express routers." />
            <div className="divide-y divide-border">
              {ENDPOINT_GROUPS.map((group) => (
                <div key={group.label} className="px-5 py-4">
                  <div className="mb-2.5 text-sm font-semibold text-fg">{group.label}</div>
                  <ul className="space-y-1.5">
                    {group.keys.map((k) => {
                      const def: EndpointDef = ENDPOINTS[k];
                      return (
                        <li key={k} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface-2/60 px-3 py-2">
                          <span className="flex min-w-0 items-center gap-2 font-mono text-xs">
                            <span className="w-14 shrink-0 font-semibold text-muted">{def.method}</span>
                            <span className="truncate text-fg">/api/v1{def.path}</span>
                          </span>
                          <Badge tone={ACCESS[def.access].tone}>{ACCESS[def.access].label}</Badge>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === "integrations" && (
        <div className="grid items-start gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <IntegrationTester />
          </div>
          <Card>
            <CardHeader title="How integrations work" />
            <div className="space-y-3 p-5 text-sm leading-relaxed text-muted">
              <p>Each website gets one integration. Generate it from the website&apos;s page; Solvix creates the API key and secret and shows the secret once.</p>
              <p>
                The website&apos;s <span className="font-medium text-fg">server</span> sends <code className="font-mono text-xs text-fg">X-API-Key</code> and{" "}
                <code className="font-mono text-xs text-fg">X-API-Secret</code> to <code className="font-mono text-xs text-fg">/integration/blogs</code> or{" "}
                <code className="font-mono text-xs text-fg">/integration/media</code> and receives only its own published blogs and media.
              </p>
              <p>Never put the secret in browser code or any NEXT_PUBLIC_* variable.</p>
            </div>
          </Card>
        </div>
      )}

      {tab === "appearance" && (
        <Card className="max-w-2xl">
          <CardHeader icon={<Palette />} title="Theme" description="Saved in this browser." />
          <div className="p-5">
            <ThemeSelector />
          </div>
        </Card>
      )}
    </>
  );
}
