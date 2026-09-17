import { CaretLeft, CaretRight } from '@phosphor-icons/react';

export default function Pagination({ page, pageCount, onPageChange }) {
  if (pageCount <= 1) return null;

  return (
    <div className="flex items-center justify-end gap-2 py-4">
      <button
        type="button"
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        className="flex size-8 items-center justify-center rounded-full text-ink/60 hover:bg-ink/5 disabled:opacity-30"
      >
        <CaretLeft size={16} />
      </button>
      <span className="text-sm text-ink/60">
        Page {page} of {pageCount}
      </span>
      <button
        type="button"
        disabled={page === pageCount}
        onClick={() => onPageChange(page + 1)}
        className="flex size-8 items-center justify-center rounded-full text-ink/60 hover:bg-ink/5 disabled:opacity-30"
      >
        <CaretRight size={16} />
      </button>
    </div>
  );
}
