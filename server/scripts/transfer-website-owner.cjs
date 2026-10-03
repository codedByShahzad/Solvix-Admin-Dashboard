#!/usr/bin/env node
/**
 * Re-assign a website's OWNER to an existing admin account.
 *
 *   npm run transfer-owner -- <websiteId> <adminEmail>            # dry run, changes nothing
 *   npm run transfer-owner -- <websiteId> <adminEmail> --apply    # performs the change
 *
 * Use this only when a website is owned by an account that cannot sign in
 * (or by a user that no longer exists), so PATCH /websites/:id/transfer-ownership
 * cannot be called by the current owner.
 *
 * It changes exactly one field — website.owner. Blogs, media, editors,
 * integrations and API keys/secrets are untouched, so the external website
 * (e.g. Topicler) keeps working with the same credentials.
 */
require("dotenv").config({ quiet: true });
const mongoose = require("mongoose");

const [websiteId, rawEmail] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const apply = process.argv.includes("--apply");
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

(async () => {
  if (!websiteId || !rawEmail) {
    console.log("Usage: npm run transfer-owner -- <websiteId> <adminEmail> [--apply]");
    process.exitCode = 1;
    return;
  }
  if (!mongoose.Types.ObjectId.isValid(websiteId)) throw new Error("websiteId is not a valid ObjectId");
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not set in .env");

  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const email = rawEmail.trim().toLowerCase();

  const website = await db.collection("websites").findOne({ _id: new mongoose.Types.ObjectId(websiteId) });
  if (!website) throw new Error("Website not found");

  const matches = await db
    .collection("users")
    .find({ email: { $regex: `^\\s*${esc(email)}\\s*$`, $options: "i" } }, { projection: { password: 0 } })
    .toArray();
  if (matches.length !== 1) throw new Error(`Expected exactly one user for ${email}, found ${matches.length}`);
  const user = matches[0];
  if (user.role !== "admin") throw new Error("Only an admin can own a website");

  const current = website.owner
    ? await db.collection("users").findOne({ _id: website.owner }, { projection: { name: 1, email: 1 } })
    : null;

  console.log(`Website:       ${website.name} (${website.domain})`);
  console.log(`Current owner: ${current ? `${current.name} <${current.email}>` : website.owner ? `missing user ${website.owner}` : "(none)"}`);
  console.log(`New owner:     ${user.name} <${user.email}>`);

  if (website.owner && String(website.owner) === String(user._id)) {
    console.log("Nothing to do — this admin already owns the website.");
    return;
  }
  if (!apply) {
    console.log("\nDry run only. Re-run with --apply to make this change.");
    return;
  }

  const res = await db
    .collection("websites")
    .updateOne({ _id: website._id }, { $set: { owner: user._id, updatedAt: new Date() } });
  console.log(`\nDone — ${res.modifiedCount} website updated. Nothing else was changed.`);
})()
  .catch((e) => {
    console.error("Transfer failed:", e.message.replace(/\/\/[^@]+@/, "//***@"));
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
