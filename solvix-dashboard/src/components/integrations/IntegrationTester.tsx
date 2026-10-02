"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, PlugZap, XCircle } from "lucide-react";
import { Button, Card, CardHeader, Field, Input, Segmented } from "@/components/ui";
import { useCheckCredentialsMutation, type CredentialCheckResult, type CredentialCheckTarget } from "@/store/api/integrationApi";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { getErrorMessage } from "@/lib/api/errors";

/**
 * Calls GET /integration/blogs or /integration/media with X-API-Key and
 * X-API-Secret — exactly what an external website does. The dashboard JWT is
 * NOT sent and the values typed here are never stored.
 */
export function IntegrationTester() {
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [target, setTarget] = useState<CredentialCheckTarget>("integration.blogs");
  const [result, setResult] = useState<{ ok: true; data: CredentialCheckResult } | { ok: false; message: string } | null>(null);
  const [check, { isLoading }] = useCheckCredentialsMutation();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setResult(null);
    try {
      const data = await check({ apiKey: apiKey.trim(), apiSecret: apiSecret.trim(), target }).unwrap();
      setResult({ ok: true, data });
    } catch (err) {
      setResult({ ok: false, message: getErrorMessage(err) });
    }
  };

  const label = target === "integration.blogs" ? "published blog" : "media item";

  return (
    <Card>
      <CardHeader
        icon={<PlugZap />}
        title="Test API credentials"
        description={
          <>
            Sends <code className="font-mono text-xs">GET /api/v1{ENDPOINTS[target].path}</code> with the key and secret, the same request a website makes.
          </>
        }
      />
      <form onSubmit={onSubmit} className="space-y-4 p-5">
        <Segmented<CredentialCheckTarget>
          value={target}
          onChange={setTarget}
          items={[
            { value: "integration.blogs", label: "Blogs" },
            { value: "integration.media", label: "Media" },
          ]}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="X-API-Key" htmlFor="apiKey">
            <Input id="apiKey" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk_…" autoComplete="off" className="font-mono text-[13px]" />
          </Field>
          <Field label="X-API-Secret" htmlFor="apiSecret">
            <Input id="apiSecret" type="password" value={apiSecret} onChange={(e) => setApiSecret(e.target.value)} placeholder="••••••••" autoComplete="off" className="font-mono text-[13px]" />
          </Field>
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted">Values are used for this request only and aren&apos;t saved.</p>
          <Button type="submit" variant="secondary" loading={isLoading} disabled={!apiKey.trim() || !apiSecret.trim()}>
            Run test
          </Button>
        </div>
        {result &&
          (result.ok ? (
            <div className="space-y-3 rounded-xl border border-success/25 bg-success-soft p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-fg">
                <CheckCircle2 className="size-4 text-success" />
                Authenticated — {result.data.count} {label}
                {result.data.count === 1 ? "" : "s"} returned
              </div>
              {result.data.first !== null && (
                <pre className="scrollbar-thin max-h-56 overflow-auto rounded-lg bg-surface p-3 font-mono text-2xs leading-relaxed text-fg">
                  {JSON.stringify(result.data.first, null, 2)}
                </pre>
              )}
            </div>
          ) : (
            <div className="flex items-start gap-2 rounded-xl border border-danger/20 bg-danger-soft p-4 text-sm text-danger">
              <XCircle className="mt-0.5 size-4 shrink-0" />
              {result.message}
            </div>
          ))}
      </form>
    </Card>
  );
}
