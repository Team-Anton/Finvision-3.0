import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Button from "../../components/Button";
import Card from "../../components/Card";
import { money } from "../../utils/helpers";
import { MemberAvatar } from "./MemberList";
import {
  calcDirectSettlement,
  cleanAmount,
  createMember,
  createSplitExpense,
  getCalculationReport,
  getSpendExpenses,
  getSharedFundSummary,
  isSharedFundDeposit,
  isSharedFundSpend,
  normalizeExpenses,
  normalizeMembers,
  validateSplit,
  WALLET_ID,
  WALLET_MEMBER,
} from "./SplitEngine";

const GROUP_STORAGE_KEY = "finvision-v3-group-split";
const SCHEMA_VERSION = 2;
const DEFAULT_CURRENCY = "BDT";

function createLocalId(prefix) {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createEmptyGroup({ name, currency }) {
  const now = Date.now();
  const id = createLocalId("group");
  return {
    id,
    name: String(name || "").trim(),
    currency: currency || DEFAULT_CURRENCY,
    createdAt: now,
    updatedAt: now,
    members: [],
    expenses: [],
    sharedFund: { enabled: false },
    settings: { defaultSplitMethod: "equal" },
  };
}

function normalizeGroup(group, fallbackName = "My Group") {
  if (!group || typeof group !== "object") return null;
  const members = normalizeMembers(group.members);
  const expenses = normalizeExpenses(group.expenses, [
    ...members,
    WALLET_MEMBER,
  ]);
  const id = String(group.id || createLocalId("group"));
  return {
    id,
    name: String(group.name || fallbackName).trim() || fallbackName,
    currency: group.currency || DEFAULT_CURRENCY,
    createdAt: Number(group.createdAt) || Date.now(),
    updatedAt: Number(group.updatedAt) || Date.now(),
    members,
    expenses,
    sharedFund: {
      enabled: Boolean(group.sharedFund?.enabled || expenses.some(isSharedFundDeposit)),
    },
    settings: {
      defaultSplitMethod: group.settings?.defaultSplitMethod || "equal",
    },
  };
}

function migrateSavedGroup(raw) {
  if (!raw || typeof raw !== "object") {
    return { groups: [], activeGroupId: null };
  }

  if (Array.isArray(raw.groups)) {
    const groups = raw.groups
      .map((group, index) => normalizeGroup(group, `Group ${index + 1}`))
      .filter(Boolean);
    return {
      groups,
      activeGroupId:
        groups.find((group) => group.id === raw.activeGroupId)?.id ||
        groups[0]?.id ||
        null,
    };
  }

  const members = normalizeMembers(raw.members);
  const expenses = normalizeExpenses(raw.expenses, [...members, WALLET_MEMBER]);
  if (!members.length && !expenses.length) {
    return { groups: [], activeGroupId: null };
  }

  const migrated = normalizeGroup({
    id: createLocalId("group"),
    name: "My Group",
    currency: DEFAULT_CURRENCY,
    members,
    expenses,
    sharedFund: { enabled: expenses.some(isSharedFundDeposit) },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  return { groups: [migrated], activeGroupId: migrated.id };
}

function serializeGroups(groups, activeGroupId) {
  return {
    schemaVersion: SCHEMA_VERSION,
    activeGroupId,
    groups: groups.map((group) => normalizeGroup(group)).filter(Boolean),
  };
}

function formatMemberList(members, ids) {
  const names = (ids || [])
    .map((id) => members.find((member) => member.id === id)?.name)
    .filter(Boolean);
  if (!names.length) return "No one selected";
  if (names.length <= 2) return names.join(", ");
  return `${names.slice(0, 2).join(", ")} +${names.length - 2} more`;
}

function getContributorText(group, expense) {
  if (isSharedFundSpend(expense)) return "Paid from Shared Fund";
  return (expense.contributors || [])
    .map((contributor) => {
      const name = group.members.find(
        (member) => member.id === contributor.memberId,
      )?.name;
      return name ? `${name} paid ${money(contributor.amount)}` : null;
    })
    .filter(Boolean)
    .join(" - ");
}

function GroupSplitTab() {
  const [groups, setGroups] = useState([]);
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [hydrated, setHydrated] = useState(false);
  const [modal, setModal] = useState(null);
  const [createForm, setCreateForm] = useState({
    name: "",
    currency: DEFAULT_CURRENCY,
    error: "",
  });
  const [memberForm, setMemberForm] = useState({ name: "", error: "" });
  const [expenseForm, setExpenseForm] = useState(null);
  const [fundForm, setFundForm] = useState({
    memberId: "",
    amount: "",
    error: "",
  });
  const [expandedExpenseId, setExpandedExpenseId] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const activeGroup = useMemo(
    () => groups.find((group) => group.id === activeGroupId) || null,
    [activeGroupId, groups],
  );
  const activeMembers = activeGroup?.members || [];
  const activeExpenses = activeGroup?.expenses || [];

  const spendExpenses = useMemo(
    () => getSpendExpenses(activeExpenses),
    [activeExpenses],
  );

  const directSettlement = useMemo(
    () => calcDirectSettlement(activeMembers, activeExpenses),
    [activeMembers, activeExpenses],
  );
  const settlements = directSettlement.settlements;
  const memberSummaries = directSettlement.memberSummaries;
  const calculationReport = useMemo(
    () => getCalculationReport(activeMembers, activeExpenses),
    [activeMembers, activeExpenses],
  );
  const expenseReportsById = useMemo(
    () =>
      new Map(
        calculationReport.expenses.map((expense) => [expense.id, expense]),
      ),
    [calculationReport],
  );

  const fundSummary = useMemo(
    () =>
      activeGroup
        ? getSharedFundSummary(activeMembers, activeExpenses)
        : {
            balance: 0,
            deposits: 0,
            spend: 0,
            fundDeposits: [],
            fundSpends: [],
            memberPositions: [],
            settlementSuggestions: [],
            hasActivity: false,
          },
    [activeGroup, activeMembers, activeExpenses],
  );
  const fundDeposits = fundSummary.fundDeposits;
  const fundSpends = fundSummary.fundSpends;

  const totalSpent = cleanAmount(
    spendExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0),
  );
  const pendingSettlement = cleanAmount(
    settlements.reduce(
      (sum, settlement) => sum + Number(settlement.amount || 0),
      0,
    ),
  );

  useEffect(() => {
    let active = true;

    async function loadGroupData() {
      try {
        const raw = await AsyncStorage.getItem(GROUP_STORAGE_KEY);
        const saved = raw ? JSON.parse(raw) : null;
        const migrated = migrateSavedGroup(saved);
        if (!active) return;
        setGroups(migrated.groups);
        setActiveGroupId(migrated.activeGroupId);
      } catch (error) {
        console.warn("Could not load Group Split data:", error.message);
      } finally {
        if (active) setHydrated(true);
      }
    }

    loadGroupData();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(
      GROUP_STORAGE_KEY,
      JSON.stringify(serializeGroups(groups, activeGroupId)),
    ).catch((error) => {
      console.warn("Could not save Group Split data:", error.message);
    });
  }, [activeGroupId, groups, hydrated]);

  function updateActiveGroup(updater) {
    setGroups((current) =>
      current.map((group) => {
        if (group.id !== activeGroupId) return group;
        const next = typeof updater === "function" ? updater(group) : updater;
        return {
          ...group,
          ...next,
          updatedAt: Date.now(),
        };
      }),
    );
  }

  function openCreateGroup() {
    setCreateForm({ name: "", currency: DEFAULT_CURRENCY, error: "" });
    setModal("createGroup");
  }

  function createGroup() {
    const name = createForm.name.trim();
    if (!name) {
      setCreateForm((current) => ({
        ...current,
        error: "Group name is required.",
      }));
      return;
    }
    const group = createEmptyGroup({
      name,
      currency: createForm.currency.trim() || DEFAULT_CURRENCY,
    });
    setGroups([group]);
    setActiveGroupId(group.id);
    setModal(null);
  }

  function openAddMember() {
    setMemberForm({ name: "", error: "" });
    setModal("addMember");
  }

  function addMember() {
    if (!activeGroup) return;
    const name = memberForm.name.trim();
    if (!name) {
      setMemberForm((current) => ({
        ...current,
        error: "Member name is required.",
      }));
      return;
    }
    const duplicate = activeGroup.members.some(
      (member) => member.name.trim().toLowerCase() === name.toLowerCase(),
    );
    if (duplicate) {
      setMemberForm((current) => ({
        ...current,
        error: "This member is already in the group.",
      }));
      return;
    }
    updateActiveGroup((group) => ({
      members: [...group.members, createMember(name, group.members.length)],
    }));
    setModal(null);
  }

  function requestDeleteMember(memberId) {
    if (!activeGroup) return;
    const member = activeGroup.members.find((item) => item.id === memberId);
    const involved = activeGroup.expenses.some(
      (expense) =>
        expense.paidById === memberId ||
        (expense.memberIds || []).includes(memberId) ||
        (expense.contributors || []).some(
          (contributor) => contributor.memberId === memberId,
        ),
    );
    if (involved) {
      setConfirm({
        title: "Member is in use",
        message:
          "Delete or edit this member's expenses before removing them from the group.",
        actionLabel: "OK",
        onConfirm: () => setConfirm(null),
      });
      return;
    }
    setConfirm({
      title: `Remove ${member?.name || "member"}?`,
      message: "This removes the member from this local group.",
      actionLabel: "Remove",
      danger: true,
      onConfirm: () => {
        updateActiveGroup((group) => ({
          members: group.members.filter((item) => item.id !== memberId),
        }));
        setConfirm(null);
      },
    });
  }

  function createExpenseForm() {
    const memberIds = activeGroup?.members.map((member) => member.id) || [];
    return {
      title: "",
      amount: "",
      paidById: memberIds[0] || "",
      participantIds: memberIds,
      splitType: "equal",
      advancedOpen: false,
      multiplePayers: false,
      payFromFund: false,
      payerAmounts: {},
      customAmounts: {},
      error: "",
    };
  }

  function openAddExpense() {
    if ((activeGroup?.members.length || 0) < 2) {
      setConfirm({
        title: "Add members first",
        message: "Add at least two friends before creating an expense.",
        actionLabel: "OK",
        hideCancel: true,
        onConfirm: () => setConfirm(null),
      });
      return;
    }
    setExpenseForm(createExpenseForm());
    setModal("addExpense");
  }

  function patchExpenseForm(patch) {
    setExpenseForm((current) => ({
      ...current,
      ...patch,
      error: Object.prototype.hasOwnProperty.call(patch, "error")
        ? patch.error
        : "",
    }));
  }

  function toggleParticipant(memberId) {
    setExpenseForm((current) => {
      const selected = current.participantIds.includes(memberId);
      return {
        ...current,
        participantIds: selected
          ? current.participantIds.filter((id) => id !== memberId)
          : [...current.participantIds, memberId],
        error: "",
      };
    });
  }

  function buildContributors(form, amount) {
    if (form.payFromFund) {
      return [{ memberId: WALLET_ID, amount }];
    }
    if (form.multiplePayers) {
      return activeGroup.members
        .map((member) => ({
          memberId: member.id,
          amount: Number(form.payerAmounts[member.id] || 0),
        }))
        .filter((item) => item.amount > 0);
    }
    return [{ memberId: form.paidById, amount }];
  }

  function saveExpense() {
    if (!activeGroup || !expenseForm) return;
    const amount = cleanAmount(expenseForm.amount);
    if (!expenseForm.title.trim()) {
      patchExpenseForm({ error: "Expense title is required." });
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      patchExpenseForm({ error: "Amount must be greater than 0." });
      return;
    }
    if (!expenseForm.participantIds.length) {
      patchExpenseForm({ error: "Select who shared this expense." });
      return;
    }
    if (!expenseForm.payFromFund && !expenseForm.multiplePayers && !expenseForm.paidById) {
      patchExpenseForm({ error: "Choose who paid." });
      return;
    }
    if (expenseForm.payFromFund && fundSummary.balance + 0.01 < amount) {
      patchExpenseForm({
        error: "Shared Fund balance is not enough.",
      });
      return;
    }

    const expense = createSplitExpense({
      title: expenseForm.title,
      amount,
      contributors: buildContributors(expenseForm, amount),
      memberIds: expenseForm.participantIds,
      splitType: expenseForm.splitType,
      customAmounts: expenseForm.customAmounts,
    });
    const validation = validateSplit(expense);
    if (!validation.valid) {
      patchExpenseForm({ error: validation.error });
      return;
    }
    updateActiveGroup((group) => ({
      sharedFund: expenseForm.payFromFund
        ? { enabled: true }
        : group.sharedFund,
      expenses: [...group.expenses, expense],
    }));
    setModal(null);
  }

  function requestDeleteExpense(expenseId) {
    const expense = activeGroup?.expenses.find((item) => item.id === expenseId);
    setConfirm({
      title: "Delete expense?",
      message: `${expense?.title || "This expense"} will be removed from settlements.`,
      actionLabel: "Delete",
      danger: true,
      onConfirm: () => {
        updateActiveGroup((group) => ({
          expenses: group.expenses.filter((item) => item.id !== expenseId),
        }));
        setConfirm(null);
      },
    });
  }

  function openSharedFund() {
    setFundForm({
      memberId: activeGroup?.members[0]?.id || "",
      amount: "",
      error: "",
    });
    setModal("sharedFund");
  }

  function addFundDeposit() {
    if (!activeGroup) return;
    const amount = cleanAmount(fundForm.amount);
    if (!fundForm.memberId) {
      setFundForm((current) => ({ ...current, error: "Choose who deposited." }));
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setFundForm((current) => ({
        ...current,
        error: "Deposit amount must be greater than 0.",
      }));
      return;
    }
    const expense = createSplitExpense({
      title: "Shared Fund deposit",
      amount,
      contributors: [{ memberId: fundForm.memberId, amount }],
      memberIds: [WALLET_ID],
      splitType: "equal",
      customAmounts: {},
    });
    updateActiveGroup((group) => ({
      sharedFund: { enabled: true },
      expenses: [...group.expenses, expense],
    }));
    setFundForm({ memberId: activeGroup.members[0]?.id || "", amount: "", error: "" });
  }

  if (!hydrated) {
    return (
      <Card>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Loading Group Split...</Text>
          <Text style={styles.emptyText}>Checking saved local group data.</Text>
        </View>
      </Card>
    );
  }

  if (!activeGroup) {
    return (
      <View style={styles.wrapper}>
        <Card>
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Split expenses with friends</Text>
            <Text style={styles.emptyText}>
              Create a group to split expenses with friends.
            </Text>
            <Button onPress={openCreateGroup}>Create Group</Button>
            <Text style={styles.localHint}>
              Everything stays saved on this device.
            </Text>
          </View>
        </Card>
        {renderCreateGroupModal()}
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <Card style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View style={styles.heroText}>
            <Text style={styles.eyebrow}>Group Split</Text>
            <Text style={styles.groupTitle}>{activeGroup.name}</Text>
            <Text style={styles.groupSubtitle}>
              {activeGroup.currency} - {activeGroup.members.length} members
            </Text>
          </View>
          <View style={styles.pendingPill}>
            <Text style={styles.pendingLabel}>Pending</Text>
            <Text style={styles.pendingValue}>
              {pendingSettlement > 0 ? money(pendingSettlement) : "All settled"}
            </Text>
          </View>
        </View>
        <View style={styles.statGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Total spent</Text>
            <Text style={[styles.statValue, styles.heroStatValue]}>
              {money(totalSpent)}
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Expenses</Text>
            <Text style={[styles.statValue, styles.heroStatValue]}>
              {spendExpenses.length}
            </Text>
          </View>
        </View>
        <View style={styles.actionRow}>
          <Button onPress={openAddExpense}>Add Expense</Button>
          <Button variant="outline" onPress={openAddMember}>
            Add Member
          </Button>
        </View>
      </Card>

      {renderMembersSection()}
      {renderSettlementSection()}
      {renderExpenseList()}
      {renderSharedFundSection()}

      {renderCreateGroupModal()}
      {renderMemberModal()}
      {renderExpenseModal()}
      {renderSharedFundModal()}
      {renderConfirmDialog()}
    </View>
  );

  function renderMembersSection() {
    return (
      <Card>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Members</Text>
            <Text style={styles.sectionHint}>People sharing this group.</Text>
          </View>
          <Button variant="outline" onPress={openAddMember}>
            Add
          </Button>
        </View>
        {activeGroup.members.length ? (
          <View style={styles.memberGrid}>
            {activeGroup.members.map((member) => (
              <View key={member.id} style={styles.memberCard}>
                <MemberAvatar member={member} size="md" />
                <View style={styles.memberText}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberMeta}>
                    {
                      activeGroup.expenses.filter(
                        (expense) =>
                          expense.paidById === member.id ||
                          (expense.memberIds || []).includes(member.id) ||
                          (expense.contributors || []).some(
                            (contributor) => contributor.memberId === member.id,
                          ),
                      ).length
                    }{" "}
                    expenses
                  </Text>
                </View>
                <Button
                  variant="danger"
                  style={styles.smallButton}
                  onPress={() => requestDeleteMember(member.id)}
                >
                  Remove
                </Button>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.inlineEmpty}>
            <Text style={styles.inlineEmptyTitle}>No members yet</Text>
            <Text style={styles.inlineEmptyText}>
              Add at least two friends before splitting expenses.
            </Text>
          </View>
        )}
      </Card>
    );
  }

  function renderSettlementSection() {
    const hasDirectExpenses = directSettlement.expenses.length > 0;
    return (
      <Card style={styles.resultCard}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Who pays who?</Text>
            <Text style={styles.sectionHint}>
              Direct person-to-person expenses only.
            </Text>
          </View>
        </View>
        {!hasDirectExpenses ? (
          <View style={styles.inlineEmpty}>
            <Text style={styles.inlineEmptyTitle}>No direct expenses yet</Text>
            <Text style={styles.inlineEmptyText}>
              Add a person-paid expense to see who needs to pay whom.
            </Text>
          </View>
        ) : settlements.length ? (
          <View style={styles.settlementList}>
            {settlements.map((settlement) => (
              <View key={settlement.id} style={styles.settlementCard}>
                <MemberAvatar member={settlement.from} size="sm" showName />
                <Text style={styles.settlementText}>pays</Text>
                <Text style={styles.settlementAmount}>
                  {money(settlement.amount)}
                </Text>
                <Text style={styles.settlementText}>to</Text>
                <MemberAvatar member={settlement.to} size="sm" showName />
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.settledBox}>
            <Text style={styles.settledTitle}>All settled</Text>
            <Text style={styles.settledText}>
              No one needs to pay anyone back.
            </Text>
          </View>
        )}
        {hasDirectExpenses && memberSummaries.length ? (
          <View style={styles.directBalanceList}>
            <Text style={styles.subsectionTitle}>Direct balance breakdown</Text>
            {memberSummaries.map((summary) => (
              <View key={summary.id} style={styles.directBalanceRow}>
                <MemberAvatar member={summary} size="sm" showName />
                <Text style={styles.directBalanceText}>
                  Direct paid {money(summary.directPaid)} - Direct share{" "}
                  {money(summary.directShare)}
                </Text>
                <Text
                  style={[
                    styles.directBalanceValue,
                    summary.directBalance > 0
                      ? styles.balancePositive
                      : summary.directBalance < 0
                        ? styles.balanceNegative
                        : styles.balanceNeutral,
                  ]}
                >
                  {summary.directBalance > 0
                    ? `+${money(summary.directBalance)}`
                    : summary.directBalance < 0
                      ? money(summary.directBalance)
                      : "Settled"}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </Card>
    );
  }

  function renderExpenseDetail(expense) {
    const report = expenseReportsById.get(expense.id);
    if (!report) return null;
    const paidText =
      report.paymentSource === "sharedFund"
        ? "Paid from Shared Fund"
        : report.payers.length
          ? report.payers
              .map((payer) => `${payer.name} paid ${money(payer.amount)}`)
              .join(" - ")
          : "No human payer";
    const sharedText = report.participants.length
      ? report.participants.map((participant) => participant.name).join(", ")
      : "No human participants";
    const affectsText = report.includedInDirectSettlement
      ? "Direct settlement"
      : report.includedInSharedFund
        ? "Shared Fund only"
        : "Not included";

    return (
      <View style={styles.expenseDetailBlock}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Who paid</Text>
          <Text style={styles.detailValue}>{paidText}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Who shared</Text>
          <Text style={styles.detailValue}>{sharedText}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Split method</Text>
          <Text style={styles.detailValue}>{report.splitType}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Affects</Text>
          <Text style={styles.detailValue}>{affectsText}</Text>
        </View>
        {report.participants.length ? (
          <View style={styles.shareList}>
            {report.participants.map((participant) => (
              <View key={participant.memberId} style={styles.shareRow}>
                <Text style={styles.shareName}>{participant.name}</Text>
                <Text style={styles.shareAmount}>
                  {money(participant.shareAmount)}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
        {report.warnings?.length ? (
          <View style={styles.warningBox}>
            {report.warnings.map((warning) => (
              <Text key={warning} style={styles.warningText}>
                {warning}
              </Text>
            ))}
          </View>
        ) : null}
      </View>
    );
  }

  function renderExpenseList() {
    return (
      <Card>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Expenses</Text>
            <Text style={styles.sectionHint}>
              Recent costs added to this group.
            </Text>
          </View>
          <Button variant="outline" onPress={openAddExpense}>
            Add
          </Button>
        </View>
        {spendExpenses.length ? (
          <View style={styles.expenseList}>
            {[...spendExpenses].reverse().map((expense) => {
              const expanded = expandedExpenseId === expense.id;
              return (
                <View key={expense.id} style={styles.expenseCard}>
                  <View style={styles.expenseMainRow}>
                    <View style={styles.expenseLeft}>
                      <Text style={styles.expenseTitle}>{expense.title}</Text>
                      <Text style={styles.expenseMeta}>
                        {getContributorText(activeGroup, expense) || "No payer"} -{" "}
                        Shared by{" "}
                        {formatMemberList(activeGroup.members, expense.memberIds)}
                      </Text>
                    </View>
                    <View style={styles.expenseRight}>
                      <Text style={styles.expenseAmount}>
                        {money(expense.amount)}
                      </Text>
                      <View style={styles.expenseButtonRow}>
                        <Button
                          variant="outline"
                          style={styles.smallButton}
                          onPress={() =>
                            setExpandedExpenseId(expanded ? null : expense.id)
                          }
                        >
                          {expanded ? "Hide" : "Details"}
                        </Button>
                        <Button
                          variant="danger"
                          style={styles.smallButton}
                          onPress={() => requestDeleteExpense(expense.id)}
                        >
                          Delete
                        </Button>
                      </View>
                    </View>
                  </View>
                  {expanded ? renderExpenseDetail(expense) : null}
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.inlineEmpty}>
            <Text style={styles.inlineEmptyTitle}>No expenses added</Text>
            <Text style={styles.inlineEmptyText}>
              Add who paid and who shared the cost.
            </Text>
          </View>
        )}
      </Card>
    );
  }

  function renderSharedFundSection() {
    const enabled = activeGroup.sharedFund?.enabled || fundSummary.hasActivity;
    return (
      <Card>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionText}>
            <Text style={styles.sectionTitle}>Shared Fund</Text>
            <Text style={styles.sectionHint}>
              Use Shared Fund when your group collects money first and spends
              from that balance.
            </Text>
          </View>
          <Button variant="outline" onPress={openSharedFund}>
            {enabled ? "Manage" : "Set Up"}
          </Button>
        </View>
        <View style={styles.fundStats}>
          <View style={styles.fundStat}>
            <Text style={styles.statLabel}>Current balance</Text>
            <Text style={styles.statValue}>{money(fundSummary.balance)}</Text>
          </View>
          <View style={styles.fundStat}>
            <Text style={styles.statLabel}>Total deposited</Text>
            <Text style={styles.statValue}>{money(fundSummary.deposits)}</Text>
          </View>
          <View style={styles.fundStat}>
            <Text style={styles.statLabel}>Spent from fund</Text>
            <Text style={styles.statValue}>{money(fundSummary.spend)}</Text>
          </View>
        </View>
        {fundSummary.hasActivity ? (
          <>
            <View style={styles.fundDetailBlock}>
              <Text style={styles.subsectionTitle}>Fund status by member</Text>
              <View style={styles.fundPositionList}>
                {fundSummary.memberPositions.map((position) => (
                  <View key={position.id} style={styles.fundPositionRow}>
                    <MemberAvatar member={position} size="sm" showName />
                    <View style={styles.fundPositionNumbers}>
                      <Text style={styles.fundPositionMeta}>
                        Deposited {money(position.deposited)}
                      </Text>
                      <Text style={styles.fundPositionMeta}>
                        Used from fund {money(position.used)}
                      </Text>
                      <Text
                        style={[
                          styles.fundPositionNet,
                          position.net > 0
                            ? styles.balancePositive
                            : position.net < 0
                              ? styles.balanceNegative
                              : styles.balanceNeutral,
                        ]}
                      >
                        Net fund position{" "}
                        {position.net > 0
                          ? `+${money(position.net)}`
                          : money(position.net)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {fundSpends.length ? (
              <View style={styles.fundDetailBlock}>
                <Text style={styles.subsectionTitle}>Fund-paid expenses</Text>
                <View style={styles.expenseList}>
                  {fundSpends.map((expense) => (
                    <View key={expense.id} style={styles.expenseCard}>
                      <View style={styles.expenseMainRow}>
                        <View style={styles.expenseLeft}>
                          <Text style={styles.expenseTitle}>{expense.title}</Text>
                          <Text style={styles.expenseMeta}>
                            Paid from Shared Fund - Shared by{" "}
                            {formatMemberList(activeGroup.members, expense.memberIds)}
                          </Text>
                        </View>
                        <Text style={styles.expenseAmount}>
                          {money(expense.amount)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </>
        ) : null}
      </Card>
    );
  }

  function renderCreateGroupModal() {
    return (
      <Modal transparent visible={modal === "createGroup"} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Create Group</Text>
            <Text style={styles.modalHint}>
              Start a local group to split expenses with friends.
            </Text>
            <Text style={styles.fieldLabel}>Group Name</Text>
            <TextInput
              value={createForm.name}
              onChangeText={(value) =>
                setCreateForm((current) => ({
                  ...current,
                  name: value,
                  error: "",
                }))
              }
              placeholder="Trip, lunch, hostel room"
              style={styles.input}
            />
            <Text style={styles.fieldLabel}>Currency</Text>
            <TextInput
              value={createForm.currency}
              onChangeText={(value) =>
                setCreateForm((current) => ({
                  ...current,
                  currency: value.toUpperCase(),
                  error: "",
                }))
              }
              placeholder="BDT"
              style={styles.input}
              autoCapitalize="characters"
            />
            {createForm.error ? (
              <Text style={styles.errorText}>{createForm.error}</Text>
            ) : null}
            <View style={styles.modalActions}>
              <Button variant="outline" onPress={() => setModal(null)}>
                Cancel
              </Button>
              <Button onPress={createGroup}>Create Group</Button>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  function renderMemberModal() {
    return (
      <Modal transparent visible={modal === "addMember"} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Member</Text>
            <Text style={styles.modalHint}>
              Add someone who will share expenses in this group.
            </Text>
            <Text style={styles.fieldLabel}>Member name</Text>
            <TextInput
              value={memberForm.name}
              onChangeText={(value) =>
                setMemberForm({ name: value, error: "" })
              }
              placeholder="Friend name"
              style={styles.input}
            />
            {memberForm.error ? (
              <Text style={styles.errorText}>{memberForm.error}</Text>
            ) : null}
            <View style={styles.modalActions}>
              <Button variant="outline" onPress={() => setModal(null)}>
                Cancel
              </Button>
              <Button onPress={addMember}>Add Member</Button>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  function renderExpenseModal() {
    if (!expenseForm || !activeGroup) return null;
    const amount = Number(expenseForm.amount) || 0;
    const participantMembers = activeGroup.members.filter((member) =>
      expenseForm.participantIds.includes(member.id),
    );
    return (
      <Modal transparent visible={modal === "addExpense"} animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.sheet}>
            <Text style={styles.modalTitle}>Add Expense</Text>
            <Text style={styles.modalHint}>
              Add who paid, who shared it, and how to split the amount.
            </Text>

            <Text style={styles.fieldLabel}>Expense title</Text>
            <TextInput
              value={expenseForm.title}
              onChangeText={(value) => patchExpenseForm({ title: value })}
              placeholder="Food, hotel, transport"
              style={styles.input}
            />
            <Text style={styles.fieldLabel}>Amount</Text>
            <TextInput
              value={expenseForm.amount}
              onChangeText={(value) => patchExpenseForm({ amount: value })}
              placeholder="0"
              keyboardType="numeric"
              style={styles.input}
            />

            {!expenseForm.payFromFund && !expenseForm.multiplePayers ? (
              <>
                <Text style={styles.fieldLabel}>Who paid?</Text>
                <View style={styles.choiceWrap}>
                  {activeGroup.members.map((member) => (
                    <ChoiceButton
                      key={member.id}
                      active={expenseForm.paidById === member.id}
                      onPress={() => patchExpenseForm({ paidById: member.id })}
                    >
                      <MemberAvatar member={member} size="sm" />
                      <Text
                        style={[
                          styles.choiceText,
                          expenseForm.paidById === member.id &&
                            styles.choiceTextActive,
                        ]}
                      >
                        {member.name}
                      </Text>
                    </ChoiceButton>
                  ))}
                </View>
              </>
            ) : null}

            <Text style={styles.fieldLabel}>Who shared this expense?</Text>
            <View style={styles.choiceWrap}>
              {activeGroup.members.map((member) => (
                <ChoiceButton
                  key={member.id}
                  active={expenseForm.participantIds.includes(member.id)}
                  onPress={() => toggleParticipant(member.id)}
                >
                  <MemberAvatar member={member} size="sm" />
                  <Text
                    style={[
                      styles.choiceText,
                      expenseForm.participantIds.includes(member.id) &&
                        styles.choiceTextActive,
                    ]}
                  >
                    {member.name}
                  </Text>
                </ChoiceButton>
              ))}
            </View>

            <Text style={styles.fieldLabel}>How should we split it?</Text>
            <View style={styles.choiceWrap}>
              {["equal", "custom", "percentage"].map((type) => (
                <ChoiceButton
                  key={type}
                  active={expenseForm.splitType === type}
                  onPress={() =>
                    patchExpenseForm({
                      splitType: type,
                      customAmounts: {},
                      advancedOpen: type !== "equal" || expenseForm.advancedOpen,
                    })
                  }
                >
                  <Text
                    style={[
                      styles.choiceText,
                      expenseForm.splitType === type && styles.choiceTextActive,
                    ]}
                  >
                    {type === "equal"
                      ? "Equal"
                      : type === "custom"
                        ? "Custom amounts"
                        : "Percentages"}
                  </Text>
                </ChoiceButton>
              ))}
            </View>

            <Button
              variant="outline"
              onPress={() =>
                patchExpenseForm({ advancedOpen: !expenseForm.advancedOpen })
              }
            >
              {expenseForm.advancedOpen ? "Hide Advanced Options" : "Advanced Options"}
            </Button>

            {expenseForm.advancedOpen ? (
              <View style={styles.advancedBox}>
                <View style={styles.toggleLine}>
                  <Text style={styles.fieldLabel}>Multiple people paid</Text>
                  <Button
                    variant={expenseForm.multiplePayers ? "primary" : "outline"}
                    onPress={() =>
                      patchExpenseForm({
                        multiplePayers: !expenseForm.multiplePayers,
                        payFromFund: false,
                        payerAmounts: {},
                      })
                    }
                  >
                    {expenseForm.multiplePayers ? "On" : "Off"}
                  </Button>
                </View>

                <View style={styles.toggleLine}>
                  <Text style={styles.fieldLabel}>Paid from Shared Fund</Text>
                  <Button
                    variant={expenseForm.payFromFund ? "primary" : "outline"}
                    onPress={() =>
                      patchExpenseForm({
                        payFromFund: !expenseForm.payFromFund,
                        multiplePayers: false,
                        payerAmounts: {},
                      })
                    }
                  >
                    {expenseForm.payFromFund ? "On" : "Off"}
                  </Button>
                </View>

                {expenseForm.payFromFund ? (
                  <Text style={styles.helperText}>
                    Shared Fund balance: {money(fundSummary.balance)}
                  </Text>
                ) : null}

                {expenseForm.multiplePayers ? (
                  <View style={styles.fieldStack}>
                    <Text style={styles.fieldLabel}>Who paid how much?</Text>
                    {activeGroup.members.map((member) => (
                      <AmountRow
                        key={member.id}
                        label={member.name}
                        value={expenseForm.payerAmounts[member.id] || ""}
                        onChange={(value) =>
                          patchExpenseForm({
                            payerAmounts: {
                              ...expenseForm.payerAmounts,
                              [member.id]: value,
                            },
                          })
                        }
                      />
                    ))}
                  </View>
                ) : null}

                {expenseForm.splitType !== "equal" ? (
                  <View style={styles.fieldStack}>
                    <Text style={styles.fieldLabel}>
                      {expenseForm.splitType === "custom"
                        ? "Custom amount for each person"
                        : "Percentage for each person"}
                    </Text>
                    {participantMembers.map((member) => (
                      <AmountRow
                        key={member.id}
                        label={member.name}
                        placeholder={
                          expenseForm.splitType === "custom" ? "BDT" : "%"
                        }
                        value={expenseForm.customAmounts[member.id] || ""}
                        onChange={(value) =>
                          patchExpenseForm({
                            customAmounts: {
                              ...expenseForm.customAmounts,
                              [member.id]: value,
                            },
                          })
                        }
                      />
                    ))}
                  </View>
                ) : null}
              </View>
            ) : null}

            {amount > 0 && expenseForm.participantIds.length ? (
              <View style={styles.previewBox}>
                <Text style={styles.previewTitle}>Preview</Text>
                <Text style={styles.previewText}>
                  {expenseForm.title.trim() || "This expense"} will be shared by{" "}
                  {formatMemberList(activeGroup.members, expenseForm.participantIds)}.
                </Text>
              </View>
            ) : null}

            {expenseForm.error ? (
              <Text style={styles.errorText}>{expenseForm.error}</Text>
            ) : null}
            <View style={styles.modalActions}>
              <Button variant="outline" onPress={() => setModal(null)}>
                Cancel
              </Button>
              <Button onPress={saveExpense}>Save Expense</Button>
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  }

  function renderSharedFundModal() {
    if (!activeGroup) return null;
    return (
      <Modal transparent visible={modal === "sharedFund"} animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.sheet}>
            <Text style={styles.modalTitle}>Shared Fund</Text>
            <Text style={styles.modalHint}>
              Use Shared Fund when your group collects money first and spends
              from that balance. This is only a local planning balance, not a
              bank wallet.
            </Text>
            <View style={styles.fundStats}>
              <View style={styles.fundStat}>
                <Text style={styles.statLabel}>Current balance</Text>
                <Text style={styles.statValue}>{money(fundSummary.balance)}</Text>
              </View>
              <View style={styles.fundStat}>
                <Text style={styles.statLabel}>Total deposited</Text>
                <Text style={styles.statValue}>{money(fundSummary.deposits)}</Text>
              </View>
              <View style={styles.fundStat}>
                <Text style={styles.statLabel}>Spent from fund</Text>
                <Text style={styles.statValue}>{money(fundSummary.spend)}</Text>
              </View>
            </View>
            <Text style={styles.fieldLabel}>Who deposited?</Text>
            <View style={styles.choiceWrap}>
              {activeGroup.members.map((member) => (
                <ChoiceButton
                  key={member.id}
                  active={fundForm.memberId === member.id}
                  onPress={() =>
                    setFundForm((current) => ({
                      ...current,
                      memberId: member.id,
                      error: "",
                    }))
                  }
                >
                  <MemberAvatar member={member} size="sm" />
                  <Text
                    style={[
                      styles.choiceText,
                      fundForm.memberId === member.id && styles.choiceTextActive,
                    ]}
                  >
                    {member.name}
                  </Text>
                </ChoiceButton>
              ))}
            </View>
            <Text style={styles.fieldLabel}>Deposit amount</Text>
            <TextInput
              value={fundForm.amount}
              onChangeText={(value) =>
                setFundForm((current) => ({ ...current, amount: value, error: "" }))
              }
              placeholder="0"
              keyboardType="numeric"
              style={styles.input}
            />
            {fundForm.error ? (
              <Text style={styles.errorText}>{fundForm.error}</Text>
            ) : null}
            {fundSummary.hasActivity ? (
              <View style={styles.fundDetailBlock}>
                <Text style={styles.subsectionTitle}>Deposits by member</Text>
                <View style={styles.fundPositionList}>
                  {fundSummary.memberPositions.map((position) => (
                    <View key={position.id} style={styles.fundPositionRow}>
                      <MemberAvatar member={position} size="sm" showName />
                      <View style={styles.fundPositionNumbers}>
                        <Text style={styles.fundPositionMeta}>
                          Deposited {money(position.deposited)}
                        </Text>
                        <Text style={styles.fundPositionMeta}>
                          Used from fund {money(position.used)}
                        </Text>
                        <Text
                          style={[
                            styles.fundPositionNet,
                            position.net > 0
                              ? styles.balancePositive
                              : position.net < 0
                                ? styles.balanceNegative
                                : styles.balanceNeutral,
                          ]}
                        >
                          Net fund position{" "}
                          {position.net > 0
                            ? `+${money(position.net)}`
                            : money(position.net)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
            {fundSummary.hasActivity ? (
              <View style={styles.fundDetailBlock}>
                <Text style={styles.subsectionTitle}>Shared Fund activity</Text>
                <View style={styles.expenseList}>
                  {fundDeposits.map((deposit) => (
                    <View key={deposit.id} style={styles.expenseCard}>
                      <View style={styles.expenseMainRow}>
                        <View style={styles.expenseLeft}>
                          <Text style={styles.expenseTitle}>Deposit</Text>
                          <Text style={styles.expenseMeta}>
                            {getContributorText(activeGroup, deposit)}
                          </Text>
                        </View>
                        <Text style={styles.expenseAmount}>
                          {money(deposit.amount)}
                        </Text>
                      </View>
                    </View>
                  ))}
                  {fundSpends.map((expense) => (
                    <View key={expense.id} style={styles.expenseCard}>
                      <View style={styles.expenseMainRow}>
                        <View style={styles.expenseLeft}>
                          <Text style={styles.expenseTitle}>{expense.title}</Text>
                          <Text style={styles.expenseMeta}>
                            Paid from Shared Fund - Shared by{" "}
                            {formatMemberList(activeGroup.members, expense.memberIds)}
                          </Text>
                        </View>
                        <Text style={styles.expenseAmount}>
                          {money(expense.amount)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
            <View style={styles.modalActions}>
              <Button variant="outline" onPress={() => setModal(null)}>
                Close
              </Button>
              <Button onPress={addFundDeposit}>Add Deposit</Button>
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  }

  function renderConfirmDialog() {
    if (!confirm) return null;
    return (
      <Modal transparent visible animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{confirm.title}</Text>
            <Text style={styles.modalHint}>{confirm.message}</Text>
            <View style={styles.modalActions}>
              {!confirm.hideCancel ? (
                <Button variant="outline" onPress={() => setConfirm(null)}>
                  Cancel
                </Button>
              ) : null}
              <Button
                variant={confirm.danger ? "danger" : "primary"}
                onPress={confirm.onConfirm}
              >
                {confirm.actionLabel}
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    );
  }
}

function ChoiceButton({ active, onPress, children }) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.choiceButton, active && styles.choiceButtonActive]}
    >
      {children}
    </TouchableOpacity>
  );
}

function AmountRow({ label, value, onChange, placeholder = "BDT" }) {
  return (
    <View style={styles.amountRow}>
      <Text style={styles.amountLabel}>{label}</Text>
      <TextInput
        value={String(value || "")}
        onChangeText={onChange}
        keyboardType="numeric"
        placeholder={placeholder}
        style={styles.amountInput}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 16,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 10,
  },
  emptyTitle: {
    color: "#0f172a",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
  },
  emptyText: {
    color: "#64748b",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
  },
  localHint: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "700",
  },
  heroCard: {
    backgroundColor: "#0f172a",
    borderColor: "#0f172a",
  },
  heroTop: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 14,
  },
  heroText: {
    flex: 1,
    minWidth: 180,
  },
  eyebrow: {
    color: "#34d399",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  groupTitle: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 4,
  },
  groupSubtitle: {
    color: "#cbd5f5",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
  pendingPill: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 128,
  },
  pendingLabel: {
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  pendingValue: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
    marginTop: 3,
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 16,
  },
  statBox: {
    flex: 1,
    minWidth: 130,
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 12,
  },
  statLabel: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "800",
  },
  statValue: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "900",
    marginTop: 4,
  },
  heroStatValue: {
    color: "#ffffff",
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  sectionText: {
    flex: 1,
  },
  sectionTitle: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "900",
  },
  sectionHint: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 4,
    lineHeight: 18,
  },
  memberGrid: {
    gap: 10,
  },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 10,
  },
  memberText: {
    flex: 1,
  },
  memberName: {
    color: "#0f172a",
    fontWeight: "900",
  },
  memberMeta: {
    color: "#64748b",
    fontSize: 11,
    marginTop: 2,
  },
  smallButton: {
    minHeight: 34,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  resultCard: {
    borderColor: "#bbf7d0",
    backgroundColor: "#f0fdf4",
  },
  settlementList: {
    gap: 10,
  },
  settlementCard: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ffffff",
    borderColor: "#dcfce7",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  settlementText: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "700",
  },
  settlementAmount: {
    color: "#0f172a",
    fontWeight: "900",
  },
  directBalanceList: {
    marginTop: 12,
    gap: 8,
  },
  directBalanceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 10,
  },
  directBalanceText: {
    flex: 1,
    minWidth: 180,
    color: "#64748b",
    fontSize: 12,
    fontWeight: "700",
  },
  directBalanceValue: {
    fontSize: 12,
    fontWeight: "900",
  },
  settledBox: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  settledTitle: {
    color: "#047857",
    fontSize: 18,
    fontWeight: "900",
  },
  settledText: {
    color: "#047857",
    fontSize: 12,
    marginTop: 4,
  },
  inlineEmpty: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  inlineEmptyTitle: {
    color: "#0f172a",
    fontWeight: "900",
  },
  inlineEmptyText: {
    color: "#64748b",
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
  },
  expenseList: {
    gap: 10,
  },
  expenseCard: {
    gap: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 12,
  },
  expenseMainRow: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    alignItems: "flex-start",
  },
  expenseLeft: {
    flex: 1,
    minWidth: 190,
  },
  expenseRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  expenseButtonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: 6,
  },
  expenseTitle: {
    color: "#0f172a",
    fontWeight: "900",
  },
  expenseMeta: {
    color: "#64748b",
    fontSize: 11,
    marginTop: 4,
    lineHeight: 16,
  },
  expenseAmount: {
    color: "#0f172a",
    fontWeight: "900",
  },
  expenseDetailBlock: {
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 10,
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
  },
  detailLabel: {
    color: "#475569",
    fontSize: 11,
    fontWeight: "900",
    minWidth: 92,
  },
  detailValue: {
    flex: 1,
    minWidth: 180,
    color: "#0f172a",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
  },
  shareList: {
    gap: 6,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 10,
  },
  shareRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  shareName: {
    color: "#0f172a",
    fontSize: 12,
    fontWeight: "800",
  },
  shareAmount: {
    color: "#0f172a",
    fontSize: 12,
    fontWeight: "900",
  },
  warningBox: {
    backgroundColor: "#fff7ed",
    borderRadius: 10,
    padding: 10,
  },
  warningText: {
    color: "#9a3412",
    fontSize: 12,
    fontWeight: "800",
  },
  fundStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  fundStat: {
    flex: 1,
    minWidth: 100,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 10,
  },
  fundDetailBlock: {
    marginTop: 14,
    gap: 10,
  },
  subsectionTitle: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "900",
  },
  fundPositionList: {
    gap: 8,
  },
  fundPositionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 10,
  },
  fundPositionNumbers: {
    flex: 1,
    gap: 2,
  },
  fundPositionMeta: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "700",
  },
  fundPositionNet: {
    fontSize: 12,
    fontWeight: "900",
  },
  balancePositive: {
    color: "#047857",
  },
  balanceNegative: {
    color: "#b91c1c",
  },
  balanceNeutral: {
    color: "#64748b",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.42)",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
    gap: 10,
  },
  sheet: {
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
    gap: 10,
  },
  modalTitle: {
    color: "#0f172a",
    fontSize: 22,
    fontWeight: "900",
  },
  modalHint: {
    color: "#64748b",
    fontSize: 13,
    lineHeight: 19,
  },
  fieldLabel: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "900",
  },
  input: {
    borderWidth: 1,
    borderColor: "#dbe4ee",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: "#f8fafc",
    color: "#0f172a",
  },
  choiceWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  choiceButton: {
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  choiceButtonActive: {
    backgroundColor: "#0f172a",
    borderColor: "#0f172a",
  },
  choiceText: {
    color: "#0f172a",
    fontSize: 12,
    fontWeight: "800",
  },
  choiceTextActive: {
    color: "#ffffff",
  },
  advancedBox: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  toggleLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  helperText: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "700",
  },
  fieldStack: {
    gap: 8,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  amountLabel: {
    flex: 1,
    color: "#0f172a",
    fontWeight: "800",
  },
  amountInput: {
    width: 110,
    borderWidth: 1,
    borderColor: "#dbe4ee",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    textAlign: "right",
    backgroundColor: "#ffffff",
  },
  previewBox: {
    backgroundColor: "#ecfdf5",
    borderRadius: 12,
    padding: 12,
  },
  previewTitle: {
    color: "#047857",
    fontWeight: "900",
  },
  previewText: {
    color: "#047857",
    fontSize: 12,
    marginTop: 4,
  },
  errorText: {
    color: "#b91c1c",
    fontSize: 12,
    fontWeight: "800",
  },
  modalActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 4,
  },
});

export default GroupSplitTab;
