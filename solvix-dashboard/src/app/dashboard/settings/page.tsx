"use client";

import { useState } from "react";
import { Cable, CheckCircle2, Palette, PlugZap, Server } from "lucide-react";
import { Badge, Card, CardHeader, DetailList, PageHeader, Tabs } from "@/components/ui";
import { ThemeSelector } from "@/components/dashboard/ThemeToggle";
import { IntegrationTester } from "@/components/integrations/IntegrationTester";
import { ENDPOINTS, ENDPOINT_GROUPS } from "@/lib/api/endpoints";
import { config } from "@/lib/config";
import { useAuth } from "@/features/auth/useAuth";

type Tab = "connection" | "integrations" | "appearance";

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("connection");
  const { isDemo } = useAuth();
  const all = Object.values(ENDPOINTS);
  const confirmed = all.filter(Boolean).length;

  return (
    <>
      <PageHeader title="Settings" description="Backend connection, integrations and appearance." />
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
                  { label: "Session", value: isDemo ? <Badge tone="warning">Demo preview</Badge> : <Badge tone="success">Live</Badge> },
                  { label: "Auth", value: "JWT · Bearer header" },
                  {
                    label: "Routes connected",
                    value: (
                      <span className="tabular-nums">
                        {confirmed} / {all.length}
                      </span>
                    ),
                  },
                ]}
              />
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full rounded-full bg-brand" style={{ width: `${(confirmed / all.length) * 100}%` }} />
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted">
                Set <code className="font-mono">NEXT_PUBLIC_API_URL</code> in <code className="font-mono">.env.local</code>. Connect routes in{" "}
                <code className="font-mono">src/lib/api/endpoints.ts</code>.
              </p>
            </div>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader icon={<Cable />} title="Backend routes" description="Routes marked pending need confirmation from the backend source before they're called." />
            <div className="divide-y divide-border">
              {Object.entries(ENDPOINT_GROUPS).map(([key, group]) => (
                <div key={key} className="px-5 py-4">
                  <div className="mb-2.5 flex items-center justify-between">
                    <span className="text-sm font-semibold text-fg">{group.label}</span>
                    <code className="font-mono text-xs text-muted">/api/v1{group.prefix}</code>
                  </div>
                  <ul className="grid gap-1.5 sm:grid-cols-2">
                    {group.keys.map((k) => {
                      const def = ENDPOINTS[k];
                      return (
                        <li key={k} className="flex items-center justify-between gap-2 rounded-lg bg-surface-2/60 px-3 py-2">
                          <span className="min-w-0">
                            <span className="block truncate font-mono text-xs text-fg">{k}</span>
                            {def && (
                              <span className="block truncate font-mono text-2xs text-muted">
                                {def.method} {def.path}
                              </span>
                            )}
                          </span>
                          {def ? (
                            <Badge tone="success">
                              <CheckCircle2 className="size-3" />
                              Confirmed
                            </Badge>
                          ) : (
                            <Badge tone="warning">Pending</Badge>
                          )}
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
              <p>Each website gets its own API key and secret, generated from the website&apos;s page in Solvix.</p>
              <p>
                The website&apos;s <span className="font-medium text-fg">server</span> calls <code className="font-mono text-xs text-fg">/integration/blogs</code> with{" "}
                <code className="font-mono text-xs text-fg">X-API-Key</code> and <code className="font-mono text-xs text-fg">X-API-Secret</code> — separate from dashboard logins.
              </p>
              <p>Never put the secret in client-side code or any NEXT_PUBLIC_* variable.</p>
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
