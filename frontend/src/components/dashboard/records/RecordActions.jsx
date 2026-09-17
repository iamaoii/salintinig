import { useNavigate } from 'react-router-dom';
import { PencilSimple, DownloadSimple, FloppyDisk } from '@phosphor-icons/react';

export default function RecordActions({ isEditing = false, onEdit, onSave, onCancel }) {
  const navigate = useNavigate();

  return (
    <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-ink/10 pt-4">
      {isEditing ? (
        <>
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-2 rounded-[10px] border border-ink/20 bg-white px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-ink/5 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            className="flex items-center gap-2 rounded-[10px] bg-brand-blue px-4 py-2.5 text-sm font-medium text-cream shadow-sm transition-colors hover:bg-blue-700 cursor-pointer"
          >
            <FloppyDisk size={16} />
            Save Changes
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-2 rounded-[10px] bg-brand-blue px-4 py-2.5 text-sm font-medium text-cream shadow-sm transition-colors hover:bg-blue-700 cursor-pointer"
        >
          <PencilSimple size={16} />
          Edit Record
        </button>
      )}

      <button
        type="button"
        onClick={() => navigate('/teacher/phil-iri-records/export-success')}
        className="flex items-center gap-2 rounded-[10px] bg-brand-red px-4 py-2.5 text-sm font-medium text-cream shadow-sm transition-colors hover:bg-red-700 cursor-pointer"
      >
        <DownloadSimple size={16} />
        Download PDF
      </button>
    </div>
  );
}
