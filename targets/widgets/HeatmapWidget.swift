import SwiftUI
import WidgetKit

// MARK: - Helpers

func changeColor(_ change: Double) -> Color {
    if change >= 3 { return Color(hex: "2e7d32") }
    if change >= 0 { return Color(hex: "4caf50") }
    if change > -3 { return Color(hex: "ef5350") }
    return Color(hex: "c62828")
}

func formatChange(_ change: Double) -> String {
    let sign = change > 0 ? "+" : ""
    return "\(sign)\(String(format: "%.2f", change))%"
}

// MARK: - Grid views

struct HeatmapCell: View {
    let coin: HeatmapCoin?

    var body: some View {
        if let coin = coin {
            VStack(spacing: 1) {
                Text(coin.symbol)
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(.white)
                    .lineLimit(1)
                    .minimumScaleFactor(0.6)
                Text(formatChange(coin.change24h))
                    .font(.system(size: 10))
                    .foregroundColor(.white)
                    .lineLimit(1)
                    .minimumScaleFactor(0.6)
            }
            .padding(2)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(changeColor(coin.change24h))
            .cornerRadius(6)
        } else {
            Color.clear.frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }
}

struct HeroCell: View {
    let coin: HeatmapCoin

    var body: some View {
        VStack(spacing: 2) {
            Text(coin.symbol)
                .font(.system(size: 26, weight: .bold))
                .foregroundColor(.white)
                .lineLimit(1)
                .minimumScaleFactor(0.6)
            Text(formatChange(coin.change24h))
                .font(.system(size: 15))
                .foregroundColor(.white)
                .lineLimit(1)
                .minimumScaleFactor(0.6)
        }
        .padding(4)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(changeColor(coin.change24h))
        .cornerRadius(8)
    }
}

// BTC hero block on the left (~45% width), remaining coins in a grid on the right.
struct HeatmapHeroLayout: View {
    let coins: [HeatmapCoin]
    let restCount: Int
    let columns: Int

    var body: some View {
        let hero = coins.first
        let rest = Array(coins.dropFirst().prefix(restCount))
        let rows = stride(from: 0, to: rest.count, by: columns).map {
            Array(rest[$0..<min($0 + columns, rest.count)])
        }

        GeometryReader { geo in
            HStack(spacing: 3) {
                if let hero = hero {
                    HeroCell(coin: hero)
                        .frame(width: (geo.size.width - 3) * 0.45)
                }
                VStack(spacing: 3) {
                    ForEach(rows.indices, id: \.self) { r in
                        HStack(spacing: 3) {
                            ForEach(0..<columns, id: \.self) { c in
                                HeatmapCell(coin: c < rows[r].count ? rows[r][c] : nil)
                            }
                        }
                    }
                }
            }
        }
    }
}

// MARK: - Timeline

struct HeatmapEntry: TimelineEntry {
    let date: Date
    let isPro: Bool
    let data: HeatmapData?
}

struct HeatmapProvider: TimelineProvider {
    private func sample() -> HeatmapData {
        HeatmapData(coins: [
            HeatmapCoin(symbol: "BTC", marketCap: 1_270_000_000_000, change24h: 1.57),
            HeatmapCoin(symbol: "ETH", marketCap: 215_000_000_000, change24h: 1.01),
            HeatmapCoin(symbol: "USDT", marketCap: 184_000_000_000, change24h: 0.02),
            HeatmapCoin(symbol: "BNB", marketCap: 78_000_000_000, change24h: -0.28),
            HeatmapCoin(symbol: "XRP", marketCap: 71_000_000_000, change24h: 0.20),
            HeatmapCoin(symbol: "SOL", marketCap: 47_000_000_000, change24h: 0.90),
            HeatmapCoin(symbol: "USDC", marketCap: 73_000_000_000, change24h: 0.01),
            HeatmapCoin(symbol: "TRX", marketCap: 31_000_000_000, change24h: 0.18),
            HeatmapCoin(symbol: "DOGE", marketCap: 24_000_000_000, change24h: -1.20),
            HeatmapCoin(symbol: "ADA", marketCap: 21_000_000_000, change24h: -0.44),
            HeatmapCoin(symbol: "LINK", marketCap: 14_000_000_000, change24h: 1.27),
            HeatmapCoin(symbol: "XLM", marketCap: 12_000_000_000, change24h: -0.42),
        ], updatedAt: Date().timeIntervalSince1970 * 1000)
    }

    func placeholder(in context: Context) -> HeatmapEntry {
        HeatmapEntry(date: Date(), isPro: true, data: sample())
    }

    func getSnapshot(in context: Context, completion: @escaping (HeatmapEntry) -> Void) {
        completion(HeatmapEntry(date: Date(), isPro: true, data: sample()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<HeatmapEntry>) -> Void) {
        let snapshot = AppSnapshot.load()
        let refresh = Calendar.current.date(byAdding: .minute, value: 30, to: Date())!

        guard snapshot.isPro else {
            let entry = HeatmapEntry(date: Date(), isPro: false, data: nil)
            completion(Timeline(entries: [entry], policy: .after(refresh)))
            return
        }

        Task {
            let data = await WidgetAPI.fetch(HeatmapData.self, from: WidgetConstants.heatmapURL)
            let entry = HeatmapEntry(date: Date(), isPro: true, data: data)
            completion(Timeline(entries: [entry], policy: .after(refresh)))
        }
    }
}

struct HeatmapWidgetView: View {
    let entry: HeatmapEntry
    @Environment(\.widgetFamily) var family

    var body: some View {
        Group {
            if !entry.isPro {
                LockedView(widgetLabel: "Crypto Heatmap")
            } else if let data = entry.data, !data.coins.isEmpty {
                // BTC hero + a 2-col grid. Medium: BTC + 4. Large: BTC + 10.
                let restCount = family == .systemLarge ? 10 : 4
                HeatmapHeroLayout(coins: data.coins, restCount: restCount, columns: 2)
            } else {
                NoDataView()
            }
        }
        .widgetURL(URL(string: "TheCrypto.wiki://tools"))
        .widgetBackground()
    }
}

struct HeatmapWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "HeatmapWidget", provider: HeatmapProvider()) { entry in
            HeatmapWidgetView(entry: entry)
        }
        .configurationDisplayName("Crypto Heatmap (Pro)")
        .description("Top coins by market cap, colored by 24h change. Requires Pro - upgrade inside the app.")
        .supportedFamilies([.systemMedium, .systemLarge])
    }
}
