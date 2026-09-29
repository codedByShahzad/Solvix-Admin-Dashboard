/**
 * SAMPLE DATA for the demo preview only ("Preview as Admin/Editor" on /login).
 * None of these numbers are shown in a live session — live sessions only ever
 * render what the backend returns.
 */

type Obj = Record<string, unknown>;

const DAY = 86_400_000;
const now = Date.now();
const ago = (days: number, hours = 0) => new Date(now - days * DAY - hours * 3_600_000).toISOString();

const PALETTES: [string, string, string][] = [
  ["#5450E0", "#8B7CF6", "#E9E7FF"],
  ["#0E9F6E", "#34D399", "#DCFCE7"],
  ["#E4572E", "#F59E0B", "#FEF3C7"],
  ["#2563EB", "#38BDF8", "#E0F2FE"],
  ["#BE185D", "#F472B6", "#FCE7F3"],
  ["#0F172A", "#475569", "#E2E8F0"],
  ["#7C3AED", "#22D3EE", "#EDE9FE"],
];

/** Generated SVG artwork so the demo works fully offline. */
export function artwork(seed: number, label: string, w = 1200, h = 675): string {
  const [a, b, c] = PALETTES[seed % PALETTES.length];
  const r = (n: number) => ((seed * 9301 + n * 49297) % 233280) / 233280;
  const circles = Array.from({ length: 5 }, (_, i) => {
    const cx = Math.round(r(i + 1) * w);
    const cy = Math.round(r(i + 7) * h);
    const rad = Math.round(80 + r(i + 13) * 260);
    return `<circle cx="${cx}" cy="${cy}" r="${rad}" fill="${i % 2 ? c : b}" fill-opacity="${0.14 + r(i) * 0.2}"/>`;
  }).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/>${circles}<text x="${w / 2}" y="${h - 72}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="48" font-weight="700" fill="#ffffff" fill-opacity="0.92">${label.replace(/[<&>]/g, "")}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export const demoWebsites: Obj[] = [
  {
    _id: "web_topicler",
    name: "Topicler",
    domain: "topicler.com",
    slug: "topicler",
    description: "AI tools for writers, students and creators — starting with the random topic generator.",
    status: "active",
    owner: { _id: "usr_admin", name: "Solvix Admin" },
    createdAt: ago(120),
    updatedAt: ago(3),
  },
  {
    _id: "web_numoro",
    name: "Numoro",
    domain: "numoro.net",
    slug: "numoro",
    description: "Number tools, calculators and explainers.",
    status: "active",
    owner: { _id: "usr_admin", name: "Solvix Admin" },
    createdAt: ago(64),
    updatedAt: ago(9),
  },
];

const blogSeeds: [string, string, string, "published" | "draft", number][] = [
  ["web_topicler", "How to Pick a Debate Topic in Under a Minute", "Guides", "published", 2],
  ["web_topicler", "50 Writing Prompts for When You're Completely Stuck", "Writing", "published", 5],
  ["web_topicler", "Random Topic Generators in the Classroom", "Education", "published", 8],
  ["web_topicler", "Brainstorming Techniques That Actually Work", "Productivity", "draft", 1],
  ["web_topicler", "Turning a Random Topic into a Full Essay Outline", "Writing", "published", 13],
  ["web_topicler", "Icebreaker Questions for Remote Teams", "Workplace", "draft", 4],
  ["web_topicler", "Choosing Presentation Topics Your Audience Will Remember", "Guides", "published", 21],
  ["web_topicler", "Creative Writing Exercises for Beginners", "Writing", "published", 27],
  ["web_topicler", "Topic Clusters: Planning a Content Calendar", "Content", "draft", 0],
  ["web_numoro", "Understanding Percentages Without a Calculator", "Math Basics", "published", 3],
  ["web_numoro", "Compound Interest, Explained Simply", "Finance", "published", 6],
  ["web_numoro", "Prime Numbers: Why They Matter", "Math Basics", "published", 11],
  ["web_numoro", "Unit Conversion Cheatsheet", "Reference", "draft", 2],
  ["web_numoro", "Mental Math Tricks for Everyday Use", "Math Basics", "published", 18],
  ["web_numoro", "Rounding Rules and Significant Figures", "Reference", "draft", 7],
  ["web_numoro", "Reading Charts Without Getting Fooled", "Data", "published", 32],
];

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const demoBlogs: Obj[] = blogSeeds.map(([website, title, category, status, days], i) => {
  const site = demoWebsites.find((w) => w._id === website)! as { _id: string; name: string; domain: string; slug: string };
  const s = slug(title);
  return {
    _id: `blog_${i + 1}`,
    website: { _id: site._id, name: site.name, domain: site.domain },
    slug: s,
    title,
    subtitle: `A practical, no-fluff guide from the ${site.name} team.`,
    heroImage: artwork(i, title.split(" ").slice(0, 3).join(" ")),
    category,
    publishDate: status === "published" ? ago(days) : undefined,
    readingTime: 3 + (i % 6),
    canonicalPath: `/blog/${s}`,
    seoTitle: `${title} | ${site.name}`,
    seoDescription: `Learn ${title.toLowerCase()} with clear examples and practical tips from ${site.name}.`,
    keywords: [category.toLowerCase(), site.name.toLowerCase(), "guide"],
    ogImage: artwork(i + 3, site.name),
    status,
    author: i % 3 === 0 ? { _id: "usr_admin", name: "Solvix Admin" } : { _id: "ed_1", name: "Ayesha Khan" },
    relatedSlugs: i > 0 ? [slug(blogSeeds[i - 1][1])] : [],
    content: [
      { type: "paragraph", text: `This is sample content for “${title}”. In a live session, this article body comes from the Solvix backend.` },
      { type: "heading", level: 2, text: "Why it matters" },
      { type: "paragraph", text: "Good structure makes content easier to read, easier to rank and easier to maintain across multiple websites." },
      { type: "list", items: ["Start with a clear goal", "Keep sections short", "Link related articles"] },
      { type: "quote", text: "Clarity beats cleverness." },
      { type: "heading", level: 2, text: "Next steps" },
      { type: "paragraph", text: "Edit this post to try the block editor, SEO preview and publishing controls." },
    ],
    createdAt: ago(days + 2),
    updatedAt: ago(Math.max(0, days - 1), i),
  };
});

const mediaSeeds: [string, string, string | undefined, number][] = [
  ["topicler-hero-debate.png", "web_topicler", "blog_1", 2],
  ["writing-prompts-cover.jpg", "web_topicler", "blog_2", 5],
  ["classroom-generator.webp", "web_topicler", "blog_3", 8],
  ["essay-outline-diagram.png", "web_topicler", "blog_5", 13],
  ["topicler-og-default.png", "web_topicler", undefined, 30],
  ["team-icebreakers.jpg", "web_topicler", "blog_6", 4],
  ["percentages-hero.png", "web_numoro", "blog_10", 3],
  ["compound-interest-chart.png", "web_numoro", "blog_11", 6],
  ["primes-spiral.webp", "web_numoro", "blog_12", 11],
  ["numoro-logo-mark.png", "web_numoro", undefined, 60],
  ["mental-math-cover.jpg", "web_numoro", "blog_14", 18],
  ["charts-reading.png", "web_numoro", "blog_16", 32],
];

export const demoMedia: Obj[] = mediaSeeds.map(([filename, website, blog, days], i) => {
  const site = demoWebsites.find((w) => w._id === website)! as { _id: string; name: string; domain: string; slug: string };
  const b = blog ? demoBlogs.find((x) => x._id === blog) : undefined;
  const format = filename.split(".").pop()!;
  return {
    _id: `media_${i + 1}`,
    url: artwork(i + 2, filename.split(".")[0].replace(/-/g, " "), 1200, 800),
    publicId: `solvix/${site.slug}/${filename.split(".")[0]}`,
    originalName: filename,
    mimeType: `image/${format === "jpg" ? "jpeg" : format}`,
    format,
    size: 84_000 + ((i * 37_919) % 900_000),
    width: 1200,
    height: 800,
    alt: filename.split(".")[0].replace(/-/g, " "),
    website: { _id: site._id, name: site.name, domain: site.domain },
    blog: b ? { _id: b._id, title: b.title } : undefined,
    uploadedBy: { _id: "usr_admin", name: "Solvix Admin" },
    createdAt: ago(days, 3),
    updatedAt: ago(days, 1),
  };
});

export const demoEditors: Obj[] = [
  { _id: "ed_1", name: "Ayesha Khan", email: "ayesha@soldevix.demo", role: "editor", isActive: true, websites: [demoWebsites[0]], createdAt: ago(90), lastLoginAt: ago(0, 2) },
  { _id: "ed_2", name: "Bilal Ahmed", email: "bilal@soldevix.demo", role: "editor", isActive: true, websites: [demoWebsites[1]], createdAt: ago(45), lastLoginAt: ago(1, 5) },
  { _id: "ed_3", name: "Sara Malik", email: "sara@soldevix.demo", role: "editor", isActive: true, websites: [demoWebsites[0], demoWebsites[1]], createdAt: ago(30), lastLoginAt: ago(3) },
  { _id: "ed_4", name: "Hamza Raza", email: "hamza@soldevix.demo", role: "editor", isActive: false, websites: [], createdAt: ago(14) },
];

export const demoIntegrations: Obj[] = [
  { _id: "int_1", website: demoWebsites[0], apiKey: "sk_live_topicler_7f3a92c1", isActive: true, createdAt: ago(100), lastUsedAt: ago(0, 1) },
  { _id: "int_2", website: demoWebsites[1], apiKey: "sk_live_numoro_4b81d0e6", isActive: true, createdAt: ago(60), lastUsedAt: ago(0, 6) },
];

export const DEMO_USERS = {
  admin: { id: "usr_admin", name: "Solvix Admin", email: "admin@soldevix.demo", role: "admin" as const },
  editor: {
    id: "ed_1",
    name: "Ayesha Khan",
    email: "ayesha@soldevix.demo",
    role: "editor" as const,
    websites: [{ id: "web_topicler", name: "Topicler", domain: "topicler.com" }],
  },
};
