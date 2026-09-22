import { X } from '@phosphor-icons/react';
import logo from '../../assets/logo/logo.webp';

/**
 * AboutAppModal
 * -------------
 * Unified, beautiful "About Application" modal used across Teacher, Admin, and Super Admin portals.
 */
export default function AboutAppModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-ink/10 bg-cream p-6 shadow-2xl space-y-5 text-center">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-ink/40 hover:bg-ink/5 hover:text-ink transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Logo & Header Info */}
        <div className="flex flex-col items-center gap-2.5 pt-2">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-white p-2.5 shadow-sm border border-ink/10">
            <img src={logo} alt="SalinTinig Logo" className="h-full w-auto object-contain" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-ink tracking-tight">SalinTinig</h3>
            <p className="text-xs font-medium text-ink/50 mt-0.5">
              DepEd Digital Reading Assessment & Analytics Platform
            </p>
          </div>
          <span className="inline-block rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-bold text-brand-blue border border-brand-blue/20">
            Version 2.4.0 (Production Release)
          </span>
        </div>

        {/* Application Details Card */}
        <div className="rounded-2xl bg-white border border-ink/10 p-4 text-xs text-ink/75 text-left space-y-2.5 shadow-xs">
          <p className="leading-relaxed">
            <strong>SalinTinig</strong> is the official automated assessment platform designed for Department of Education (DepEd) schools. It streamlines Phil-IRI oral and silent reading evaluations, real-time audio analysis, automated scoring, and DepEd Form 1–4 reporting.
          </p>
          
          <div className="border-t border-ink/10 pt-2 space-y-1 text-[11px] text-ink/60">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-ink/70">Framework Standard:</span>
              <span>DepEd Phil-IRI Standards</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-ink/70">Supported Languages:</span>
              <span>Filipino & English</span>
            </div>
          </div>
        </div>

        <div className="text-[11px] text-ink/40">
          Department of Education • All Rights Reserved
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-full bg-brand-blue px-6 py-2.5 text-xs font-bold text-cream hover:bg-brand-blue/90 cursor-pointer shadow-xs transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
