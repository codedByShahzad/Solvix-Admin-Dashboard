#!/usr/bin/env node
/**
 * READ-ONLY access diagnostic for Solvix.
 *
 *   npm run diagnose -- you@example.com           # who is this user, what can they see
 *   npm run diagnose -- you@example.com --check-password   # also verify a password (hidden prompt)
 *   npm run diagnose                              # overview: every website and its owner
 *
 * Uses MONGODB_URI from .env. Never writes to the database, never prints
 * password hashes, API keys or secrets. The password (if checked) is read from
 * a hidden prompt and is not stored or logged.
 */
require("dotenv").config({ quiet: true });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const readline = require("readline");

const args = process.argv.slice(2);
const emailArg = args.find((a) => !a.startsWith("--"));
const checkPassword = args.includes("--check-password");

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const id = (v) => (v ? String(v._id ?? v) : "(missing)");

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => {
      if (s.includes(question)) rl.output.write(s);
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}

(async () => {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not set in .env");
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const users = db.collection("users");
  const websites = db.collection("websites");
  const blogs = db.collection("blogs");
  const integrations = db.collection("websiteintegrations");

  const userById = new Map((await users.find({}, { projection: { password: 0 } }).toArray()).map((u) => [String(u._id), u]));
  const allSites = await websites.find({}).toArray();
  const label = (uid) => {
    const u = userById.get(String(uid));
    return u ? `${u.name} <${u.email}> [${u.role}] ${String(u._id)}` : `NO SUCH USER (${id(uid)})`;
  };

  console.log(`\nDatabase: ${mongoose.connection.name}   users: ${userById.size}   websites: ${allSites.length}   blogs: ${await blogs.countDocuments()}`);

  console.log("\n── Websites and owners ─────────────────────────────");
  for (const w of allSites) {
    const nBlogs = await blogs.countDocuments({ website: w._id });
    const integ = await integrations.findOne({ websiteId: w._id }, { projection: { status: 1 } });
    console.log(`• ${w.name} (${w.domain})  id=${w._id}`);
    console.log(`    owner:   ${w.owner ? label(w.owner) : "(missing — nobody can see this website)"}`);
    console.log(`    editors: ${(w.editors || []).length ? w.editors.map(label).join(", ") : "none"}`);
    console.log(`    blogs: ${nBlogs}   integration: ${integ ? integ.status : "none"}`);
  }

  if (!emailArg) {
    console.log("\nTip: pass an email to see exactly what that account can access.\n");
    return;
  }

  const email = emailArg.trim().toLowerCase();
  console.log(`\n── Account lookup for "${email}" ─────────────────────`);
  const exact = await users.find({ email }).toArray();
  const loose = await users.find({ email: { $regex: `^\\s*${esc(email)}\\s*$`, $options: "i" } }).toArray();
  console.log(`exact (normalised) match: ${exact.length}   case/space-insensitive match: ${loose.length}`);
  if (!loose.length) {
    console.log("→ No user with this email exists in THIS database. Login will always say \"Invalid email or password\".");
    console.log("  Check MONGODB_URI (cluster + database name) and the exact email you registered with.\n");
    return;
  }
  for (const u of loose) {
    const hashOk = typeof u.password === "string" && /^\$2[aby]\$\d{2}\$.{53}$/.test(u.password);
    console.log(`• ${u.name}  id=${u._id}  role=${u.role}  isActive=${u.isActive !== false}`);
    console.log(`    stored email: ${JSON.stringify(u.email)}${u.email !== email ? "  ← not normalised (fixed login handles this)" : ""}`);
    console.log(`    password field is a bcrypt hash: ${hashOk ? "yes" : "NO — this account cannot log in with bcrypt"}`);
    console.log(`    created: ${u.createdAt ? new Date(u.createdAt).toISOString() : "?"}   updated: ${u.updatedAt ? new Date(u.updatedAt).toISOString() : "?"}`);
  }

  const user = exact[0] || loose[0];
  if (checkPassword) {
    const pw = await askHidden("Password to verify (hidden): ");
    const ok = typeof user.password === "string" && (await bcrypt.compare(pw, user.password));
    console.log(`bcrypt.compare result: ${ok ? "MATCH — this password is correct for this account" : "NO MATCH"}`);
  }

  const filter = user.role === "admin" ? { owner: user._id } : { editors: user._id };
  const visible = await websites.find(filter).toArray();
  console.log(`\nThis ${user.role} can access ${visible.length} website(s)${user.role === "admin" ? " (as owner)" : " (as assigned editor)"}:`);
  for (const w of visible) console.log(`  - ${w.name} (${w.domain}), blogs: ${await blogs.countDocuments({ website: w._id })}`);
  if (!visible.length) {
    console.log("  (none) — the Websites page will correctly show \"No websites yet\" for this account.");
    if (user.role === "admin" && allSites.length) {
      console.log("  If one of the websites above should belong to this account, run:");
      console.log(`    npm run transfer-owner -- <websiteId> ${email}          (dry run)`);
      console.log(`    npm run transfer-owner -- <websiteId> ${email} --apply  (make the change)`);
    }
  }
  console.log();
})()
  .catch((e) => {
    console.error("Diagnostic failed:", e.message.replace(/\/\/[^@]+@/, "//***@"));
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
