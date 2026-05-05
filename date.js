/**
 * Localized post date formatter
 * 
 * Reads elements with [post-date] attribute and reformats their dates
 * to match the page locale (es-MX or pt-BR). Supports two text patterns:
 *   - "12 min / 29 Apr"  → "12 min / 29 Abr"
 *   - "29 Apr"           → "29 Abr"
 */
document.addEventListener("DOMContentLoaded", () => {
  const dateElements = document.querySelectorAll("[post-date]");
  if (!dateElements.length) return;

  // Detect locale from <html lang="..."> attribute
  const pageLang = document.documentElement.lang.toLowerCase();
  const locale = pageLang.startsWith("pt") ? "pt-BR" : "es-MX";
  const dateOptions = { day: "numeric", month: "short" };

  /**
   * Parses a date string (e.g. "29 Apr") and returns it formatted
   * for the current locale, with the month capitalized.
   * Returns null if the input cannot be parsed.
   */
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;

    let formatted = new Intl.DateTimeFormat(locale, dateOptions).format(date);

    // Remove any trailing periods (e.g. "abr." → "abr")
    formatted = formatted.replace(/\./g, "");

    // Capitalize the month abbreviation to match the original design
    return formatted.replace(/\s([a-z])/, (_, char) => ` ${char.toUpperCase()}`);
  };

  dateElements.forEach((el) => {
    const rawText = el.textContent.trim();
    const parts = rawText.split("/").map((part) => part.trim());

    if (parts.length === 2) {
      // Pattern: "12 min / 29 Apr"
      const formatted = formatDate(parts[1]);
      if (formatted) el.textContent = `${parts[0]} / ${formatted}`;
    } else {
      // Pattern: "29 Apr"
      const formatted = formatDate(rawText);
      if (formatted) el.textContent = formatted;
    }
  });
});
