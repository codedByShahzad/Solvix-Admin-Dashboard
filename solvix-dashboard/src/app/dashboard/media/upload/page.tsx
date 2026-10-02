"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Info, Settings2 } from "lucide-react";
import { Button, Field, FormSection, Input, PageHeader, Select } from "@/components/ui";
import { MediaUploader } from "@/components/media/MediaUploader";
import { WebsiteSelectField } from "@/components/websites/WebsiteSelectField";
import { useGetBlogsQuery } from "@/store/api/blogApi";
import { formatBytes } from "@/utils/format";
import { MAX_UPLOAD_BYTES } from "@/features/media/utils";

export default function UploadMediaPage() {
  const router = useRouter();
  const [website, setWebsite] = useState("");
  const [blog, setBlog] = useState("");
  const [altText, setAltText] = useState("");
  const [uploaded, setUploaded] = useState(0);
  const blogs = useGetBlogsQuery();

  // The backend rejects a blog from a different website, so only offer matching ones.
  const blogOptions = (blogs.data ?? []).filter((b) => website && b.websiteId === website).map((b) => ({ value: b.id, label: b.title }));

  return (
    <>
      <PageHeader backHref="/dashboard/media" backLabel="Media Library" title="Upload media" description="Add images to the shared library." />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <MediaUploader websiteId={website} blogId={blog} altText={altText} disabled={!website} onComplete={(n) => setUploaded((u) => u + n)} />
          {uploaded > 0 && (
            <div className="flex items-center justify-between rounded-xl border border-success/25 bg-success-soft px-4 py-3 text-sm">
              <span className="text-fg">
                {uploaded} image{uploaded === 1 ? "" : "s"} added to the library.
              </span>
              <Button size="sm" variant="secondary" onClick={() => router.push("/dashboard/media")}>
                View library
              </Button>
            </div>
          )}
        </div>
        <div className="space-y-6">
          <FormSection title="Upload settings" description="Applied to every file in this batch." icon={<Settings2 />}>
            <WebsiteSelectField
              value={website}
              onChange={(v) => {
                setWebsite(v);
                setBlog("");
              }}
              required
            />
            <Field label="Attach to blog" htmlFor="blog" hint="Optional — only blogs from the selected website.">
              <Select
                id="blog"
                value={blog}
                onChange={(e) => setBlog(e.target.value)}
                options={blogOptions}
                placeholder={!website ? "Choose a website first" : blogs.isLoading ? "Loading…" : "No blog"}
                disabled={!blogOptions.length}
              />
            </Field>
            <Field label="Alt text" htmlFor="altText" hint="Optional — applied to every file in this batch.">
              <Input id="altText" value={altText} onChange={(e) => setAltText(e.target.value)} placeholder="Describe the image" maxLength={200} />
            </Field>
          </FormSection>
          <div className="card flex gap-3 p-4 text-[13px] text-muted">
            <Info className="mt-0.5 size-4 shrink-0 text-info" />
            <p>JPG, PNG or WebP only, max {formatBytes(MAX_UPLOAD_BYTES)} per file. You can edit alt text for each image afterwards.</p>
          </div>
        </div>
      </div>
    </>
  );
}
