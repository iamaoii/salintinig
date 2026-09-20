import { Outlet } from 'react-router-dom';
import { BookOpen } from '@phosphor-icons/react';

export default function SuperAdminPhilIriLayout() {
  return (
    <div className="w-full">
      <div>
        <div className="flex items-center gap-2">
          <BookOpen size={24} weight="regular" className="text-brand-red shrink-0" />
          <h1 className="text-2xl font-bold text-ink">Phil-IRI System Content</h1>
        </div>
        <p className="mt-0.5 text-xs text-ink/60">
          System-wide repository of official DepEd Phil-IRI graded reading passages and assessment materials.
        </p>
      </div>

      <div className="mt-6">
        <Outlet />
      </div>
    </div>
  );
}
