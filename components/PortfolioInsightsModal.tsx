import React, { useMemo } from "react";
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Colors } from "@/constants/Colors";
import MaterialIcons from "@expo/vector-icons/Fontisto";
import { PortfolioAsset } from "@/utils/portfolioStorage";
import {
  computeAllocations,
  computeBestWorstPerformers,
  diversificationNote,
} from "@/utils/portfolioInsights";

const PROFIT_COLOR = "#4ade80";
const LOSS_COLOR = "#f87171";

interface PortfolioInsightsModalProps {
  visible: boolean;
  assets: PortfolioAsset[];
  onClose: () => void;
}

function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export default function PortfolioInsightsModal({
  visible,
  assets,
  onClose,
}: PortfolioInsightsModalProps) {
  const allocations = useMemo(() => computeAllocations(assets), [assets]);
  const { best, worst } = useMemo(
    () => computeBestWorstPerformers(assets),
    [assets]
  );
  const note = useMemo(() => diversificationNote(allocations), [allocations]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Portfolio Insights</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close-a" size={18} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {allocations.length === 0 ? (
            <Text style={styles.emptyText}>
              Add a holding to your portfolio to see insights here.
            </Text>
          ) : (
            <>
              {(best || worst) && (
                <View style={styles.performerRow}>
                  {best && (
                    <View style={[styles.performerCard, styles.performerCardLeft]}>
                      <Text style={styles.performerLabel}>Best Performer</Text>
                      <Text style={styles.performerSymbol}>{best.symbol}</Text>
                      <Text style={[styles.performerPercent, { color: PROFIT_COLOR }]}>
                        {formatPercent(best.profitLossPercent)}
                      </Text>
                    </View>
                  )}
                  {worst && worst.symbol !== best?.symbol && (
                    <View style={styles.performerCard}>
                      <Text style={styles.performerLabel}>Worst Performer</Text>
                      <Text style={styles.performerSymbol}>{worst.symbol}</Text>
                      <Text
                        style={[
                          styles.performerPercent,
                          { color: worst.profitLossPercent >= 0 ? PROFIT_COLOR : LOSS_COLOR },
                        ]}
                      >
                        {formatPercent(worst.profitLossPercent)}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {note && (
                <View style={styles.noteCard}>
                  <MaterialIcons name="paper-plane" size={16} color={Colors.activeIcon} />
                  <Text style={styles.noteText}>{note}</Text>
                </View>
              )}

              <Text style={styles.sectionTitle}>Allocation</Text>
              <View style={styles.allocationCard}>
                {allocations.map((entry, index) => (
                  <View
                    key={entry.symbol}
                    style={[
                      styles.allocationRow,
                      index > 0 && styles.allocationRowBorder,
                    ]}
                  >
                    <View style={styles.allocationHeader}>
                      <Text style={styles.allocationSymbol}>{entry.symbol}</Text>
                      <Text style={styles.allocationPercent}>
                        {entry.percent.toFixed(1)}%
                      </Text>
                    </View>
                    <View style={styles.allocationBarTrack}>
                      <View
                        style={[
                          styles.allocationBarFill,
                          { width: `${Math.max(entry.percent, 2)}%` },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.text,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    padding: 20,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.icon,
    textAlign: "center",
    marginTop: 40,
  },
  performerRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  performerCard: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    padding: 14,
  },
  performerCardLeft: {
    marginRight: 0,
  },
  performerLabel: {
    fontSize: 11,
    color: Colors.icon,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  performerSymbol: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 2,
  },
  performerPercent: {
    fontSize: 14,
    fontWeight: "600",
  },
  noteCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    padding: 14,
    marginBottom: 20,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 10,
  },
  allocationCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    padding: 16,
  },
  allocationRow: {
    paddingVertical: 10,
  },
  allocationRowBorder: {
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  allocationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  allocationSymbol: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
  allocationPercent: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.icon,
  },
  allocationBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#333",
    overflow: "hidden",
  },
  allocationBarFill: {
    height: "100%",
    backgroundColor: Colors.activeIcon,
    borderRadius: 3,
  },
});
