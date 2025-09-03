import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Platform,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/Colors";
import { usePortfolio } from "@/contexts/PortfolioContext";
import { PortfolioAsset } from "@/utils/portfolioStorage";
import { PortfolioAPI } from "@/utils/portfolioAPI";
import MaterialIcons from "@expo/vector-icons/Fontisto";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import Header from "@/components/Header";

const POPULAR_CRYPTOS = [
  { symbol: "BTC", name: "Bitcoin" },
  { symbol: "ETH", name: "Ethereum" },
  { symbol: "BNB", name: "BNB" },
  { symbol: "ADA", name: "Cardano" },
  { symbol: "DOT", name: "Polkadot" },
  { symbol: "LINK", name: "Chainlink" },
  { symbol: "UNI", name: "Uniswap" },
  { symbol: "LTC", name: "Litecoin" },
  { symbol: "BCH", name: "Bitcoin Cash" },
  { symbol: "XRP", name: "XRP" },
  { symbol: "MATIC", name: "Polygon" },
  { symbol: "AVAX", name: "Avalanche" },
  { symbol: "SOL", name: "Solana" },
  { symbol: "ATOM", name: "Cosmos" },
  { symbol: "NEAR", name: "NEAR Protocol" },
  { symbol: "FTM", name: "Fantom" },
  { symbol: "ALGO", name: "Algorand" },
  { symbol: "VET", name: "VeChain" },
  { symbol: "ICP", name: "Internet Computer" },
  { symbol: "FIL", name: "Filecoin" },
  { symbol: "TRX", name: "TRON" },
  { symbol: "ETC", name: "Ethereum Classic" },
  { symbol: "XLM", name: "Stellar" },
  { symbol: "DOGE", name: "Dogecoin" },
  { symbol: "SHIB", name: "Shiba Inu" },
  { symbol: "USDT", name: "Tether" },
  { symbol: "USDC", name: "USD Coin" },
  { symbol: "DAI", name: "Dai" },
  { symbol: "BUSD", name: "Binance USD" },
  { symbol: "WBTC", name: "Wrapped Bitcoin" },
];

interface AddCryptoModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (
    symbol: string,
    amount: number,
    purchasePrice?: number
  ) => Promise<boolean>;
  editCrypto?: PortfolioAsset;
}

function AddCryptoModal({
  visible,
  onClose,
  onAdd,
  editCrypto,
}: AddCryptoModalProps) {
  const [symbol, setSymbol] = useState(editCrypto?.symbol || "");
  const [amount, setAmount] = useState(editCrypto?.amount.toString() || "");
  const [purchasePrice, setPurchasePrice] = useState(
    editCrypto?.purchasePrice.toString() || ""
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredCryptos, setFilteredCryptos] = useState(POPULAR_CRYPTOS);
  const [allAvailableCoins, setAllAvailableCoins] = useState<
    { symbol: string; name: string }[]
  >([]);
  const [isLoadingCoins, setIsLoadingCoins] = useState(false);

  const amountInputRef = useRef<TextInput>(null);
  const purchasePriceInputRef = useRef<TextInput>(null);

  const fetchAllAvailableCoins = async () => {
    if (allAvailableCoins.length > 0) return;

    setIsLoadingCoins(true);
    try {
      const availableSymbols = await PortfolioAPI.getAvailableCoins();

      const coinsWithNames = availableSymbols.map((symbol) => {
        const knownCrypto = POPULAR_CRYPTOS.find((c) => c.symbol === symbol);
        return {
          symbol,
          name: knownCrypto?.name || symbol,
        };
      });

      setAllAvailableCoins(coinsWithNames);
    } catch (error) {
      setAllAvailableCoins(POPULAR_CRYPTOS);
    } finally {
      setIsLoadingCoins(false);
    }
  };

  useEffect(() => {
    if (editCrypto) {
      setSymbol(editCrypto.symbol);
      setAmount(editCrypto.amount.toString());
      setPurchasePrice(editCrypto.purchasePrice.toString());
      setShowSuggestions(false);
    } else {
      setSymbol("");
      setAmount("");
      setPurchasePrice("");
      setShowSuggestions(false);
      setFilteredCryptos(POPULAR_CRYPTOS);

      if (visible && !editCrypto) {
        fetchAllAvailableCoins();
      }
    }
  }, [editCrypto, visible]);

  const handleSymbolChange = (text: string) => {
    setSymbol(text);

    const searchList =
      allAvailableCoins.length > 0 ? allAvailableCoins : POPULAR_CRYPTOS;

    if (text.length > 0) {
      const filtered = searchList.filter(
        (crypto) =>
          crypto.symbol.toLowerCase().includes(text.toLowerCase()) ||
          crypto.name.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredCryptos(filtered);
      setShowSuggestions(true);
    } else {
      const combinedList = [
        ...POPULAR_CRYPTOS,
        ...searchList.filter(
          (c) => !POPULAR_CRYPTOS.some((p) => p.symbol === c.symbol)
        ),
      ];
      setFilteredCryptos(combinedList.slice(0, 50));
      setShowSuggestions(true);
    }
  };

  const handleSelectCrypto = (selectedSymbol: string) => {
    setSymbol(selectedSymbol);
    setShowSuggestions(false);
  };

  const hideSuggestions = () => {
    setShowSuggestions(false);
  };

  const handleSubmit = async () => {
    if (!symbol.trim() || !amount.trim()) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    const numAmount = parseFloat(amount);
    const numPrice = purchasePrice ? parseFloat(purchasePrice) : undefined;

    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    if (purchasePrice && (isNaN(numPrice!) || numPrice! <= 0)) {
      Alert.alert("Error", "Please enter a valid purchase price");
      return;
    }

    setIsLoading(true);
    try {
      const success = await onAdd(symbol.trim(), numAmount, numPrice);
      if (success) {
        onClose();
      }
    } catch (error) {
      // Error handling is done in the context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {editCrypto ? "Edit Crypto" : "Add Crypto"}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.modalContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Cryptocurrency *</Text>
            <Text style={styles.inputDescription}>
              Search by name (e.g., "Bitcoin") or symbol (e.g., "BTC")
            </Text>
            <View style={styles.symbolInputContainer}>
              <TextInput
                style={styles.textInput}
                value={symbol}
                onChangeText={handleSymbolChange}
                onFocus={() => {
                  if (!editCrypto && symbol.length === 0) {
                    setShowSuggestions(true);
                    const searchList =
                      allAvailableCoins.length > 0
                        ? allAvailableCoins
                        : POPULAR_CRYPTOS;
                    const combinedList = [
                      ...POPULAR_CRYPTOS,
                      ...searchList.filter(
                        (c) =>
                          !POPULAR_CRYPTOS.some((p) => p.symbol === c.symbol)
                      ),
                    ];
                    setFilteredCryptos(combinedList.slice(0, 50));
                  }
                }}
                onBlur={() => {
                  setTimeout(hideSuggestions, 150);
                }}
                placeholder="Search for Bitcoin, Ethereum, etc."
                placeholderTextColor={Colors.icon}
                autoCapitalize="characters"
                editable={!editCrypto}
                returnKeyType="next"
                onSubmitEditing={() => {
                  amountInputRef.current?.focus();
                }}
              />

              {showSuggestions && !editCrypto && (
                <View style={styles.suggestionsContainer}>
                  {isLoadingCoins ? (
                    <View style={styles.loadingSuggestions}>
                      <ActivityIndicator
                        size="small"
                        color={Colors.activeIcon}
                      />
                      <Text style={styles.loadingSuggestionsText}>
                        Loading cryptocurrencies...
                      </Text>
                    </View>
                  ) : (
                    <ScrollView
                      style={styles.suggestionsList}
                      keyboardShouldPersistTaps="handled"
                      showsVerticalScrollIndicator={false}
                    >
                      {filteredCryptos.slice(0, 8).map((item) => (
                        <TouchableOpacity
                          key={item.symbol}
                          style={styles.suggestionItem}
                          onPress={() => handleSelectCrypto(item.symbol)}
                        >
                          <View style={styles.suggestionContent}>
                            <Text style={styles.suggestionSymbol}>
                              {item.symbol}
                            </Text>
                            <Text style={styles.suggestionName}>
                              {item.name}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </View>
              )}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Amount *</Text>
            <TextInput
              ref={amountInputRef}
              style={styles.textInput}
              value={amount}
              onChangeText={(text) => setAmount(text.replace(",", "."))}
              placeholder="0.00"
              placeholderTextColor={Colors.icon}
              keyboardType="numeric"
              returnKeyType="next"
              onSubmitEditing={() => {
                purchasePriceInputRef.current?.focus();
              }}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Purchase Price (USD)</Text>
            <Text style={styles.inputDescription}>
              Leave empty to use current market price
            </Text>
            <TextInput
              ref={purchasePriceInputRef}
              style={styles.textInput}
              value={purchasePrice}
              onChangeText={(text) => setPurchasePrice(text.replace(",", "."))}
              placeholder="0.00"
              placeholderTextColor={Colors.icon}
              keyboardType="numeric"
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              isLoading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>
                {editCrypto ? "Update Crypto" : "Add Crypto"}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

function CryptoCard({
  crypto,
  onEdit,
  onDelete,
}: {
  crypto: PortfolioAsset;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const totalValue = crypto.amount * crypto.currentPrice;
  const totalInvested = crypto.amount * crypto.purchasePrice;
  const profitLoss = totalValue - totalInvested;
  const profitLossPercent =
    totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;
  const isProfit = profitLoss >= 0;

  return (
    <View style={styles.cryptoCard}>
      <View style={styles.cryptoHeader}>
        <View style={styles.cryptoInfo}>
          <Text style={styles.cryptoSymbol}>{crypto.symbol}</Text>
          <Text style={styles.cryptoAmount}>
            {crypto.amount.toFixed(8).replace(/\.?0+$/, "")} {crypto.symbol}
          </Text>
        </View>
        <View style={styles.cryptoActions}>
          <TouchableOpacity onPress={onEdit} style={styles.actionButton}>
            <MaterialIcons
              name="player-settings"
              size={21}
              color={Colors.icon}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
            <MaterialIcons name="trash" size={20} color="#ff4444" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.cryptoValues}>
        <View style={styles.valueRow}>
          <Text style={styles.valueLabel}>Current Price:</Text>
          <Text style={styles.valueText}>
            $
            {crypto.currentPrice.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
        </View>
        <View style={styles.valueRow}>
          <Text style={styles.valueLabel}>Total Value:</Text>
          <Text style={styles.valueText}>
            $
            {totalValue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
        </View>
        <View style={styles.valueRow}>
          <Text style={styles.valueLabel}>Profit/Loss:</Text>
          <Text
            style={[
              styles.valueText,
              isProfit ? styles.profitText : styles.lossText,
            ]}
          >
            $
            {profitLoss.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            ({profitLossPercent.toFixed(2)}%)
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function PortfolioScreen() {
  const router = useRouter();
  const { isOffline } = useNetworkStatus();
  const {
    assets,
    summary,
    isLoading,
    isRefreshing,
    error,
    addAsset,
    updateAsset,
    removeAsset,
    refreshPortfolio,
    clearError,
    getTotalValue,
    getTotalProfitLoss,
  } = usePortfolio();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCrypto, setEditingCrypto] = useState<
    PortfolioAsset | undefined
  >();

  useEffect(() => {
    if (error) {
      Alert.alert("Error", error, [{ text: "OK", onPress: clearError }]);
    }
  }, [error, clearError]);

  const handleAddCrypto = async (
    symbol: string,
    amount: number,
    purchasePrice?: number
  ) => {
    return await addAsset(symbol, amount, purchasePrice);
  };

  const handleEditCrypto = async (
    symbol: string,
    amount: number,
    purchasePrice?: number
  ) => {
    if (!editingCrypto) return false;

    return await updateAsset(editingCrypto.id, {
      amount,
      purchasePrice: purchasePrice || editingCrypto.purchasePrice,
    });
  };

  const handleDeleteCrypto = (crypto: PortfolioAsset) => {
    Alert.alert(
      "Delete Crypto",
      `Are you sure you want to remove ${crypto.symbol} from your portfolio?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => removeAsset(crypto.id),
        },
      ]
    );
  };

  const totalValue = getTotalValue();
  const { amount: totalProfitLoss, percentage: totalProfitLossPercent } =
    getTotalProfitLoss();
  const isProfit = totalProfitLoss >= 0;

  return (
    <View style={styles.container}>
      <Header />

      <FlatList
        style={styles.scrollView}
        data={[
          { type: "summary", data: null },
          { type: "addButton", data: null },
          ...(isLoading && assets.length === 0
            ? [{ type: "loading", data: null }]
            : assets.length === 0
            ? [{ type: "empty", data: null }]
            : assets.map((asset) => ({ type: "asset", data: asset }))),
        ]}
        keyExtractor={(item, index) => `${item.type}-${index}`}
        renderItem={({ item }) => {
          switch (item.type) {
            case "summary":
              return (
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryTitle}>Portfolio Overview</Text>

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Total Value</Text>
                    <Text style={styles.summaryValue}>
                      $
                      {totalValue.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </Text>
                  </View>

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Total P&L</Text>
                    <Text
                      style={[
                        styles.summaryValue,
                        isProfit ? styles.profitText : styles.lossText,
                      ]}
                    >
                      $
                      {totalProfitLoss.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      ({totalProfitLossPercent.toFixed(2)}%)
                    </Text>
                  </View>

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Assets</Text>
                    <Text style={styles.summaryValue}>{assets.length}</Text>
                  </View>

                  {isOffline && (
                    <View style={styles.offlineNotice}>
                      <MaterialIcons
                        name="wifi"
                        size={16}
                        color={Colors.icon}
                      />
                      <Text style={styles.offlineText}>
                        Offline - Showing cached data
                      </Text>
                    </View>
                  )}
                </View>
              );

            case "addButton":
              return (
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => setShowAddModal(true)}
                >
                  <MaterialIcons name="plus-a" size={24} color="#000" />
                  <Text style={styles.addButtonText}>Add Crypto</Text>
                </TouchableOpacity>
              );

            case "loading":
              return (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={Colors.activeIcon} />
                  <Text style={styles.loadingText}>Loading portfolio...</Text>
                </View>
              );

            case "empty":
              return (
                <View style={styles.emptyContainer}>
                  <MaterialIcons name="bitcoin" size={80} color={Colors.icon} />
                  <Text style={styles.emptyTitle}>No Crypto Yet</Text>
                  <Text style={styles.emptyText}>
                    Start building your crypto portfolio by adding your first
                    cryptocurrency
                  </Text>
                </View>
              );

            case "asset":
              if (!item.data) return null;
              return (
                <CryptoCard
                  key={item.data.id}
                  crypto={item.data}
                  onEdit={() => {
                    setEditingCrypto(item.data);
                    setShowAddModal(true);
                  }}
                  onDelete={() => handleDeleteCrypto(item.data)}
                />
              );

            default:
              return null;
          }
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshPortfolio}
            tintColor={Colors.activeIcon}
            enabled={!isOffline}
          />
        }
        contentContainerStyle={styles.flatListContent}
      />

      <AddCryptoModal
        visible={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingCrypto(undefined);
        }}
        onAdd={editingCrypto ? handleEditCrypto : handleAddCrypto}
        editCrypto={editingCrypto}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  flatListContent: {
    padding: 16,
  },
  summaryCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#333",
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: Colors.icon,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
  profitText: {
    color: "#4ade80",
  },
  lossText: {
    color: "#f87171",
  },
  offlineNotice: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  offlineText: {
    fontSize: 14,
    color: Colors.icon,
    marginLeft: 8,
  },
  addButton: {
    backgroundColor: Colors.activeIcon,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginLeft: 8,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.icon,
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.icon,
    textAlign: "center",
    lineHeight: 24,
  },
  assetsList: {
    marginBottom: 20,
  },
  cryptoCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  cryptoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cryptoInfo: {
    flex: 1,
  },
  cryptoSymbol: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.text,
  },
  cryptoAmount: {
    fontSize: 14,
    color: Colors.icon,
    marginTop: 2,
  },
  cryptoActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
  },
  cryptoValues: {
    marginBottom: 12,
  },
  valueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  valueLabel: {
    fontSize: 14,
    color: Colors.icon,
  },
  valueText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text,
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
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 8,
  },
  inputDescription: {
    fontSize: 14,
    color: Colors.icon,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
  },
  submitButton: {
    backgroundColor: Colors.activeIcon,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },

  symbolInputContainer: {
    position: "relative",
    zIndex: 1000,
  },
  suggestionsContainer: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    maxHeight: 200,
    zIndex: 1001,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  suggestionContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  suggestionSymbol: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
  suggestionName: {
    fontSize: 14,
    color: Colors.icon,
    flex: 1,
    textAlign: "right",
  },
  loadingSuggestions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  loadingSuggestionsText: {
    fontSize: 14,
    color: Colors.icon,
    marginLeft: 8,
  },
});
