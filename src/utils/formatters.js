/**
 * Formatting utility functions meeting all Task 1 specifications.
 */

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Formats a date into DD Mon YYYY format (e.g., 05 Nov 2026).
 * Handles string YYYY-MM-DD, ISO timestamps, or Date instances robustly.
 */
export function formatDate(dateInput) {
  if (!dateInput) return "";

  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateInput)) {
    const parts = dateInput.split('T')[0].split('-');
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parts[2].padStart(2, '0');
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${day} ${MONTH_NAMES[monthIndex]} ${year}`;
    }
  }

  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);

  const day = String(d.getDate()).padStart(2, '0');
  const month = MONTH_NAMES[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Formats duration in minutes into hours and minutes, omitting any zero part:
 * 90  -> "1 h 30 min"
 * 45  -> "45 min"
 * 120 -> "2 h"
 */
export function formatDuration(minutes) {
  const mins = Number(minutes);
  if (isNaN(mins) || mins <= 0) return "0 min";

  const h = Math.floor(mins / 60);
  const m = mins % 60;

  if (h > 0 && m > 0) {
    return `${h} h ${m} min`;
  }
  if (h > 0 && m === 0) {
    return `${h} h`;
  }
  return `${m} min`;
}

/**
 * Formats fee: ₹ with two decimals, or "Free" when it is 0.
 * Examples: 0 -> "Free", 150 -> "₹150.00", 49.5 -> "₹49.50"
 */
export function formatFee(fee) {
  const num = Number(fee);
  if (isNaN(num) || num === 0) {
    return "Free";
  }
  return `₹${num.toFixed(2)}`;
}

/**
 * Formats seat status: "<n> seats left", or "Full" when n is 0.
 */
export function formatSeatStatus(seats) {
  const n = Number(seats);
  if (isNaN(n) || n <= 0) {
    return "Full";
  }
  return `${n} seats left`;
}
