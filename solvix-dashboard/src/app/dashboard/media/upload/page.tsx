"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Info, Settings2 } from "lucide-react";
import { Button, EndpointNotice, Field, FormSection, PageHeader, Select } from "@/components/ui";
import { MediaUploader } from "@/components/media/MediaUploader";
import { WebsiteSelectField } from "@/components/websites/WebsiteSelectField";
import { useGetBlogsQuery } from "@/store/api/blogApi";
import { formatBytes } from "@/utils/format";
import { MAX_UPLOAD_BYTES } from "@/features/media/utils";

export default function UploadMediaPage() {
  const router = useRouter();
  const [website, setWebsite] = useState("");
  const [blog, setBlog] = useState("");
  const [uploaded, setUploaded] = useState(0);
  const blogs = useGetBlogsQuery();

  const blogOptions = (blogs.data?.items ?? [])
    .filter((b) => !website || b.websiteId === website)
    .map((b) => ({ value: b.id, label: b.title }));

  return (
    <>
      <PageHeader backHref="/dashboard/media" backLabel="Media Library" title="Upload media" description="Add images, video or PDFs to the shared library." />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <EndpointNotice endpoints={["media.upload"]} />
          <MediaUploader websiteId={website} blogId={blog} onComplete={(n) => setUploaded((u) => u + n)} />
          {uploaded > 0 && (
            <div className="flex items-center justify-between rounded-xl border border-success/25 bg-success-soft px-4 py-3 text-sm">
              <span className="text-fg">
                {uploaded} file{uploaded === 1 ? "" : "s"} added to the library.
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
              allowEmpty
              emptyLabel="No specific website"
            />
            <Field label="Attach to blog" htmlFor="blog" hint="Optional — link the files to a specific post.">
              <Select id="blog" value={blog} onChange={(e) => setBlog(e.target.value)} options={blogOptions} placeholder={blogs.isLoading ? "Loading…" : "No blog"} disabled={!blogOptions.length} />
            </Field>
          </FormSection>
          <div className="card flex gap-3 p-4 text-[13px] text-muted">
            <Info className="mt-0.5 size-4 shrink-0 text-info" />
            <p>
              Max {formatBytes(MAX_UPLOAD_BYTES)} per file. Use descriptive file names — they become the default alt text, which helps accessibility and SEO.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
