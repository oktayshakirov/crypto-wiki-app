import SwiftUI
import WidgetKit

struct PortfolioEntry: TimelineEntry {
    let date: Date
    let snapshot: AppSnapshot
}

struct PortfolioProvider: TimelineProvider {
    func placeholder(in context: Context) -> PortfolioEntry {
        PortfolioEntry(
            date: Date(),
            snapshot: AppSnapshot(
                isPro: true,
                portfolio: PortfolioData(
                    totalValue: 12345.67,
                    totalProfitLoss: 1234.56,
                    totalProfitLossPercent: 11.1,
                    assetsCount: 5
                ),
                updatedAt: Date().timeIntervalSince1970 * 1000
            )
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (PortfolioEntry) -> Void) {
        // Show example data in the widget gallery preview
        if context.isPreview {
            completion(placeholder(in: context))
            return
        }
        completion(PortfolioEntry(date: Date(), snapshot: AppSnapshot.load()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<PortfolioEntry>) -> Void) {
        let entry = PortfolioEntry(date: Date(), snapshot: AppSnapshot.load())
        let refresh = Calendar.current.date(byAdding: .minute, value: 30, to: Date())!
        completion(Timeline(entries: [entry], policy: .after(refresh)))
    }
}

struct PortfolioWidgetView: View {
    let entry: PortfolioEntry

    var body: some View {
        Group {
            if let portfolio = entry.snapshot.portfolio, portfolio.assetsCount > 0 {
                VStack(alignment: .leading, spacing: 3) {
                    Text("PORTFOLIO")
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundColor(WidgetConstants.gray)
                    Text(Format.money(portfolio.totalValue))
                        .font(.system(size: 24, weight: .bold))
                        .foregroundColor(.white)
                        .minimumScaleFactor(0.6)
                        .lineLimit(1)
                    Text("\(Format.money(portfolio.totalProfitLoss)) (\(Format.percent(portfolio.totalProfitLossPercent)))")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(portfolio.totalProfitLoss >= 0 ? WidgetConstants.profit : WidgetConstants.loss)
                        .minimumScaleFactor(0.6)
                        .lineLimit(1)
                    Text("\(portfolio.assetsCount) asset\(portfolio.assetsCount == 1 ? "" : "s")")
                        .font(.system(size: 11))
                        .foregroundColor(WidgetConstants.gray)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
            } else {
                VStack(alignment: .leading, spacing: 4) {
                    Text("PORTFOLIO")
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundColor(WidgetConstants.gray)
                    Text("No crypto yet")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(.white)
                    Text("Tap to add your first coin")
                        .font(.system(size: 11))
                        .foregroundColor(WidgetConstants.gray)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
            }
        }
        .widgetURL(URL(string: "TheCrypto.wiki://portfolio"))
        .widgetBackground()
    }
}

struct PortfolioWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "PortfolioWidget", provider: PortfolioProvider()) { entry in
            PortfolioWidgetView(entry: entry)
        }
        .configurationDisplayName("Portfolio Value")
        .description("Your portfolio value and profit/loss at a glance.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
