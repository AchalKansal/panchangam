# Panchangam

A fully **offline** Hindu Panchangam (almanac) app for Android. All astronomical
calculations — tithi, nakshatra, yoga, karana, vara, and daily auspicious/inauspicious
timings — are computed on-device with no network access required.

## Features

- **Today** — current tithi, nakshatra, yoga, karana, vara, paksha and samvat at a glance
- **Timings** — sunrise/sunset, Rahu Kalam, Yamaganda, Gulika Kalam, abhijit muhurta and more
- **Calendar** — browse the panchanga for any date
- **Festivals & Vrats** — upcoming festivals and fasting days
- **Daily notification** — optional morning notification with the day's panchanga
- **Home-screen widget** — today's panchanga on your launcher
- **Share** — export the day's details as an image
- **Multiple cities** — location-aware calculations for 70+ Indian cities
- **Themes** — saffron, dark and forest

## Tech

- Native Android (Java), `minSdk 24` / `targetSdk 35`, compiled with Java 21
- UI rendered in a `WebView` (HTML/CSS/JS in `panchangam-app/src/main/assets/`)
- Astronomical engine lives in `astro.js` / `data.js`, with a Java port
  (`PanchangamCompute.java`) used for background notifications and the widget
- No third-party services — `androidx.core` is the only runtime dependency

## Project structure

```
panchangam-app/
  src/main/
    assets/        WebView UI + JS astronomy engine (app.js, astro.js, data.js)
    java/.../      MainActivity, widget, boot & notification receivers, Java compute port
    res/           icons, layouts, strings
generate_assets.py   regenerates launcher icons + Play Store graphics
store-assets/        Play Store icon and feature graphic
```

## Building

```bash
# Debug build
./gradlew :panchangam-app:assembleDebug

# Release bundle (.aab) — requires signing config (see below)
./gradlew :panchangam-app:bundleRelease
```

### Signing

Release builds are signed via a `keystore.properties` file in the project root
(intentionally **not** committed). Create it from this template and point it at your
own keystore:

```properties
storeFile=../my-release-key.jks
storePassword=********
keyAlias=********
keyPassword=********
```

If `keystore.properties` is absent, the release build still works but is left unsigned.

## License

No license specified yet.
