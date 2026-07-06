import SwiftUI
import WidgetKit

// MARK: - Constants

enum WidgetConstants {
    static let appGroup = "group.com.shadev.thecryptowiki"
    static let snapshotKey = "widget_snapshot"
    static let marketURL = "https://us-central1-the-crypto-wiki.cloudfunctions.net/getWidgetData"
    static let contentURL = "https://us-central1-the-crypto-wiki.cloudfunctions.net/getWidgetContent"
    static let heatmapURL = "https://us-central1-the-crypto-wiki.cloudfunctions.net/getWidgetHeatmap"

    static let background = Color(red: 0x17 / 255, green: 0x17 / 255, blue: 0x17 / 255)
    static let gold = Color(red: 1.0, green: 0xD7 / 255, blue: 0)
    static let gray = Color(red: 0x80 / 255, green: 0x80 / 255, blue: 0x80 / 255)
    static let profit = Color(red: 0x4A / 255, green: 0xDE / 255, blue: 0x80 / 255)
    static let loss = Color(red: 0xF8 / 255, green: 0x71 / 255, blue: 0x71 / 255)
}

// MARK: - Models (mirror the JS snapshot / backend JSON)

struct PortfolioData: Codable {
    let totalValue: Double
    let totalProfitLoss: Double
    let totalProfitLossPercent: Double
    let assetsCount: Int
}

struct AppSnapshot: Codable {
    let isPro: Bool
    let portfolio: PortfolioData?
    let updatedAt: Double

    static let empty = AppSnapshot(isPro: false, portfolio: nil, updatedAt: 0)

    static func load() -> AppSnapshot {
        guard
            let defaults = UserDefaults(suiteName: WidgetConstants.appGroup),
            let raw = defaults.string(forKey: WidgetConstants.snapshotKey),
            let data = raw.data(using: .utf8),
            let snapshot = try? JSONDecoder().decode(AppSnapshot.self, from: data)
        else {
            return .empty
        }
        return snapshot
    }
}

struct FearGreed: Codable {
    let value: Int
    let label: String
}

struct FearGreedData: Codable {
    let fearGreed: FearGreed
    let updatedAt: Double
}

struct HeatmapCoin: Codable {
    let symbol: String
    let marketCap: Double
    let change24h: Double
}

struct HeatmapData: Codable {
    let coins: [HeatmapCoin]
    let updatedAt: Double
}

struct ContentItem: Codable {
    let title: String
    let image: String
    let url: String
}

struct ContentData: Codable {
    let latestPost: ContentItem?
    let latestExchange: ContentItem?
    let latestOG: ContentItem?
    let updatedAt: Double
}

// MARK: - Networking

enum WidgetAPI {
    static func fetch<T: Codable>(_ type: T.Type, from urlString: String) async -> T? {
        guard let url = URL(string: urlString) else { return nil }
        do {
            let (data, response) = try await URLSession.shared.data(from: url)
            guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
                return nil
            }
            return try JSONDecoder().decode(T.self, from: data)
        } catch {
            return nil
        }
    }

    static func fetchImage(from urlString: String) async -> Data? {
        guard !urlString.isEmpty, let url = URL(string: urlString) else { return nil }
        guard let (data, response) = try? await URLSession.shared.data(from: url),
              let http = response as? HTTPURLResponse, http.statusCode == 200
        else { return nil }
        return data
    }
}

// Route an image URL through the site's Next.js image optimizer for a tiny thumbnail.
func thumbnailURL(_ imageUrl: String?, width: Int = 128) -> String? {
    guard let s = imageUrl, !s.isEmpty,
          let comps = URLComponents(string: s), let host = comps.host
    else { return imageUrl }
    let scheme = comps.scheme ?? "https"
    var allowed = CharacterSet.alphanumerics
    allowed.insert(charactersIn: ".-_")
    let encoded = comps.path.addingPercentEncoding(withAllowedCharacters: allowed) ?? comps.path
    return "\(scheme)://\(host)/_next/image?url=\(encoded)&w=\(width)&q=75"
}

// MARK: - Formatting

enum Format {
    static func usd(_ value: Double) -> String {
        let absValue = abs(value)
        let sign = value < 0 ? "-" : ""
        if absValue >= 1e12 { return "\(sign)$\(String(format: "%.2f", absValue / 1e12))T" }
        if absValue >= 1e9 { return "\(sign)$\(String(format: "%.2f", absValue / 1e9))B" }
        if absValue >= 1e6 { return "\(sign)$\(String(format: "%.2f", absValue / 1e6))M" }
        return "\(sign)$\(withThousands(absValue))"
    }

    static func money(_ value: Double) -> String {
        let sign = value < 0 ? "-" : ""
        return "\(sign)$\(withThousands(abs(value)))"
    }

    static func percent(_ value: Double) -> String {
        let sign = value > 0 ? "+" : ""
        return "\(sign)\(String(format: "%.2f", value))%"
    }

    private static func withThousands(_ value: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        formatter.minimumFractionDigits = 2
        formatter.maximumFractionDigits = 2
        return formatter.string(from: NSNumber(value: value)) ?? String(format: "%.2f", value)
    }

}

// MARK: - Fear & Greed bands (mirror the website's FearAndGreedIndex component)

struct FearGreedBand {
    let label: String
    let smiley: String
    let from: Color
    let to: Color
}

func fearGreedBand(_ value: Int) -> FearGreedBand {
    switch value {
    case ...20:
        return FearGreedBand(label: "Extreme Fear", smiley: "😱",
                             from: Color(hex: "f85032"), to: Color(hex: "e73827"))
    case ...40:
        return FearGreedBand(label: "Fear", smiley: "😢",
                             from: Color(hex: "ff7e5f"), to: Color(hex: "feb47b"))
    case ...60:
        return FearGreedBand(label: "Neutral", smiley: "😐",
                             from: Color(hex: "f2c94c"), to: Color(hex: "f2994a"))
    case ...80:
        return FearGreedBand(label: "Greed", smiley: "🙂",
                             from: Color(hex: "a8ff78"), to: Color(hex: "78ffd6"))
    default:
        return FearGreedBand(label: "Extreme Greed", smiley: "😁",
                             from: Color(hex: "56ab2f"), to: Color(hex: "a8e063"))
    }
}

extension Color {
    init(hex: String) {
        let s = Scanner(string: hex.trimmingCharacters(in: CharacterSet(charactersIn: "#")))
        var rgb: UInt64 = 0
        s.scanHexInt64(&rgb)
        self.init(
            red: Double((rgb >> 16) & 0xFF) / 255,
            green: Double((rgb >> 8) & 0xFF) / 255,
            blue: Double(rgb & 0xFF) / 255
        )
    }
}

// MARK: - Shared views

struct LockedView: View {
    let widgetLabel: String

    var body: some View {
        VStack(spacing: 4) {
            Image(systemName: "star.fill")
                .font(.system(size: 22))
                .foregroundColor(WidgetConstants.gold)
            Text("\(widgetLabel) is a Pro feature")
                .font(.system(size: 13, weight: .bold))
                .foregroundColor(.white)
                .multilineTextAlignment(.center)
            Text("Upgrade to Pro in the app to unlock this widget")
                .font(.system(size: 11))
                .foregroundColor(WidgetConstants.gray)
                .multilineTextAlignment(.center)
        }
    }
}

struct NoDataView: View {
    var body: some View {
        Text("No data, check connection")
            .font(.system(size: 11))
            .foregroundColor(WidgetConstants.gray)
            .multilineTextAlignment(.center)
    }
}

extension View {
    func widgetBackground() -> some View {
        containerBackground(for: .widget) {
            WidgetConstants.background
        }
    }
}
