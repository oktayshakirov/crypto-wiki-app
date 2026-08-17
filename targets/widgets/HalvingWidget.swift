import SwiftUI
import WidgetKit

// Bitcoin halving countdown, ported from the site's HalvingCountdown component
// (crypto-wiki/layouts/components/HalvingCountdown.js) and matching
// widgets/halving.ts on the Android side. Same constants, same arithmetic, so
// the two platforms and /tools/bitcoin-halving-countdown never disagree.
//
// Unlike its siblings this widget needs no Cloud Function: the only input is
// the current block height, which mempool.space serves without a key.

private let halvingInterval = 210_000
private let targetBlockMinutes = 10.0

// Block 840,000 was mined on 2024-04-20 UTC, the fourth halving.
private let knownHalvingHeight = 840_000
private let knownHalvingDate = Date(timeIntervalSince1970: 1_713_571_740) // 2024-04-20T00:09:00Z

private let tipHeightURL = "https://mempool.space/api/blocks/tip/height"

struct HalvingData {
    let height: Int
    let blocksRemaining: Int
    let days: Int
    let hours: Int
    let eta: Date
    /// How far through the current epoch, 0-100.
    let progress: Double
    let currentSubsidy: Double
    let nextSubsidy: Double
    /// True when the height is a clock estimate rather than a fetched tip.
    let estimated: Bool
}

private func subsidy(atHeight height: Int) -> Double {
    50.0 / pow(2.0, Double(height / halvingInterval))
}

func halvingData(fromHeight height: Int, estimated: Bool) -> HalvingData {
    let nextHeight = (height / halvingInterval + 1) * halvingInterval
    let blocksRemaining = nextHeight - height
    let secondsRemaining = Double(blocksRemaining) * targetBlockMinutes * 60
    let epochStart = nextHeight - halvingInterval

    return HalvingData(
        height: height,
        blocksRemaining: blocksRemaining,
        days: Int(secondsRemaining / 86_400),
        hours: Int(secondsRemaining.truncatingRemainder(dividingBy: 86_400) / 3_600),
        eta: Date().addingTimeInterval(secondsRemaining),
        progress: Double(height - epochStart) / Double(halvingInterval) * 100,
        currentSubsidy: subsidy(atHeight: height),
        nextSubsidy: subsidy(atHeight: nextHeight),
        estimated: estimated
    )
}

/// Ten-minute blocks are a target rather than a guarantee, so this drifts -
/// which is why anything built on it is flagged as an estimate.
private func heightFromClock() -> Int {
    knownHalvingHeight
        + Int(Date().timeIntervalSince(knownHalvingDate) / (targetBlockMinutes * 60))
}

/// The endpoint answers with a bare integer, not JSON.
private func fetchTipHeight() async -> Int? {
    guard let url = URL(string: tipHeightURL) else { return nil }
    do {
        let (data, response) = try await URLSession.shared.data(from: url)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200,
              let text = String(data: data, encoding: .utf8)?
                  .trimmingCharacters(in: .whitespacesAndNewlines),
              let height = Int(text)
        else { return nil }
        return height
    } catch {
        return nil
    }
}

struct HalvingEntry: TimelineEntry {
    let date: Date
    let isPro: Bool
    let halving: HalvingData
}

struct HalvingProvider: TimelineProvider {
    func placeholder(in context: Context) -> HalvingEntry {
        HalvingEntry(
            date: Date(),
            isPro: true,
            halving: halvingData(fromHeight: heightFromClock(), estimated: true)
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (HalvingEntry) -> Void) {
        completion(placeholder(in: context))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<HalvingEntry>) -> Void) {
        let snapshot = AppSnapshot.load()
        let refresh = Calendar.current.date(byAdding: .hour, value: 1, to: Date())!

        guard snapshot.isPro else {
            let entry = HalvingEntry(
                date: Date(),
                isPro: false,
                halving: halvingData(fromHeight: heightFromClock(), estimated: true)
            )
            completion(Timeline(entries: [entry], policy: .after(refresh)))
            return
        }

        Task {
            // A failed call still yields a usable countdown from the clock, so
            // there is no empty state here - only a less precise one.
            let height = await fetchTipHeight()
            let entry = HalvingEntry(
                date: Date(),
                isPro: true,
                halving: height.map { halvingData(fromHeight: $0, estimated: false) }
                    ?? halvingData(fromHeight: heightFromClock(), estimated: true)
            )
            completion(Timeline(entries: [entry], policy: .after(refresh)))
        }
    }
}

private func etaText(_ date: Date) -> String {
    let formatter = DateFormatter()
    formatter.dateFormat = "MMM d, yyyy"
    return formatter.string(from: date)
}

private func blocksText(_ blocks: Int) -> String {
    let formatter = NumberFormatter()
    formatter.numberStyle = .decimal
    return formatter.string(from: NSNumber(value: blocks)) ?? "\(blocks)"
}

/// Subsidies are exact binary fractions - 3.125, then 1.5625, then 0.78125 -
/// so they are printed at four decimals and trimmed, rather than rounded to a
/// fixed width that would turn 1.5625 into 1.563.
private func subsidyText(_ value: Double) -> String {
    var text = String(format: "%.5f", value)
    while text.hasSuffix("0") { text.removeLast() }
    if text.hasSuffix(".") { text.removeLast() }
    return text
}

/// 2x2. Only room for the number that matters, so everything else goes.
struct HalvingSmallView: View {
    let data: HalvingData

    var body: some View {
        VStack(spacing: 1) {
            Text("NEXT HALVING")
                .font(.system(size: 10))
                .kerning(1)
                .foregroundColor(WidgetConstants.gray)
            Text("\(data.days)")
                .font(.system(size: 44, weight: .bold))
                .foregroundColor(WidgetConstants.gold)
            Text(data.days == 1 ? "day to go" : "days to go")
                .font(.system(size: 12))
                .foregroundColor(.white)
            Text(data.estimated ? "estimated" : "\(blocksText(data.blocksRemaining)) blocks")
                .font(.system(size: 10))
                .foregroundColor(WidgetConstants.gray)
                .padding(.top, 3)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

/// 4x2. The extra width carries the blocks, the date, the subsidy step and a bar.
struct HalvingMediumView: View {
    let data: HalvingData

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("NEXT BITCOIN HALVING")
                    .font(.system(size: 10))
                    .kerning(1)
                    .foregroundColor(WidgetConstants.gray)
                Spacer()
                Text("\(subsidyText(data.currentSubsidy)) → \(subsidyText(data.nextSubsidy)) BTC")
                    .font(.system(size: 10))
                    .foregroundColor(WidgetConstants.gray)
            }

            HStack(alignment: .firstTextBaseline, spacing: 2) {
                Text("\(data.days)")
                    .font(.system(size: 40, weight: .bold))
                    .foregroundColor(WidgetConstants.gold)
                Text(data.days == 1 ? "day" : "days")
                    .font(.system(size: 14))
                    .foregroundColor(.white)
                Text("\(data.hours)h")
                    .font(.system(size: 14))
                    .foregroundColor(WidgetConstants.gray)
                    .padding(.leading, 6)
            }

            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(Color(white: 0.16))
                    Capsule()
                        .fill(WidgetConstants.gold)
                        .frame(width: geometry.size.width * min(max(data.progress / 100, 0.01), 1))
                }
            }
            .frame(height: 4)

            HStack {
                Text("\(blocksText(data.blocksRemaining)) blocks left")
                    .font(.system(size: 11))
                    .foregroundColor(WidgetConstants.gray)
                Spacer()
                Text(data.estimated ? "~\(etaText(data.eta)) (est.)" : "~\(etaText(data.eta))")
                    .font(.system(size: 11))
                    .foregroundColor(WidgetConstants.gray)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }
}

struct HalvingWidgetView: View {
    @Environment(\.widgetFamily) var family
    let entry: HalvingEntry

    var body: some View {
        if !entry.isPro {
            LockedView(widgetLabel: "Bitcoin Halving")
                .widgetBackground()
        } else if family == .systemMedium {
            HalvingMediumView(data: entry.halving)
                .widgetBackground()
        } else {
            HalvingSmallView(data: entry.halving)
                .widgetBackground()
        }
    }
}

struct HalvingWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "HalvingWidget", provider: HalvingProvider()) { entry in
            HalvingWidgetView(entry: entry)
        }
        .configurationDisplayName("Bitcoin Halving (Pro)")
        .description("Countdown to the next Bitcoin halving. Requires Pro - upgrade inside the app.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
