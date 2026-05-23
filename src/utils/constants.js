import { todayLabel } from "./helpers";

export const categories = [
  {
    category: "Food",
    subcategories: ["Meal", "Snacks", "Restaurant", "Beverage"],
  },
  {
    category: "Transport",
    subcategories: ["Bus/Fare", "Ride/Fare", "Rickshaw", "CNG"],
  },
  {
    category: "Groceries",
    subcategories: [
      "Household",
      "Vegetables",
      "Receipt Total",
      "Discount",
      "Adjustment",
    ],
  },
  {
    category: "Utilities",
    subcategories: ["Mobile/Internet", "Electricity", "Water"],
  },
  {
    category: "Education",
    subcategories: ["Study", "Books", "Stationery", "Tuition"],
  },
  { category: "Health", subcategories: ["Medical", "Pharmacy", "Doctor"] },
  {
    category: "Entertainment",
    subcategories: ["Streaming", "Movie", "Drinks", "Games"],
  },
  { category: "Social", subcategories: ["Gift/Event", "Wedding", "Treat"] },
  { category: "Income", subcategories: ["Salary", "Allowance", "Refund"] },
  { category: "Miscellaneous", subcategories: ["General"] },
];

export const samplePrompts = [
  "bus bara 80 taka",
  "ajka biya dawa 1000 taka",
  "mobile recharge 99",
  "amar koto baki ache?",
  "Can I afford 800 taka dinner tonight?",
  "Set my budget to 12000",
];

export const navTabs = [
  { key: "assistant", label: "🤖 AI Assistant" },
  { key: "dashboard", label: "📊 Dashboard" },
  { key: "receipt", label: "📷 Receipt" },
  { key: "group", label: "👥 Group Split" },
  { key: "store", label: "🏪 Store Ready" },
];

export const defaultExpenses = [
  {
    id: crypto.randomUUID(),
    amount: 120,
    currency: "BDT",
    category: "Food",
    subcategory: "Snacks",
    note: "Singara and tea",
    merchant: "Campus Canteen",
    date: todayLabel,
  },
  {
    id: crypto.randomUUID(),
    amount: 80,
    currency: "BDT",
    category: "Transport",
    subcategory: "Bus/Fare",
    note: "Bus to UIU",
    merchant: null,
    date: todayLabel,
  },
];

export const DEFAULT_BUDGET = 10000;
export const DAYS_IN_MONTH = 30;
export const DAYS_PASSED = 12;
export const CURRENCY = "BDT";
export const LOCAL_STORAGE_KEY = "finvision-v3";
