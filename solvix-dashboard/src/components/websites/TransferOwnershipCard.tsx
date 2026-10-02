"use client";

import { useState } from "react";
import { useSubmitLock } from "@/hooks/useSubmitLock";
import { useRouter } from "next/navigation";
import { ArrowRightLeft } from "lucide-react";
import { Button, Card, CardHeader, ConfirmDialog, Field, Input, Select } from "@/components/ui";
import { useGetEditorsQuery } from "@/store/api/editorApi";
import { useTransferOwnershipMutation } from "@/store/api/websiteApi";
import { useMutationToast } from "@/hooks/useMutationToast";
import type { Website } from "@/types";

const OTHER = "__other__";

/**
 * PATCH /websites/:id/owner { owner } — accepts any user ID. Admins only see
 * websites they own, so after transferring, the current admin loses access.
 */
export function TransferOwnershipCard({ website }: { website: Website }) {
  const router = useRouter();
  const editorsQ = useGetEditorsQuery();
  const [transfer, { isLoading }] = useTransferOwnershipMutation();
  const run = useMutationToast();
  const { locked, lock } = useSubmitLock();
  const [choice, setChoice] = useState("");
  const [customId, setCustomId] = useState("");
  const [confirming, setConfirming] = useState(false);

  const ownerId = choice === OTHER ? customId.trim() : choice;
  const validId = /^[a-f0-9]{24}$/i.test(ownerId);

  const onConfirm = async () => {
    const ok = await run(transfer({ websiteId: website.id, ownerId }).unwrap(), "Website ownership transferred successfully");
    setConfirming(false);
    if (ok) router.push("/dashboard/websites");
  };

  return (
    <Card className="border-danger/25">
      <CardHeader icon={<ArrowRightLeft />} title="Transfer ownership" description="Hand this website to another user." />
      <div className="space-y-3 p-5">
        <Field label="New owner" htmlFor="newOwner">
          <Select
            id="newOwner"
            value={choice}
            onChange={(e) => setChoice(e.target.value)}
            options={[
              { value: OTHER, label: "Another admin (enter user ID)…" },
              ...(editorsQ.data ?? []).map((e) => ({ value: e.id, label: `${e.name} (editor)` })),
            ]}
            placeholder="Select a user"
          />
        </Field>
        {choice === OTHER && (
          <Field label="User ID" htmlFor="ownerId" error={customId && !validId ? "Enter a valid 24-character user ID" : undefined}>
            <Input id="ownerId" value={customId} onChange={(e) => setCustomId(e.target.value)} placeholder="665f1c2e9b1e8a0012ab34cd" className="font-mono text-[13px]" />
          </Field>
        )}
        <p className="text-xs text-muted">
          You will no longer see this website after transferring it. Editors manage content through assignment, not ownership — transfer to an admin to hand over management.
        </p>
        <Button variant="danger-soft" className="w-full" disabled={!validId} onClick={() => setConfirming(true)}>
          Transfer ownership
        </Button>
      </div>
      <ConfirmDialog
        open={confirming}
        title="Transfer ownership?"
        description={
          <>
            <span className="font-medium text-fg">{website.name}</span> will be owned by another user and will disappear from your websites list.
          </>
        }
        confirmLabel="Transfer"
        loading={isLoading || locked}
        onConfirm={lock(onConfirm)}
        onCancel={() => setConfirming(false)}
      />
    </Card>
  );
}
