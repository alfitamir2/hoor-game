# Android release

This project uses a Trusted Web Activity (TWA). The Android package must open the same HTTPS origin that serves the verified production web build.

## Build

Requirements: Node.js 20+, Bubblewrap CLI, Android SDK/build-tools, JDK 17 or 21, Google Play Console, and a release keystore stored outside Git.

Generate a key outside the repository:

```sh
keytool -genkeypair -v -keystore release-keystore.jks \
  -alias hoor-release -keyalg RSA -keysize 4096 -validity 10000
```

Read the certificate fingerprint:

```sh
keytool -list -v -keystore release-keystore.jks -alias hoor-release
```

Copy the SHA-256 fingerprint into both:
- `android/twa-manifest.json` → `fingerprints`
- `android/assetlinks.json.template` → `sha256_cert_fingerprints`

Keep the keystore and passwords outside Git. Never commit signing keys or passwords.

Then build:

```sh
npx @bubblewrap/cli init --manifest ./twa-manifest.json
npx @bubblewrap/cli build
```

For Play Store distribution upload the signed `.aab`, not only the APK.

## Digital Asset Links

Deploy the completed template as `/.well-known/assetlinks.json` on the production host after replacing the placeholder with the final release certificate fingerprint. Do not deploy the template unchanged.

Verify the live file:

```sh
curl --fail --silent --show-error https://hoor-game.lovable.app/.well-known/assetlinks.json
```

Optionally set `HOOR_RELEASE_CERT_SHA256` while running `npm run verify:release`; the verifier checks it against the TWA manifest.

## Final checks

```sh
bun install --frozen-lockfile
bun run test
bun run lint
bun run build
bun run verify:release
```

Complete Play Console Data safety, content rating, child-directed audience, privacy policy, and Families policy requirements before submission. These legal and publisher-account requirements must be reviewed by the publisher.
