# Pro Home-Screen Widgets — Implementation Plan

Native home-screen widgets (iOS WidgetKit + Android App Widgets) as a **Pro-plan**
feature for TheCrypto.wiki. Data areas: **Portfolio**, **Market sentiment**,
**Editorial content**.

- App: Expo (prebuild / bare native dirs committed), `newArchEnabled: true`
- Bundle id (both platforms): `com.shadev.thecryptowiki`
- Pro state source: `RevenueCatContext` (`isPro`)
- Backend: Firebase Functions v2 (already deployed for push)

---

## 1. Widget catalog

| # | Widget | Data area | iOS sizes | Android | Needs backend? |
|---|--------|-----------|-----------|---------|----------------|
| 1 | **Portfolio Value** | Portfolio | S, M | 2x2, 4x2 | No (local data) |
| 2 | **Fear & Greed Index** | Sentiment | S (2x2) | 2x2 | Yes (cache fn) |
| 3 | **Latest Post** | Editorial | S (2x2) | 2x2 | Yes (content feed) |
| 4 | **Latest Exchange** | Editorial | S (2x2) | 2x2 | Yes (content feed) |
| 5 | **Latest OG** | Editorial | S (2x2) | 2x2 | Yes (content feed) |
| 6 | **Crypto Heatmap** | Market | M + L (wide/4x4) | 4x2 resizable | Yes (heatmap fn) |

The **Crypto Heatmap** shows the top coins colored green/red by 24h change (the
website embeds CoinGecko's treemap, which can't be embedded in a home-screen widget).
`getWidgetHeatmap` returns CoinGecko's top-20 by market cap (symbol, marketCap, 24h
change), 30-min shared cache. It was first built as a market-cap treemap, but BTC's
~55% dominance squeezed the small-cap tail into unreadable slivers. Final design is a
**BTC-hero layout**: BTC is a large block on the left (~45% width, full height) and
the remaining coins sit in a readable 2-column grid on the right — keeps BTC visually
dominant (like the website) while every ticker + % stays legible. iOS: systemMedium
(BTC + 4) + systemLarge (BTC + 10); Android: resizable 4x2 (BTC + 4). Cells colored
green/red by 24h change. **Not offered as 2x2** — needs area to fit readable cells.

The **Fear & Greed** widget mirrors the website's `FearAndGreedIndex` component:
smiley + gradient background + black text, using the same 5 bands
(≤20 Extreme Fear 😱 … >80 Extreme Greed 😁). A **Market Snapshot** widget was
built and then removed on request; `getWidgetData` was trimmed to fetch **only** the
alternative.me Fear & Greed source (no more CoinGecko dominance/mcap/BTC-price calls),
and its type is now `FearGreedData` (cache doc `widgetCache/feargreed`).

Content details:
- **Portfolio Value** — total value, 24h change %, total P&L (color-coded). Locked
  state for non-Pro / empty state when no holdings.
- **Fear & Greed** — numeric value + label (Extreme Fear → Extreme Greed) + gauge.
- **Market Snapshot** — BTC dominance %, total market cap, 24h direction arrow.
- **Latest Post** — newest article title + thumbnail; taps deep-link into Posts tab.
- **OG Quote of the Day** — rotating quote + attribution.
- **Glossary Term of the Day** — term + one-line definition.

---

## 2. Pro gating model

A home-screen widget renders even when the app is closed or a subscription lapses,
so it **cannot be hard-gated** behind the paywall. Model:

- App writes `isPro` into the shared store on every RevenueCat update.
- Widget reads `isPro`:
  - `true` → render real data.
  - `false` → render **"Upgrade to Pro" locked state** that deep-links to the paywall
    (`TheCrypto.wiki://paywall`).
- Non-Pro users can still *add* the widget (locked state) → acts as a conversion surface.

---

## 3. Architecture & data flow

```
Third-party APIs            Firebase Function (cache)         Devices
─────────────────           ─────────────────────────        ───────────────────────
Binance REST         ┐                                   ┌─> App (JS) ──┐
CoinGecko REST       ├──>  getWidgetData (onRequest,     │              ├─> Shared store
alternative.me (F&G) ┘     cached ~10 min via Firestore) ┘              │   (App Group /
Website content ─────────> getWidgetContent ──────────────────────────>│    SharedPrefs)
                                                                        │        │
                                                          Widget ───────┘        ▼
                                                       (reads shared store)  Native widget UI
```

**Why a Firebase cache function** (not each widget hitting CoinGecko directly):
- CoinGecko free tier rate limits (~10–30 req/min) — thousands of widgets would trip it.
- Keeps API keys server-side, out of the shipped widget binary.
- Centralizes CoinGecko attribution/ToS compliance.
- One cached fetch fans out to all users.

**Two refresh paths into the shared store:**
1. **App-driven** — app fetches on foreground / portfolio change, writes snapshot.
   Portfolio is local so this path always has fresh portfolio data.
2. **Widget-driven** — timeline provider (iOS) / WorkManager (Android) fetches
   `getWidgetData` + `getWidgetContent` directly a few times/day, so widgets update
   even when the app is never opened.

**Refresh cadence** (respect WidgetKit's ~40–70 updates/day budget):
- Portfolio & market: every ~15–30 min.
- Editorial: 1–2×/day.

---

## 4. Backend: new Firebase Functions

Add to `functions/src/`:

- **`getWidgetData`** (`onRequest`, GET) → JSON:
  ```json
  {
    "fearGreed": { "value": 62, "label": "Greed" },
    "btcDominance": 54.2,
    "totalMarketCap": 2350000000000,
    "marketChange24h": 1.8,
    "updatedAt": 1720099200
  }
  ```
  Fetches CoinGecko `/global` + alternative.me F&G, caches result in a Firestore doc
  (`widgetCache/market`) with a ~10 min TTL; serves the cached doc.

- **`getWidgetContent`** (`onRequest`, GET) → JSON:
  ```json
  {
    "latestPost": { "title": "...", "image": "...", "url": "...", "slug": "..." },
    "ogQuote": { "quote": "...", "author": "..." },
    "glossaryTerm": { "term": "...", "definition": "..." },
    "updatedAt": 1720099200
  }
  ```
  Sourced from thecrypto.wiki (see open question #2 on the content feed).

Both reuse the existing `firebase-admin` + Firestore setup already in
`functions/src/index.ts`.

---

## 5. Native tech stack

### iOS — WidgetKit
- **`@bacons/apple-targets`** Expo config plugin to add a Widget Extension target
  (SwiftUI) during prebuild.
- **App Group** `group.com.shadev.thecryptowiki` shared between app and widget for the
  data snapshot (written to a `UserDefaults(suiteName:)`).
- Widgets authored in **SwiftUI**; `TimelineProvider` reads the shared snapshot (and
  optionally fetches `getWidgetData`/`getWidgetContent`).

### Android — App Widgets
- **`react-native-android-widget`** — author widgets in JSX/React, `requestWidgetUpdate`
  from JS, background updates via its task handler / WorkManager.
- Shared data via SharedPreferences (the library manages the bridge).

### Writing the snapshot from JS (shared store)
- Android: handled by `react-native-android-widget`.
- iOS: write to the App Group `UserDefaults` via a small native module / config plugin
  (candidate: `react-native-shared-group-preferences` or a thin custom Expo module).
  **Exact package to be validated in the Phase 1 spike.**

### Deep linking
- Reuse existing scheme `TheCrypto.wiki://`. Add routes: `/paywall`, `/portfolio`,
  `/posts?slug=...`. Widget tap → deep link → `expo-router` handles navigation.

---

## 6. Implementation phases

### Phase 0 — Native spike (de-risk)
- Add `@bacons/apple-targets` + `react-native-android-widget`, prebuild.
- Ship a hello-world widget on both platforms reading one hardcoded string from the
  shared store. Confirm EAS build + App Group entitlement + Android manifest all work.
- **Exit criteria:** a static widget renders on both a real iOS and Android device via EAS.

### Phase 1 — Portfolio Value widget (no backend)
- Define shared snapshot schema + JS writer (`utils/widgetBridge.ts`).
- Write portfolio totals + `isPro` to the shared store whenever portfolio or RevenueCat
  state changes.
- Build SwiftUI + Android widget UIs (real, locked, empty states).
- Deep link to `/portfolio`.
- **Exit criteria:** installed widget shows live portfolio value; non-Pro shows locked state.

### Phase 2 — Market sentiment widgets
- Implement `getWidgetData` Firebase function + Firestore cache.
- App and widget timeline fetch it; write into shared store.
- Build Fear & Greed + Market Snapshot widgets (both platforms).
- **Exit criteria:** both widgets update when app is closed via timeline/WorkManager.

### Phase 3 — Editorial widgets
- Resolve content feed source (open question #2), implement `getWidgetContent`.
- Build Latest Post / OG Quote / Glossary Term widgets.
- Deep links into the relevant tabs.

### Phase 4 — Polish & release
- Multiple sizes, Android resizing, dark-mode styling to match `Colors.ts`.
- Refresh-budget tuning, error/stale states.
- Widget gallery preview art + descriptions.
- Store metadata / screenshots highlighting Pro widgets.

---

## 7. Files likely touched / added

- `app.json` — add `@bacons/apple-targets` + `react-native-android-widget` plugins,
  App Group entitlement, widget config.
- `ios/` — new Widget Extension target (SwiftUI files).
- `android/` — widget provider + layouts (via library).
- `utils/widgetBridge.ts` — JS → shared-store writer.
- `contexts/PortfolioContext.tsx`, `RevenueCatContext.tsx` — call the bridge on change.
- `functions/src/index.ts` (or new modules) — `getWidgetData`, `getWidgetContent`.
- `app/_layout.tsx` — deep-link routes (`/paywall`).

---

## 8. Open questions / decisions

1. **Prebuild regeneration** — adding native widget targets requires config plugins +
   regenerated `ios/`/`android/`. Confirmed acceptable? (Required for native widgets.)
2. **Editorial content feed** — does thecrypto.wiki expose JSON for latest post / OG /
   glossary, or do we add an endpoint / Firebase-hosted feed?
3. **Locked-widget UX** — confirm non-Pro users see an "Upgrade to Pro" placeholder
   rather than the widget being hidden.
4. **Min OS targets** — WidgetKit needs iOS 14+; confirm Android minSdk supports the
   chosen widget library.

---

## 9. As built (2026-07-04)

Five widgets are implemented for both platforms: **Portfolio Value** (free) plus four
Pro-only widgets — **Fear & Greed**, **Latest Post**, **Latest Exchange**,
**Latest OG** (non-Pro users can add them but see an "Upgrade to Pro" locked state —
gallery labels/descriptions say "(Pro)"). The three "Latest ___" widgets are small
2x2 cards with a small thumbnail + title, sharing one `getWidgetContent` payload.
Thumbnails go through the site's Next.js image optimizer (`/_next/image?...&w=128`),
so they are ~1-8 KB — fetched device-side (Android `ImageWidget` takes the URL
directly; iOS fetches the bytes in the timeline provider), $0 Firebase, no memory
risk. `widgets/types.ts` + `Shared.swift` build the thumbnail URL.
Fear & Greed is a small 2x2 that mirrors the website's smiley + gradient design. A
Market Snapshot widget was built then removed on request. The drone-app reference repo
contained no widget code, so the standard Expo-native approach below was used.

**Code map**
- `utils/widgetBridge.ts` — writes `{ isPro, portfolio, updatedAt }` snapshot to
  AsyncStorage (Android) + App Group UserDefaults via `ExtensionStorage` (iOS),
  then triggers widget re-renders. Called from `PortfolioContext` (on summary
  change) and `RevenueCatContext` (on isPro change).
- `widgets/` — Android widget UIs (react-native-android-widget JSX), render
  dispatcher (`renderWidget.tsx`, enforces Pro gating), task handler, formatting.
- `index.ts` (root, new entry point; `package.json` `main` updated) — imports
  `expo-router/entry` and registers the Android widget task handler.
- `targets/widgets/` — iOS WidgetKit extension (SwiftUI, iOS 17+):
  `expo-target.config.js`, `Shared.swift`, `PortfolioWidget.swift`,
  `MarketWidgets.swift`, `LatestPostWidget.swift`, `index.swift`.
- `functions/src/widgets.ts` — `getWidgetData` (F&G + CoinGecko global + BTC price,
  10-min Firestore cache) and `getWidgetContent` (latest post scraped from
  the newest-first `/posts` listing + OG tags, 6-h cache). Exported from `index.ts`.
- `app.json` — apple-targets + android-widget plugins, `appleTeamId`, App Group
  entitlement.

**Data flow**: Portfolio & isPro come from the app-written snapshot. Market/content
data is fetched by the widgets themselves (iOS timeline provider / Android headless
task) from the Firebase endpoints, so they update with the app closed.

**Refresh cadence (tuned for Blaze free-tier cost, 2026-07-05)**:
- Portfolio: 30 min (local data, no backend cost).
- Fear & Greed + Market Snapshot: 1 h (F&G updates daily; shared `getWidgetData`,
  1 h Firestore cache).
- Latest Post: 6 h (matches `getWidgetContent` 6 h cache).
- Shared Firestore cache means external APIs are hit at most ~24×/day (market) and
  ~4×/day (content) *in total*, independent of user count.

**Deploy & build steps**
1. `cd functions && npm run deploy` — deploys `getWidgetData` / `getWidgetContent`.
   Then verify the URLs used in `utils/widgetBridge.ts` and
   `targets/widgets/Shared.swift`
   (`https://us-central1-the-crypto-wiki.cloudfunctions.net/getwidgetdata|getwidgetcontent`)
   respond; if Firebase gives different URLs (run.app style), update both files.
2. Create App Group `group.com.shadev.thecryptowiki` in the Apple Developer portal
   (EAS can also do this automatically during credential sync).
3. `npx expo prebuild --clean` — regenerates `ios/`/`android/` with the widget
   extension and Android receivers.
4. Build with EAS or `expo run:ios` / `expo run:android` (widgets don't work in Expo Go).

**Known limitations / follow-ups**
- The three Pro widget deep links currently open the app root or portfolio/posts
  tabs; a dedicated `/paywall` deep-link route could open the paywall directly.
- Latest-post detection relies on the `/posts` page being ordered newest-first
  (sitemap lastmod dates are all identical build timestamps).
- Widget preview images in the pickers use defaults; custom `previewImage` assets
  can be added later.

## 10. Risks

- **Refresh budget** — iOS limits widget updates; frequent price refresh not guaranteed.
  Mitigation: cache endpoint + conservative timeline; label "as of HH:MM".
- **CoinGecko limits / ToS** — mitigated by server-side cache + attribution.
- **Two native codebases** — iOS SwiftUI and Android widgets are authored separately;
  no shared UI. Budget for both per widget.
- **EAS build config** — App Group entitlements + extension signing add build complexity;
  de-risked in Phase 0.
