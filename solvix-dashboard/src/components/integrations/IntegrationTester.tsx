"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, PlugZap, XCircle } from "lucide-react";
import { Button, Card, CardHeader, Field, Input } from "@/components/ui";
import { useTestIntegrationMutation, type IntegrationTestResult } from "@/store/api/integrationApi";
import { getErrorMessage } from "@/lib/api/errors";
import { config } from "@/lib/config";

/**
 * Calls the confirmed GET /integration/blogs route with X-API-Key / X-API-Secret.
 * The keys are typed here for a one-off check and never stored. The dashboard JWT
 * is NOT sent. Your backend's CORS config must allow these headers from this origin.
 */
export function IntegrationTester() {
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [result, setResult] = useState<{ ok: true; data: IntegrationTestResult } | { ok: false; message: string } | null>(null);
  const [test, { isLoading }] = useTestIntegrationMutation();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setResult(null);
    try {
      const data = await test({ apiKey: apiKey.trim(), apiSecret: apiSecret.trim() }).unwrap();
      setResult({ ok: true, data });
    } catch (err) {
      setResult({ ok: false, message: getErrorMessage(err) });
    }
  };

  return (
    <Card>
      <CardHeader
        icon={<PlugZap />}
        title="Test website integration"
        description={
          <>
            Sends <code className="font-mono text-xs">GET {config.apiUrl.replace(/^https?:\/\/[^/]+/, "")}/integration/blogs</code> with API-key headers — the same call a website makes.
          </>
        }
      />
      <form onSubmit={onSubmit} className="space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="X-API-Key" htmlFor="apiKey">
            <Input id="apiKey" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk_live_…" autoComplete="off" className="font-mono text-[13px]" />
          </Field>
          <Field label="X-API-Secret" htmlFor="apiSecret">
            <Input id="apiSecret" type="password" value={apiSecret} onChange={(e) => setApiSecret(e.target.value)} placeholder="••••••••" autoComplete="off" className="font-mono text-[13px]" />
          </Field>
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted">Keys are only used for this request and aren&apos;t saved.</p>
          <Button type="submit" variant="secondary" loading={isLoading} disabled={!apiKey || !apiSecret}>
            Run test
          </Button>
        </div>
        {result &&
          (result.ok ? (
            <div className="space-y-3 rounded-xl border border-success/25 bg-success-soft p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-fg">
                <CheckCircle2 className="size-4 text-success" />
                Connected — {result.data.count} blog{result.data.count === 1 ? "" : "s"} returned
              </div>
              <pre className="scrollbar-thin max-h-56 overflow-auto rounded-lg bg-surface p-3 font-mono text-2xs leading-relaxed text-fg">
                {JSON.stringify(result.data.sample, (k, v) => (typeof v === "string" && v.startsWith("data:") ? "(embedded image)" : v), 2)}
              </pre>
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
