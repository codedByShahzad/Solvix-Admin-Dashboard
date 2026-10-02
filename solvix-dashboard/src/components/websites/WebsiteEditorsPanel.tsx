"use client";

import { useMemo, useState } from "react";
import { useSubmitLock } from "@/hooks/useSubmitLock";
import Link from "next/link";
import { UserPlus, Users } from "lucide-react";
import { Avatar, Badge, Button, Card, CardHeader, EmptyState, ErrorState, Select, Skeleton } from "@/components/ui";
import { useGetEditorsQuery } from "@/store/api/editorApi";
import { useAssignEditorMutation } from "@/store/api/websiteApi";
import { useMutationToast } from "@/hooks/useMutationToast";
import type { Website } from "@/types";

/**
 * Editors assigned to a website (website.editors holds user IDs; names come from
 * GET /admin/editors). Assigning uses PATCH /websites/:id/assign-editor.
 * The backend has no "unassign" route, so removal isn't offered.
 */
export function WebsiteEditorsPanel({ website }: { website: Website }) {
  const editorsQ = useGetEditorsQuery();
  const [assign, { isLoading }] = useAssignEditorMutation();
  const run = useMutationToast();
  const { locked, lock } = useSubmitLock();
  const [selected, setSelected] = useState("");

  const byId = useMemo(() => new Map((editorsQ.data ?? []).map((e) => [e.id, e])), [editorsQ.data]);
  const available = (editorsQ.data ?? []).filter((e) => !website.editors.includes(e.id));

  const onAssign = async () => {
    if (!selected) return;
    const ok = await run(assign({ websiteId: website.id, editorId: selected }).unwrap(), "Editor assigned successfully");
    if (ok) setSelected("");
  };

  return (
    <Card>
      <CardHeader icon={<Users />} title="Editors" description="Editors can write blogs and upload media for this website." />
      <div className="space-y-4 p-5">
        {editorsQ.isLoading ? (
          <Skeleton className="h-12 w-full rounded-lg" />
        ) : editorsQ.isError ? (
          <ErrorState error={editorsQ.error} onRetry={() => editorsQ.refetch()} compact />
        ) : website.editors.length === 0 ? (
          <EmptyState compact icon={<Users />} title="No editors assigned" description="Assign an editor below to give them access." />
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border">
            {website.editors.map((id) => {
              const e = byId.get(id);
              return (
                <li key={id} className="flex items-center gap-3 px-3.5 py-2.5">
                  <Avatar name={e?.name ?? "?"} size="sm" />
                  <div className="min-w-0 flex-1">
                    {e ? (
                      <Link href={`/dashboard/editors/${id}`} className="block truncate text-sm font-medium text-fg hover:text-brand">
                        {e.name}
                      </Link>
                    ) : (
                      <code className="block truncate font-mono text-xs text-muted">{id}</code>
                    )}
                    <div className="truncate text-xs text-muted">{e?.email ?? "Unknown user"}</div>
                  </div>
                  {e && !e.isActive && <Badge>Inactive</Badge>}
                </li>
              );
            })}
          </ul>
        )}

        {!editorsQ.isError && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              options={available.map((e) => ({ value: e.id, label: `${e.name} · ${e.email}` }))}
              placeholder={editorsQ.isLoading ? "Loading editors…" : available.length ? "Choose an editor to assign" : "No unassigned editors"}
              disabled={!available.length}
              aria-label="Editor to assign"
            />
            <Button onClick={lock(onAssign)} loading={isLoading || locked} disabled={!selected} leftIcon={<UserPlus />} className="sm:w-auto">
              Assign
            </Button>
          </div>
        )}
        {!editorsQ.isLoading && (editorsQ.data?.length ?? 0) === 0 && (
          <p className="text-xs text-muted">
            No editor accounts exist yet.{" "}
            <Link href="/dashboard/editors/create" className="font-medium text-brand hover:underline">
              Create an editor
            </Link>
            .
          </p>
        )}
      </div>
    </Card>
  );
}
