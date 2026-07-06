import SwiftUI
import WidgetKit

@main
struct CryptoWikiWidgets: WidgetBundle {
    var body: some Widget {
        PortfolioWidget()
        FearGreedWidget()
        HeatmapWidget()
        LatestPostWidget()
        LatestExchangeWidget()
        LatestOGWidget()
    }
}
