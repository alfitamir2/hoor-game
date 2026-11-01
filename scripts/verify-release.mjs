import { readFile } from "node:fs/promises";

const files = [
  "android/twa-manifest.json",
  "android/assetlinks.json.template",
  "public/Hoor-Plays-Learns-Android.html",
];
const contents = await Promise.all(files.map((file) => readFile(file, "utf8")));
const [manifestText, assetLinksTemplate, gameHtml] = contents;
const manifest = JSON.parse(manifestText);
const releaseText = contents.join("\n");

const forbidden = [
  ["placeholder production host", /REPLACE_WITH_VERIFIED_PRODUCTION_HOST/],
  ["Google client ID placeholder", /YOUR_GOOGLE_CLIENT_ID/],
  ["Firebase cloud-sync claim", /Firebase Firestore/],
  ["private Supabase secret key", /sb_secret_[A-Za-z0-9_-]+/],
];
const failures = forbidden.filter(([, pattern]) => pattern.test(releaseText)).map(([name]) => name);

if (failures.length) {
  console.error("Release verification failed:");
  for (const failure of failures) console.error("- " + failure);
  process.exit(1);
}

const httpsFields = ["webManifestUrl", "fullScopeUrl", "iconUrl", "maskableIconUrl"];
if (httpsFields.some((field) => typeof manifest[field] !== "string" || !manifest[field].startsWith("https://"))) {
  console.error("Release verification failed: all TWA asset and scope URLs must use HTTPS.");
  process.exit(1);
}

const template = JSON.parse(assetLinksTemplate);
if (
  !Array.isArray(template) ||
  template[0]?.target?.package_name !== manifest.packageId ||
  !template[0]?.target?.sha256_cert_fingerprints?.includes("REPLACE_WITH_RELEASE_CERTIFICATE_SHA256")
) {
  console.error("Release verification failed: Digital Asset Links template does not match the TWA package.");
  process.exit(1);
}

const fingerprints = Array.isArray(manifest.fingerprints) ? manifest.fingerprints : [];
const configuredFingerprint = process.env.HOOR_RELEASE_CERT_SHA256?.replace(/:/g, "").toLowerCase();
if (configuredFingerprint) {
  if (!/^[a-f0-9]{64}$/.test(configuredFingerprint)) {
    console.error("HOOR_RELEASE_CERT_SHA256 must contain exactly 64 hexadecimal characters.");
    process.exit(1);
  }
  if (!fingerprints.some((value) => String(value).replace(/:/g, "").toLowerCase() === configuredFingerprint)) {
    console.error("Release verification failed: the supplied signing fingerprint is missing from twa-manifest.json.");
    process.exit(1);
  }
} else if (!fingerprints.length) {
  console.warn("Android release is not signing-ready: add the release certificate fingerprint to twa-manifest.json and assetlinks.json.");
}

if (!gameHtml.includes("hoor_game_architect_v3")) {
  console.error("Release verification failed: production game save key is missing.");
  process.exit(1);
}

console.log("Release verification passed for checked-in production inputs.");
