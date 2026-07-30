import { Link } from 'react-router-dom';
import { Plus } from '@phosphor-icons/react';
import BackButton from '../../../components/common/BackButton.jsx';
import bgFlag from '../../../assets/backgrounds/bg-flag.webp';

export default function ActivitySuccess() {
  return (
    <div className="-m-8 flex min-h-[calc(100vh-71px)] bg-brand-blue">
      <div className="flex flex-1 flex-col justify-center gap-4 p-8 sm:p-12">
        <div className="-mb-4">
          <BackButton to="/dashboard/class-activities" size={20} light />
        </div>
        <h1 className="text-3xl font-bold text-cream">Successfully Made!</h1>
        <p className="-mt-2 text-sm text-cream/70">Activity published.</p>
        <div>
          <Link
            to="/dashboard/class-activities/new"
            className="inline-flex items-center gap-2 rounded-[10px] bg-brand-red px-5 py-3 text-sm font-medium text-cream transition-colors hover:bg-red-700"
          >
            <Plus size={18} weight="bold" />
            Create new activity
          </Link>
        </div>
      </div>

      <div className="hidden w-[420px] shrink-0 lg:block">
        <img src={bgFlag} alt="" className="size-full object-cover" />
      </div>
    </div>
  );
}
