import { useNavigate } from 'react-router-dom';
import { PencilSimple, DownloadSimple, FloppyDisk, Plus } from '@phosphor-icons/react';

export default function RecordActions({ isEditing = false, onEdit, onSave, onCancel, onAddRow }) {
  const navigate = useNavigate();

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-4">
      <div>
        {isEditing && onAddRow && (
          <button
            type="button"
            onClick={onAddRow}
            className="flex items-center gap-1.5 rounded-[10px] border border-brand-blue/40 bg-brand-blue/10 px-4 py-2.5 text-sm font-bold text-brand-blue hover:bg-brand-blue/20 transition-colors cursor-pointer"
          >
            <Plus size={16} weight="bold" />
            Add Learner Row
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        {isEditing ? (
          <>
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center gap-2 rounded-[10px] border border-ink/20 bg-white px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-ink/5 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSave}
              className="flex items-center gap-2 rounded-[10px] bg-brand-blue px-4 py-2.5 text-sm font-bold text-cream shadow-sm transition-colors hover:bg-blue-700 cursor-pointer"
            >
              <FloppyDisk size={16} />
              Save Changes
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-2 rounded-[10px] bg-brand-blue px-4 py-2.5 text-sm font-bold text-cream shadow-sm transition-colors hover:bg-blue-700 cursor-pointer"
          >
            <PencilSimple size={16} />
            Edit Record
          </button>
        )}

        <button
          type="button"
          onClick={() => navigate('/teacher/phil-iri-records/export-success')}
          className="flex items-center gap-2 rounded-[10px] bg-brand-red px-4 py-2.5 text-sm font-bold text-cream shadow-sm transition-colors hover:bg-red-700 cursor-pointer"
        >
          <DownloadSimple size={16} />
          Download PDF
        </button>
      </div>
    </div>
  );
}
