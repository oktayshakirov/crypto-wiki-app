import SwiftUI
import WidgetKit

struct FearGreedEntry: TimelineEntry {
    let date: Date
    let isPro: Bool
    let market: FearGreedData?
}

struct FearGreedProvider: TimelineProvider {
    func placeholder(in context: Context) -> FearGreedEntry {
        FearGreedEntry(
            date: Date(),
            isPro: true,
            market: FearGreedData(
                fearGreed: FearGreed(value: 23, label: "Extreme Fear"),
                updatedAt: Date().timeIntervalSince1970 * 1000
            )
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (FearGreedEntry) -> Void) {
        completion(placeholder(in: context))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<FearGreedEntry>) -> Void) {
        let snapshot = AppSnapshot.load()
        let refresh = Calendar.current.date(byAdding: .hour, value: 1, to: Date())!

        guard snapshot.isPro else {
            let entry = FearGreedEntry(date: Date(), isPro: false, market: nil)
            completion(Timeline(entries: [entry], policy: .after(refresh)))
            return
        }

        Task {
            let market = await WidgetAPI.fetch(FearGreedData.self, from: WidgetConstants.marketURL)
            let entry = FearGreedEntry(date: Date(), isPro: true, market: market)
            completion(Timeline(entries: [entry], policy: .after(refresh)))
        }
    }
}

struct FearGreedWidgetView: View {
    let entry: FearGreedEntry

    var body: some View {
        if !entry.isPro {
            LockedView(widgetLabel: "Fear & Greed")
                .widgetBackground()
        } else if let market = entry.market {
            let band = fearGreedBand(market.fearGreed.value)
            VStack(spacing: 2) {
                Text(band.smiley)
                    .font(.system(size: 42))
                Text("\(market.fearGreed.value)")
                    .font(.system(size: 32, weight: .bold))
                    .foregroundColor(.black)
                Text(band.label)
                    .font(.system(size: 13, weight: .bold))
                    .foregroundColor(.black)
                    .multilineTextAlignment(.center)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .containerBackground(for: .widget) {
                LinearGradient(
                    gradient: Gradient(colors: [band.from, band.to]),
                    startPoint: .leading,
                    endPoint: .trailing
                )
            }
        } else {
            NoDataView()
                .widgetBackground()
        }
    }
}

struct FearGreedWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "FearGreedWidget", provider: FearGreedProvider()) { entry in
            FearGreedWidgetView(entry: entry)
        }
        .configurationDisplayName("Fear & Greed (Pro)")
        .description("Crypto Fear & Greed Index. Requires Pro - upgrade inside the app.")
        .supportedFamilies([.systemSmall])
    }
}
