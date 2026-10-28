import { readFile } from "node:fs/promises";

const files = ["android/twa-manifest.json", "public/Hoor-Plays-Learns-Android.html"];
const contents = await Promise.all(files.map((file) => readFile(file, "utf8")));
const text = contents.join("\n");
const manifest = JSON.parse(contents[0]);

const forbidden = [
  ["placeholder production host", /REPLACE_WITH_VERIFIED_PRODUCTION_HOST/],
  ["placeholder certificate fingerprint in a built asset", /REPLACE_WITH_RELEASE_CERTIFICATE_SHA256/],
  ["Google client ID placeholder", /YOUR_GOOGLE_CLIENT_ID/],
  ["Firebase cloud-sync claim", /Firebase Firestore/],
  ["private Supabase secret key", /sb_secret_[A-Za-z0-9_-]+/],
];

const failures = forbidden.filter(([, pattern]) => pattern.test(text)).map(([name]) => name);
if (failures.length > 0) {
  console.error("Release verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

const httpsFields = ["webManifestUrl", "fullScopeUrl", "iconUrl", "maskableIconUrl"];
if (httpsFields.some((field) => typeof manifest[field] !== "string" || !manifest[field].startsWith("https://"))) {
  console.error("Release verification failed: all TWA asset and scope URLs must use HTTPS.");
  process.exit(1);
}

console.log("Release verification passed for the checked-in production inputs.");
