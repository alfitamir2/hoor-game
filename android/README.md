# Android release

This project uses a Trusted Web Activity (TWA). The Android package must open the same HTTPS origin that serves the verified production web build.

## Build

Requirements: Node.js 20+, Bubblewrap CLI, Android SDK/build-tools, JDK 17 or 21, Google Play Console, and a new release keystore stored outside Git.

Generate a key outside the repository:

```sh
keytool -genkeypair -v -keystore release-keystore.jks \
  -alias hoor-release -keyalg RSA -keysize 4096 -validity 10000
```

Then build:

```sh
npx @bubblewrap/cli init --manifest ./twa-manifest.json
npx @bubblewrap/cli build
```

For Play Store distribution upload the signed `.aab`, not only the APK.

## Digital Asset Links

Deploy `assetlinks.json.template` as `/.well-known/assetlinks.json` on the production host after replacing `REPLACE_WITH_RELEASE_CERTIFICATE_SHA256` with the final release certificate fingerprint. Do not publish a placeholder fingerprint.

```sh
curl --fail --silent --show-error https://hoor-game.lovable.app/.well-known/assetlinks.json
```

Before upload, run:

```sh
pnpm install
pnpm test
pnpm run build
pnpm run verify:release
```

Complete Play Console Data safety, content rating, child-directed audience, privacy policy, and Families policy requirements before submission.
