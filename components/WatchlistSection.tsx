import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/Fontisto";
import { Colors } from "@/constants/Colors";
import { PortfolioAPI } from "@/utils/portfolioAPI";
import { getCoinName, COIN_NAMES } from "@/utils/coinNames";
import { WatchlistItem } from "@/utils/watchlistStorage";

const PROFIT_COLOR = "#4ade80";
const LOSS_COLOR = "#f87171";

interface WatchlistSectionProps {
  items: WatchlistItem[];
  onAdd: (symbol: string) => Promise<void>;
  onRemove: (symbol: string) => Promise<void>;
}

function formatPrice(price: number): string {
  return `$${price.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: price < 1 ? 6 : 2,
  })}`;
}

function AddCoinModal({
  visible,
  onClose,
  onSelect,
  existingSymbols,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (symbol: string) => void;
  existingSymbols: string[];
}) {
  const [query, setQuery] = useState("");
  const [availableCoins, setAvailableCoins] = useState<string[]>([]);
  const [isLoadingCoins, setIsLoadingCoins] = useState(false);

  useEffect(() => {
    if (!visible) {
      setQuery("");
      return;
    }
    if (availableCoins.length > 0) return;

    setIsLoadingCoins(true);
    PortfolioAPI.getAvailableCoins()
      .then(setAvailableCoins)
      .catch(() => setAvailableCoins(Object.keys(COIN_NAMES)))
      .finally(() => setIsLoadingCoins(false));
  }, [visible, availableCoins.length]);

  const results = useMemo(() => {
    const source =
      availableCoins.length > 0 ? availableCoins : Object.keys(COIN_NAMES);
    const candidates = source.filter(
      (symbol) => !existingSymbols.includes(symbol)
    );

    if (query.trim().length === 0) {
      // Surface well-known coins first when there is no query.
      const known = candidates.filter((symbol) => COIN_NAMES[symbol]);
      return [...known, ...candidates.filter((s) => !COIN_NAMES[s])].slice(
        0,
        30
      );
    }

    const lower = query.trim().toLowerCase();
    return candidates
      .filter(
        (symbol) =>
          symbol.toLowerCase().includes(lower) ||
          getCoinName(symbol).toLowerCase().includes(lower)
      )
      .slice(0, 30);
  }, [query, availableCoins, existingSymbols]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Add to Watchlist</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search for Bitcoin, Ethereum, etc."
            placeholderTextColor={Colors.icon}
            autoCapitalize="characters"
            autoFocus
          />

          {isLoadingCoins ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={Colors.activeIcon} />
              <Text style={styles.loadingText}>
                Loading cryptocurrencies...
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.resultsList}
              keyboardShouldPersistTaps="handled"
            >
              {results.map((symbol) => (
                <TouchableOpacity
                  key={symbol}
                  style={styles.resultItem}
                  onPress={() => {
                    onSelect(symbol);
                    onClose();
                  }}
                >
                  <Text style={styles.resultSymbol}>{symbol}</Text>
                  <Text style={styles.resultName}>{getCoinName(symbol)}</Text>
                </TouchableOpacity>
              ))}
              {results.length === 0 && (
                <Text style={styles.noResultsText}>
                  No matching coins found
                </Text>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

export default function WatchlistSection({
  items,
  onAdd,
  onRemove,
}: WatchlistSectionProps) {
  const [showAddModal, setShowAddModal] = useState(false);

  const handleRemove = (item: WatchlistItem) => {
    Alert.alert(
      "Remove from Watchlist",
      `Stop watching ${item.name || item.symbol}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => onRemove(item.symbol),
        },
      ]
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Watchlist</Text>
        <TouchableOpacity
          onPress={() => setShowAddModal(true)}
          style={styles.addIconButton}
        >
          <MaterialIcons name="plus-a" size={18} color={Colors.activeIcon} />
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <Text style={styles.emptyText}>
          Track coins you don't own yet. Tap + to add your first coin.
        </Text>
      ) : (
        items.map((item, index) => {
          const change = item.lastChangePercent24h;
          const isUp = (change ?? 0) >= 0;
          return (
            <View
              key={item.symbol}
              style={[styles.row, index > 0 && styles.rowBorder]}
            >
              <View style={styles.coinInfo}>
                <Text style={styles.coinSymbol}>{item.symbol}</Text>
                <Text style={styles.coinName}>{item.name}</Text>
              </View>
              <View style={styles.priceInfo}>
                <Text style={styles.priceText}>
                  {item.lastPrice !== null ? formatPrice(item.lastPrice) : "—"}
                </Text>
                <Text
                  style={[
                    styles.changeText,
                    { color: change === null ? Colors.icon : isUp ? PROFIT_COLOR : LOSS_COLOR },
                  ]}
                >
                  {change !== null
                    ? `${isUp ? "+" : ""}${change.toFixed(2)}%`
                    : "24h —"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleRemove(item)}
                style={styles.removeButton}
              >
                <MaterialIcons name="trash" size={18} color={Colors.icon} />
              </TouchableOpacity>
            </View>
          );
        })
      )}

      <AddCoinModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSelect={(symbol) => {
          onAdd(symbol).catch(() => {});
        }}
        existingSymbols={items.map((item) => item.symbol)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#333",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.text,
  },
  addIconButton: {
    padding: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.icon,
    lineHeight: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  coinInfo: {
    flex: 1,
  },
  coinSymbol: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
  coinName: {
    fontSize: 13,
    color: Colors.icon,
    marginTop: 2,
  },
  priceInfo: {
    alignItems: "flex-end",
    marginRight: 12,
  },
  priceText: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.text,
  },
  changeText: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2,
  },
  removeButton: {
    padding: 6,
  },

  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.text,
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  searchInput: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    marginBottom: 16,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.icon,
    marginLeft: 8,
  },
  resultsList: {
    flex: 1,
  },
  resultItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  resultSymbol: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
  resultName: {
    fontSize: 14,
    color: Colors.icon,
    flex: 1,
    textAlign: "right",
  },
  noResultsText: {
    fontSize: 14,
    color: Colors.icon,
    textAlign: "center",
    padding: 20,
  },
});
