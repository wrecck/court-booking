export const venue = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Baseline Racquet Club",
  shortName: "BRC",
  location: "Makati City",
  address: "214 Chino Roces Avenue, Makati",
  timezone: "Asia/Manila",
  holdMinutes: 15,
};

export const courts = [
  { id: "court-1", name: "Centre Court", surface: "Hard", indoor: false },
  { id: "court-2", name: "Court Two", surface: "Hard", indoor: false },
  { id: "court-3", name: "Garden Court", surface: "Synthetic", indoor: false },
  { id: "court-4", name: "Covered Court", surface: "Hard", indoor: true },
];

export const paymentMethods = [
  { id: "gcash-online", name: "GCash checkout", description: "Instant confirmation through secure checkout", mode: "automatic" as const, type: "gcash" as const, enabled: true },
  { id: "gcash-manual", name: "GCash transfer", description: "Send to 0917 123 4567 · Baseline Racquet Club", mode: "manual" as const, type: "gcash" as const, enabled: true },
  { id: "bdo-manual", name: "BDO bank transfer", description: "Account ending in 4821 · Baseline Racquet Club Inc.", mode: "manual" as const, type: "bank" as const, enabled: true },
];

export const recentBookings = [
  { reference: "BK-2048", guest: "Mika Santos", court: "Centre Court", time: "6:00 PM", status: "Confirmed", amount: "₱600" },
  { reference: "BK-2047", guest: "Anton Reyes", court: "Court Two", time: "5:00 PM", status: "Review", amount: "₱500" },
  { reference: "BK-2046", guest: "Lara Lim", court: "Covered Court", time: "4:30 PM", status: "Confirmed", amount: "₱750" },
  { reference: "BK-2045", guest: "Sam dela Cruz", court: "Garden Court", time: "3:00 PM", status: "Held", amount: "₱500" },
];
