import SwiftUI
import WidgetKit

// Shared timeline entry + provider for the three small "latest ___" widgets
// (Post / Exchange / OG). They all read the same cached getWidgetContent payload.

struct ContentEntry: TimelineEntry {
    let date: Date
    let isPro: Bool
    let content: ContentData?
    let postImage: Data?
    let exchangeImage: Data?
    let ogImage: Data?
}

struct ContentProvider: TimelineProvider {
    func placeholder(in context: Context) -> ContentEntry {
        ContentEntry(
            date: Date(),
            isPro: true,
            content: ContentData(
                latestPost: ContentItem(title: "What moves the crypto market?", image: "", url: ""),
                latestExchange: ContentItem(title: "Kraken Review", image: "", url: ""),
                latestOG: ContentItem(title: "Gavin Wood", image: "", url: ""),
                updatedAt: Date().timeIntervalSince1970 * 1000
            ),
            postImage: nil,
            exchangeImage: nil,
            ogImage: nil
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (ContentEntry) -> Void) {
        // In the gallery preview, fetch real content + thumbnails so the preview
        // reflects the actual widget (name, image, title).
        guard context.isPreview else {
            completion(placeholder(in: context))
            return
        }
        Task {
            let content = await WidgetAPI.fetch(ContentData.self, from: WidgetConstants.contentURL)
            guard let content = content else {
                completion(placeholder(in: context))
                return
            }
            async let post = fetchThumb(content.latestPost?.image)
            async let exchange = fetchThumb(content.latestExchange?.image)
            async let og = fetchThumb(content.latestOG?.image)
            let entry = ContentEntry(
                date: Date(), isPro: true, content: content,
                postImage: await post, exchangeImage: await exchange, ogImage: await og
            )
            completion(entry)
        }
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<ContentEntry>) -> Void) {
        let snapshot = AppSnapshot.load()
        let refresh = Calendar.current.date(byAdding: .hour, value: 6, to: Date())!

        guard snapshot.isPro else {
            let entry = ContentEntry(
                date: Date(), isPro: false, content: nil,
                postImage: nil, exchangeImage: nil, ogImage: nil
            )
            completion(Timeline(entries: [entry], policy: .after(refresh)))
            return
        }

        Task {
            let content = await WidgetAPI.fetch(ContentData.self, from: WidgetConstants.contentURL)

            async let post = fetchThumb(content?.latestPost?.image)
            async let exchange = fetchThumb(content?.latestExchange?.image)
            async let og = fetchThumb(content?.latestOG?.image)

            let entry = ContentEntry(
                date: Date(), isPro: true, content: content,
                postImage: await post, exchangeImage: await exchange, ogImage: await og
            )
            completion(Timeline(entries: [entry], policy: .after(refresh)))
        }
    }

    private func fetchThumb(_ imageUrl: String?) async -> Data? {
        guard let thumb = thumbnailURL(imageUrl, width: 256) else { return nil }
        return await WidgetAPI.fetchImage(from: thumb)
    }
}

// Small 2x2 card (portfolio-style) with a thumbnail + label + title.
struct ContentItemView: View {
    let label: String
    let item: ContentItem?
    let imageData: Data?
    let deepLink: String
    let isPro: Bool
    let lockedLabel: String

    var body: some View {
        Group {
            if !isPro {
                LockedView(widgetLabel: lockedLabel)
            } else if let item = item {
                VStack(alignment: .leading, spacing: 5) {
                    Text(label)
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundColor(WidgetConstants.gray)
                    Text(item.title)
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(.white)
                        .lineLimit(3)
                        .minimumScaleFactor(0.75)
                    if let data = imageData, let uiImage = UIImage(data: data) {
                        // Full width when wide, height-capped when square/tall,
                        // original ratio always preserved.
                        Image(uiImage: uiImage)
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                            .frame(maxWidth: .infinity, maxHeight: 70, alignment: .leading)
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                    }
                    Spacer(minLength: 0)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            } else {
                NoDataView()
            }
        }
        .widgetURL(URL(string: deepLink))
        .widgetBackground()
    }
}

// MARK: - Latest Post

struct LatestPostWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "LatestPostWidget", provider: ContentProvider()) { entry in
            ContentItemView(
                label: "LATEST POST",
                item: entry.content?.latestPost,
                imageData: entry.postImage,
                deepLink: "TheCrypto.wiki://posts",
                isPro: entry.isPro,
                lockedLabel: "Latest Post"
            )
        }
        .configurationDisplayName("Latest Post (Pro)")
        .description("The newest article from TheCrypto.wiki. Requires Pro - upgrade inside the app.")
        .supportedFamilies([.systemSmall])
    }
}

// MARK: - Latest Exchange

struct LatestExchangeWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "LatestExchangeWidget", provider: ContentProvider()) { entry in
            ContentItemView(
                label: "LATEST EXCHANGE",
                item: entry.content?.latestExchange,
                imageData: entry.exchangeImage,
                deepLink: "TheCrypto.wiki://exchanges",
                isPro: entry.isPro,
                lockedLabel: "Latest Exchange"
            )
        }
        .configurationDisplayName("Latest Exchange (Pro)")
        .description("The newest exchange review from TheCrypto.wiki. Requires Pro - upgrade inside the app.")
        .supportedFamilies([.systemSmall])
    }
}

// MARK: - Latest OG

struct LatestOGWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "LatestOGWidget", provider: ContentProvider()) { entry in
            ContentItemView(
                label: "LATEST OG",
                item: entry.content?.latestOG,
                imageData: entry.ogImage,
                deepLink: "TheCrypto.wiki://ogs",
                isPro: entry.isPro,
                lockedLabel: "Latest OG"
            )
        }
        .configurationDisplayName("Latest OG (Pro)")
        .description("The newest crypto OG profile from TheCrypto.wiki. Requires Pro - upgrade inside the app.")
        .supportedFamilies([.systemSmall])
    }
}
