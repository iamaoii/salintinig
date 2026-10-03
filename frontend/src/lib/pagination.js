/**
 * Produces a compact, conventional pagination sequence.
 * Example: 1, 2, 3, 4, 5, …, 23
 */
export function getCompactPageItems(totalPages, currentPage) {
  const total = Math.max(1, Number(totalPages) || 1);
  const current = Math.min(Math.max(1, Number(currentPage) || 1), total);

  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);

  const visible = new Set([1, total, current - 1, current, current + 1]);
  if (current <= 4) [2, 3, 4, 5].forEach((page) => visible.add(page));
  if (current >= total - 3) [total - 4, total - 3, total - 2, total - 1].forEach((page) => visible.add(page));

  const pages = [...visible]
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b);

  return pages.flatMap((page, index) => (
    index > 0 && page - pages[index - 1] > 1 ? ['ellipsis', page] : [page]
  ));
}
