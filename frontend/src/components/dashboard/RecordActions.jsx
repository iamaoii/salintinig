import { useNavigate } from 'react-router-dom';
import { PencilSimple, DownloadSimple } from '@phosphor-icons/react';

export default function RecordActions() {
  const navigate = useNavigate();

  return (
    <div className="mt-4 flex justify-end gap-3">
      <button
        type="button"
        className="flex items-center gap-2 rounded-[10px] bg-brand-blue px-4 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-blue-700"
      >
        <PencilSimple size={16} />
        Edit Record
      </button>
      <button
        type="button"
        onClick={() => navigate('/dashboard/phil-iri-records/export-success')}
        className="flex items-center gap-2 rounded-[10px] bg-brand-red px-4 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-red-700"
      >
        <DownloadSimple size={16} />
        Download PDF
      </button>
    </div>
  );
}
