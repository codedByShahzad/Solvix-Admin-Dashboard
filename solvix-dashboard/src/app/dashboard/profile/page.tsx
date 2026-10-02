"use client";

import { Clock, Globe, LogOut, Palette, UserRound } from "lucide-react";
import { Avatar, Badge, Button, Card, CardHeader, DetailList, PageHeader, RoleBadge, Skeleton } from "@/components/ui";
import { ThemeSelector } from "@/components/dashboard/ThemeToggle";
import { WebsiteAvatar } from "@/components/websites/WebsiteAvatar";
import { useAuth } from "@/features/auth/useAuth";
import { useGetWebsitesQuery } from "@/store/api/websiteApi";
import { getJwtExpiry } from "@/utils/jwt";
import { formatDateTime, formatRelative, hostOf } from "@/utils/format";

export default function ProfilePage() {
  const { user, token, signOut } = useAuth();
  const websites = useGetWebsitesQuery();

  if (!user) return null;
  const expiry = token ? getJwtExpiry(token) : null;

  return (
    <>
      <PageHeader title="Profile" description="Your account and preferences." />
      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className="h-20 bg-gradient-to-br from-brand to-[#8B7CF6]" />
            <div className="-mt-9 px-5 pb-5">
              <Avatar name={user.name} size="xl" className="ring-4 ring-surface" />
              <h2 className="mt-3 text-lg font-semibold text-fg">{user.name}</h2>
              <p className="text-sm text-muted">{user.email}</p>
              <div className="mt-3 flex gap-2">
                <RoleBadge role={user.role} />
                <Badge tone={user.isActive ? "success" : "neutral"} dot>
                  {user.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </Card>
          <Card>
            <CardHeader icon={<Clock />} title="Session" />
            <div className="p-5">
              <DetailList items={[{ label: "Expires", value: expiry ? `${formatRelative(expiry)} (${formatDateTime(expiry)})` : "—" }]} />
              <Button variant="danger-soft" className="mt-4 w-full" leftIcon={<LogOut />} onClick={() => signOut()}>
                Log out
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader icon={<UserRound />} title="Account details" description="Loaded from GET /auth/me." />
            <div className="p-5">
              <DetailList
                items={[
                  { label: "Name", value: user.name },
                  { label: "Email", value: user.email },
                  { label: "Role", value: <RoleBadge role={user.role} /> },
                  { label: "User ID", value: <code className="font-mono text-xs">{user.id}</code> },
                ]}
              />
            </div>
          </Card>

          <Card>
            <CardHeader icon={<Globe />} title={user.role === "admin" ? "Websites you own" : "Websites you can edit"} />
            <div className="p-5">
              {websites.isLoading ? (
                <Skeleton className="h-14 w-full rounded-xl" />
              ) : websites.data?.length ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {websites.data.map((w) => (
                    <div key={w.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                      <WebsiteAvatar website={w} />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-fg">{w.name}</div>
                        <div className="truncate text-xs text-muted">{hostOf(w.domain)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">{user.role === "admin" ? "You don't own any websites yet." : "You aren't assigned to any website yet."}</p>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader icon={<Palette />} title="Appearance" />
            <div className="p-5">
              <ThemeSelector />
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
