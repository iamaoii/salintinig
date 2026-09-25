import React from 'react';

/**
 * Base Skeleton block with smooth shimmering animation
 */
export function SkeletonBlock({ className = '', style = {} }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-ink/10 ${className}`}
      style={style}
    />
  );
}

/**
 * Standalone Table Skeleton (full card wrapper — only use when you need the container too)
 */
export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-ink/10 bg-white shadow-xs">
      <div className="border-b border-ink/10 bg-[#eef2f6] px-4 py-3.5 flex items-center justify-between">
        <SkeletonBlock className="h-4 w-1/4" />
        <SkeletonBlock className="h-4 w-1/6" />
      </div>
      <div className="divide-y divide-ink/5">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="px-4 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-1/3">
              <SkeletonBlock className="size-8 rounded-full shrink-0" />
              <div className="space-y-1.5 w-full">
                <SkeletonBlock className="h-3.5 w-3/4" />
                <SkeletonBlock className="h-2.5 w-1/2" />
              </div>
            </div>
            <SkeletonBlock className="h-3.5 w-1/6 hidden sm:block" />
            <SkeletonBlock className="h-3.5 w-1/6 hidden md:block" />
            <SkeletonBlock className="h-6 w-24 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Card Grid Skeleton — matches passage/activity card grid layout
 */
export function CardGridSkeleton({ count = 6, className = "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4" }) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="rounded-2xl border border-ink/10 bg-cream p-5 shadow-[0px_2px_8px_rgba(26,24,22,0.06)] space-y-4 animate-pulse flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <SkeletonBlock className="h-5 w-14 rounded-md" />
                <SkeletonBlock className="h-5 w-16 rounded-md" />
                <SkeletonBlock className="h-5 w-16 rounded-md" />
              </div>
              <SkeletonBlock className="h-5 w-20 rounded-full" />
            </div>
            <div className="space-y-2 pt-1">
              <SkeletonBlock className="h-5 w-3/4" />
              <SkeletonBlock className="h-3.5 w-full" />
              <SkeletonBlock className="h-3.5 w-5/6" />
            </div>
          </div>
          <div className="pt-3 border-t border-ink/10 flex items-center justify-between">
            <SkeletonBlock className="h-4 w-28" />
            <div className="flex items-center gap-1">
              <SkeletonBlock className="h-7 w-7 rounded-lg" />
              <SkeletonBlock className="h-7 w-7 rounded-lg" />
              <SkeletonBlock className="h-7 w-7 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * StudentTableSkeleton
 * Matches: Teacher Masterlist & Overview People
 * Cols: # | LRN | Name (no avatar — text only) | Gender | Reading Level badge | Status badge
 * Real cell: px-4 py-3.5, text-xs
 */
export function StudentTableSkeleton({ rows = 6 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td className="w-12 px-4 py-3.5">
            <SkeletonBlock className="h-3.5 w-5" />
          </td>
          <td className="px-4 py-3.5">
            <SkeletonBlock className="h-3.5 w-24" />
          </td>
          <td className="px-4 py-3.5">
            <div className="flex items-center gap-3">
              <SkeletonBlock className="size-[30px] rounded-full shrink-0" />
              <SkeletonBlock className="h-3.5 w-36" />
            </div>
          </td>
          <td className="px-4 py-3.5">
            <SkeletonBlock className="h-3.5 w-10" />
          </td>
          <td className="px-4 py-3.5">
            <SkeletonBlock className="h-[22px] w-24 rounded-full" />
          </td>
          <td className="px-4 py-3.5">
            <SkeletonBlock className="h-[22px] w-28 rounded-full" />
          </td>
        </tr>
      ))}
    </>
  );
}

/**
 * TeacherRecordsSkeleton
 * Matches: Admin Teacher Records table
 * Cols: Emp ID | Teacher Name | DepEd Email | Assigned Class | Role badge | Account Status badge | Actions
 * Real cell: px-5/px-4 py-3, text-xs
 */
export function TeacherRecordsSkeleton({ rows = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td className="px-5 py-3">
            <SkeletonBlock className="h-3.5 w-20" />
          </td>
          <td className="px-4 py-3">
            <SkeletonBlock className="h-3.5 w-36" />
          </td>
          <td className="px-4 py-3">
            <SkeletonBlock className="h-3.5 w-40" />
          </td>
          <td className="px-4 py-3">
            <SkeletonBlock className="h-3.5 w-24" />
          </td>
          <td className="px-4 py-3">
            <SkeletonBlock className="h-[20px] w-28 rounded-full" />
          </td>
          <td className="px-4 py-3 text-center">
            <SkeletonBlock className="h-[20px] w-[70px] rounded-full mx-auto" />
          </td>
          <td className="pr-5 py-3 text-right">
            <div className="flex items-center justify-end gap-1">
              <SkeletonBlock className="size-[28px] rounded-lg" />
              <SkeletonBlock className="size-[28px] rounded-lg" />
              <SkeletonBlock className="size-[28px] rounded-lg" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

/**
 * StudentRecordsSkeleton
 * Matches: Admin Student Records table
 * Cols: LRN | Student Name | Grade & Section | Gender | Parent Access Code badge | Email | Account Status badge | Actions
 * Real cell: px-5/px-4 py-3, text-xs
 */
export function StudentRecordsSkeleton({ rows = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td className="px-5 py-3">
            <SkeletonBlock className="h-3.5 w-24" />
          </td>
          <td className="px-4 py-3">
            <SkeletonBlock className="h-3.5 w-32" />
          </td>
          <td className="px-4 py-3">
            <SkeletonBlock className="h-3.5 w-20" />
          </td>
          <td className="px-4 py-3">
            <SkeletonBlock className="h-3.5 w-10" />
          </td>
          <td className="px-4 py-3">
            <SkeletonBlock className="h-[20px] w-28 rounded-full" />
          </td>
          <td className="px-4 py-3">
            <SkeletonBlock className="h-3.5 w-36" />
          </td>
          <td className="px-4 py-3 text-center">
            <SkeletonBlock className="h-[20px] w-[70px] rounded-full mx-auto" />
          </td>
          <td className="pr-5 py-3 text-right">
            <div className="flex items-center justify-end gap-1">
              <SkeletonBlock className="size-[28px] rounded-lg" />
              <SkeletonBlock className="size-[28px] rounded-lg" />
              <SkeletonBlock className="size-[28px] rounded-lg" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

/**
 * SchoolsTableSkeleton
 * Matches: SuperAdmin Schools table
 * Cols: School Code & Name (2-line) | Division & Region (2-line) | School Admin (2-line) | Students count | Teachers count | Status badge | Actions
 * Real cell: px-5/px-4 py-3, text-xs
 */
export function SchoolsTableSkeleton({ rows = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td className="px-5 py-3">
            <SkeletonBlock className="h-3.5 w-40 mb-1.5" />
            <SkeletonBlock className="h-3 w-20" />
          </td>
          <td className="px-4 py-3">
            <SkeletonBlock className="h-3.5 w-28 mb-1.5" />
            <SkeletonBlock className="h-3 w-16" />
          </td>
          <td className="px-4 py-3">
            <SkeletonBlock className="h-3.5 w-32 mb-1.5" />
            <SkeletonBlock className="h-3 w-36" />
          </td>
          <td className="px-4 py-3 text-center">
            <SkeletonBlock className="h-3.5 w-6 mx-auto" />
          </td>
          <td className="px-4 py-3 text-center">
            <SkeletonBlock className="h-3.5 w-6 mx-auto" />
          </td>
          <td className="px-4 py-3 text-center">
            <SkeletonBlock className="h-[20px] w-16 rounded-full mx-auto" />
          </td>
          <td className="pr-5 py-3 text-right">
            <div className="flex items-center justify-end gap-1">
              <SkeletonBlock className="size-[28px] rounded-lg" />
              <SkeletonBlock className="size-[28px] rounded-lg" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

/**
 * PhilIriAssessmentSkeleton
 * Matches: Admin Phil-IRI Assessment table
 * Cols: LRN | Student Name | Section | Assessment Type (pill cluster) | Phil-IRI Profile badge | Status badge (right-aligned)
 * Real cell: py-3.5 px-4, text-xs
 */
export function PhilIriAssessmentSkeleton({ rows = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td className="py-3.5 px-4">
            <SkeletonBlock className="h-3.5 w-24" />
          </td>
          <td className="py-3.5 px-4">
            <SkeletonBlock className="h-3.5 w-36" />
          </td>
          <td className="py-3.5 px-4">
            <SkeletonBlock className="h-3.5 w-24" />
          </td>
          <td className="py-3.5 px-4">
            <div className="flex items-center gap-1.5">
              <SkeletonBlock className="h-[20px] w-14 rounded-full" />
              <SkeletonBlock className="h-[20px] w-14 rounded-full" />
              <SkeletonBlock className="h-[20px] w-16 rounded-full" />
            </div>
          </td>
          <td className="py-3.5 px-4">
            <SkeletonBlock className="h-[22px] w-28 rounded-full" />
          </td>
          <td className="py-3.5 px-4 text-right">
            <SkeletonBlock className="h-[22px] w-28 rounded-full ml-auto" />
          </td>
        </tr>
      ))}
    </>
  );
}

/**
 * PhilIriForm3Skeleton
 * Matches: Phil-IRI Form3 List
 * Cols: # | LRN | Name (avatar+text) | Gender | Section | Action button
 * Real cell: px-4 py-3, text-xs/sm
 */
export function PhilIriForm3Skeleton({ rows = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-ink/5 animate-pulse">
          <td className="px-4 py-3">
            <SkeletonBlock className="h-3.5 w-5" />
          </td>
          <td className="px-4 py-3">
            <SkeletonBlock className="h-3.5 w-20" />
          </td>
          <td className="px-4 py-3">
            <div className="flex items-center gap-3">
              <SkeletonBlock className="size-7 rounded-full shrink-0" />
              <SkeletonBlock className="h-3.5 w-36" />
            </div>
          </td>
          <td className="px-4 py-3">
            <SkeletonBlock className="h-3.5 w-10" />
          </td>
          <td className="px-4 py-3">
            <SkeletonBlock className="h-3.5 w-16" />
          </td>
          <td className="px-4 py-3 text-right">
            <SkeletonBlock className="h-[28px] w-24 rounded-full ml-auto" />
          </td>
        </tr>
      ))}
    </>
  );
}

/**
 * ActivityRowSkeleton
 * Matches: Class Activities ActivityRow card layout
 * Real card: p-4, icon box size-10, title h-4, subtitle h-3, type badge
 */
export function ActivityRowSkeleton({ rows = 4 }) {
  return (
    <div className="flex flex-col gap-2.5">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-2xl border border-ink/10 bg-white animate-pulse">
          <SkeletonBlock className="size-10 rounded-xl shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <SkeletonBlock className="h-4 w-2/3" />
            <SkeletonBlock className="h-3 w-2/5" />
          </div>
          <SkeletonBlock className="h-[22px] w-24 rounded-full shrink-0" />
        </div>
      ))}
    </div>
  );
}

/**
 * ClassCardSkeleton
 * Matches: Red Class Card header banner
 */
export function ClassCardSkeleton() {
  return (
    <div className="relative flex items-start justify-between overflow-hidden rounded-2xl bg-brand-red p-5 text-cream shadow-[0px_5px_5px_0px_rgba(26,24,22,0.1)] min-h-[124px] w-full">
      <div className="relative z-10 flex flex-col items-start gap-2.5 w-full">
        <div className="h-8 w-44 sm:w-56 rounded-lg bg-white/25 animate-pulse" />
        <div className="flex flex-col gap-1.5 w-full">
          <div className="h-3.5 w-24 rounded-md bg-white/20 animate-pulse" />
          <div className="h-3.5 w-32 rounded-md bg-white/20 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

/**
 * PhilIriReviewSkeleton
 * Matches: Phil-IRI Oral Reading Review Page layout
 * Layout:
 *  - Top bar (back button + status pill)
 *  - Outer cream card:
 *    - Header (student name, passage metadata + action button)
 *    - Profile Summary card (heading + 3 metric cards)
 *    - Audio Player bar (play button + waveform/slider + timestamps)
 *    - Miscue toolbar card (title + 8 miscue button skeletons)
 *    - Passage transcript card (header + flowing paragraph skeleton lines)
 */
export function PhilIriReviewSkeleton() {
  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-200">
      {/* Top Header Controls Skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <SkeletonBlock className="size-8 rounded-full" />
          <SkeletonBlock className="h-4 w-36 rounded-md" />
        </div>
        <SkeletonBlock className="h-7 w-44 rounded-full" />
      </div>

      {/* Main Container Card */}
      <div className="rounded-2xl border border-ink/10 bg-cream p-6 shadow-[0px_2px_8px_rgba(26,24,22,0.06)] space-y-6 w-full">
        {/* Student & Passage Info Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/10 pb-5">
          <div className="space-y-2">
            <SkeletonBlock className="h-7 w-64 sm:w-80 rounded-lg" />
            <div className="flex flex-wrap items-center gap-2">
              <SkeletonBlock className="h-4 w-14 rounded-md" />
              <SkeletonBlock className="h-4 w-32 rounded-md" />
              <SkeletonBlock className="h-4 w-12 rounded-md" />
              <SkeletonBlock className="h-4 w-16 rounded-md" />
              <SkeletonBlock className="h-4 w-16 rounded-md" />
            </div>
          </div>
          <SkeletonBlock className="h-10 w-52 rounded-xl" />
        </div>

        {/* Profile Summary Card */}
        <div className="rounded-xl border border-ink/10 bg-white p-4 sm:p-5 space-y-3.5 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 pb-3">
            <div className="space-y-1">
              <SkeletonBlock className="h-4 w-60 rounded-md" />
              <SkeletonBlock className="h-3 w-80 max-w-full rounded-md" />
            </div>
            <SkeletonBlock className="h-6 w-44 rounded-full" />
          </div>

          {/* 3 Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {[1, 2, 3].map((cardIdx) => (
              <div
                key={cardIdx}
                className="rounded-xl border border-ink/10 bg-white p-4 space-y-3 flex flex-col justify-between shadow-2xs"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <SkeletonBlock className="h-3.5 w-28 rounded-md" />
                    <SkeletonBlock className="h-4 w-16 rounded-md" />
                  </div>
                  <SkeletonBlock className="h-8 w-24 rounded-lg" />
                  <SkeletonBlock className="h-3 w-36 rounded-md" />
                </div>
                <div className="pt-2 border-t border-ink/10 flex items-center justify-between">
                  <SkeletonBlock className="h-3 w-20 rounded-md" />
                  <SkeletonBlock className="h-3 w-24 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audio Player Skeleton */}
        <div className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-white p-3.5 sm:p-4 shadow-2xs">
          <SkeletonBlock className="size-8 rounded-full shrink-0" />
          <div className="flex flex-1 items-center gap-3">
            <SkeletonBlock className="h-2 flex-1 rounded-full" />
            <SkeletonBlock className="h-3.5 w-16 rounded-md shrink-0" />
          </div>
          <SkeletonBlock className="h-6 w-10 rounded-md shrink-0 hidden sm:block" />
          <SkeletonBlock className="size-6 rounded-md shrink-0 hidden sm:block" />
        </div>

        {/* Miscue Toolbar Skeleton */}
        <div className="rounded-xl border border-ink/10 bg-white p-4 sm:p-5 space-y-4 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 pb-3">
            <div className="space-y-1">
              <SkeletonBlock className="h-4 w-52 rounded-md" />
              <SkeletonBlock className="h-3 w-72 max-w-full rounded-md" />
            </div>
            <div className="flex items-center gap-2">
              <SkeletonBlock className="h-7 w-28 rounded-lg" />
              <SkeletonBlock className="h-7 w-24 rounded-lg" />
              <SkeletonBlock className="h-7 w-20 rounded-lg" />
            </div>
          </div>

          {/* 8 Miscue Buttons Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col justify-between rounded-xl border border-ink/10 bg-white p-3 min-h-[64px] gap-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-1">
                    <SkeletonBlock className="size-2 rounded-full shrink-0" />
                    <SkeletonBlock className="h-3.5 w-3/4 rounded-md" />
                  </div>
                  <SkeletonBlock className="h-4 w-6 rounded-md shrink-0" />
                </div>
                <div className="flex items-center justify-between gap-2 pt-1">
                  <SkeletonBlock className="h-2.5 w-1/2 rounded-md" />
                  <SkeletonBlock className="h-3 w-7 rounded-sm" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Passage Text Transcript Skeleton */}
        <div className="rounded-2xl border border-ink/10 bg-white p-6 sm:p-8 shadow-2xs space-y-5">
          <div className="border-b border-ink/10 pb-3 flex flex-wrap items-center justify-between gap-2">
            <SkeletonBlock className="h-4 w-44 rounded-md" />
            <SkeletonBlock className="h-3 w-32 rounded-md" />
          </div>

          {/* Paragraph Lines Skeleton */}
          <div className="space-y-3">
            <SkeletonBlock className="h-4 w-full rounded-md" />
            <SkeletonBlock className="h-4 w-[96%] rounded-md" />
            <SkeletonBlock className="h-4 w-[98%] rounded-md" />
            <SkeletonBlock className="h-4 w-[92%] rounded-md" />
            <SkeletonBlock className="h-4 w-[95%] rounded-md" />
            <SkeletonBlock className="h-4 w-3/5 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * StudentProfileSkeleton
 * Matches: Teacher & Admin individual student profile page layout
 */
export function StudentProfileSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Student Profile Info Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 py-2">
        <div className="flex items-center gap-5">
          <SkeletonBlock className="size-24 rounded-full shrink-0" />
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="space-y-1">
                <SkeletonBlock className="h-3 w-16 rounded" />
                <SkeletonBlock className="h-6 w-48 rounded-md" />
              </div>
              <SkeletonBlock className="h-6 w-28 rounded-lg" />
            </div>
            <div className="flex flex-wrap gap-6 pt-1">
              <div className="space-y-1">
                <SkeletonBlock className="h-3 w-16 rounded" />
                <SkeletonBlock className="h-4 w-20 rounded" />
              </div>
              <div className="space-y-1">
                <SkeletonBlock className="h-3 w-14 rounded" />
                <SkeletonBlock className="h-4 w-20 rounded" />
              </div>
              <div className="space-y-1">
                <SkeletonBlock className="h-3 w-12 rounded" />
                <SkeletonBlock className="h-4 w-28 rounded" />
              </div>
            </div>
          </div>
        </div>
        <SkeletonBlock className="h-10 w-36 rounded-xl" />
      </div>

      {/* Main Body Grid: Trend/Stats on left, Achievements on right */}
      <div className="mt-8 flex flex-col gap-6 xl:flex-row">
        {/* Left Column: Accuracy Trend & Stat Cards */}
        <div className="flex w-full flex-col gap-3 xl:max-w-[540px]">
          <div className="flex items-center gap-2">
            <SkeletonBlock className="size-4 rounded" />
            <SkeletonBlock className="h-4 w-28 rounded" />
          </div>
          <div className="rounded-[10px] border border-ink/10 bg-cream p-4 h-[240px] flex items-end justify-between gap-3">
            <SkeletonBlock className="h-full w-full rounded" />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-2xl border border-ink/10 bg-cream p-4 shadow-2xs"
              >
                <div className="space-y-2">
                  <SkeletonBlock className="h-6 w-14 rounded" />
                  <SkeletonBlock className="h-3 w-20 rounded" />
                </div>
                <SkeletonBlock className="size-10 rounded-xl shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Achievements & Tabs */}
        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex items-center gap-2.5">
            <SkeletonBlock className="size-7 rounded-lg" />
            <SkeletonBlock className="h-6 w-36 rounded-md" />
          </div>

          {/* Tab buttons */}
          <div className="flex items-center gap-3 border-b border-ink/10 pb-2">
            <SkeletonBlock className="h-8 w-20 rounded" />
            <SkeletonBlock className="h-8 w-20 rounded" />
            <SkeletonBlock className="h-8 w-20 rounded" />
          </div>

          {/* Activity rows placeholder matching Phil-IRI assessment row layout */}
          <div className="flex flex-col gap-3 pt-2">
            {[1, 2, 3].map((rowIdx) => (
              <div
                key={rowIdx}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-ink/10 bg-white p-4 sm:px-6 shadow-2xs"
              >
                <div className="flex items-center gap-3.5 sm:gap-4 flex-1 min-w-0">
                  <SkeletonBlock className="size-11 rounded-xl shrink-0" />
                  <div className="space-y-2 flex-1">
                    <SkeletonBlock className="h-4 w-44 sm:w-64 rounded" />
                    <div className="flex items-center gap-1.5">
                      <SkeletonBlock className="h-4 w-14 rounded-md" />
                      <SkeletonBlock className="h-4 w-10 rounded-md" />
                      <SkeletonBlock className="h-4 w-16 rounded-md" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                  <SkeletonBlock className="h-6 w-20 rounded-full shrink-0" />
                  <SkeletonBlock className="h-8 w-24 rounded-full shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * TeacherProfileSkeleton
 * Matches: Admin / Teacher Profile page layout
 */
export function TeacherProfileSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top Back Navigation Skeleton */}
      <div className="h-8 w-24 rounded-xl bg-ink/10" />

      {/* Profile Header Banner Skeleton */}
      <div className="rounded-2xl border border-ink/10 bg-cream p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="size-22 rounded-full bg-ink/10 shrink-0" />
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center gap-3">
                <div className="h-7 w-48 rounded-lg bg-ink/10" />
                <div className="h-5 w-24 rounded-full bg-ink/10" />
                <div className="h-5 w-16 rounded-full bg-ink/10" />
              </div>
              <div className="h-4 w-36 rounded-md bg-ink/10" />
              <div className="h-4 w-72 rounded-md bg-ink/10" />
            </div>
          </div>
          <div className="h-9 w-36 rounded-full bg-ink/10" />
        </div>
      </div>

      {/* 4 Summary Stat Widgets Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-ink/10 bg-cream p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-28 rounded-md bg-ink/10" />
              <div className="size-8 rounded-lg bg-ink/10" />
            </div>
            <div className="h-8 w-16 rounded-lg bg-ink/10" />
            <div className="h-3 w-32 rounded-md bg-ink/10" />
          </div>
        ))}
      </div>

      {/* Tabs & Content Area Skeleton */}
      <div className="rounded-2xl border border-ink/10 bg-cream p-6 space-y-4">
        <div className="flex items-center gap-6 border-b border-ink/10 pb-3">
          <div className="h-5 w-44 rounded-md bg-ink/10" />
          <div className="h-5 w-44 rounded-md bg-ink/10" />
        </div>
        <div className="rounded-xl border border-ink/10 bg-white p-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-ink/5 last:border-0">
              <div className="h-4 w-28 rounded-md bg-ink/10" />
              <div className="h-4 w-48 rounded-md bg-ink/10" />
              <div className="h-4 w-20 rounded-md bg-ink/10" />
              <div className="h-5 w-24 rounded-full bg-ink/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * PhilIriForm1Skeleton
 * Matches: Phil-IRI Form 1A / Form 1B Table Document layout
 * Headers: Form Title, 3 Header Info rows, DepEd Table grid
 */
export function PhilIriForm1Skeleton({ rows = 6 }) {
  return (
    <div className="relative font-sans text-xs animate-in fade-in duration-200">
      {/* Top Action Bar Skeleton */}
      <div className="mb-4 flex items-center justify-between">
        <SkeletonBlock className="h-6 w-80 rounded-md" />
        <div className="flex items-center gap-2">
          <SkeletonBlock className="h-8 w-28 rounded-lg" />
          <SkeletonBlock className="h-8 w-28 rounded-lg" />
        </div>
      </div>

      {/* Main Document Paper Container Skeleton */}
      <div className="overflow-x-auto rounded-lg border border-ink/20 bg-white p-6 shadow-xs">
        <div className="min-w-[1000px]">
          {/* Sheet Header Information Skeleton */}
          <div className="text-center space-y-2 mb-4">
            <div className="flex justify-end">
              <SkeletonBlock className="h-3.5 w-32 rounded-md" />
            </div>
            <SkeletonBlock className="h-5 w-96 max-w-full rounded-md mx-auto" />
          </div>

          {/* 3 Header Information Rows Skeleton (Exact match) */}
          <div className="space-y-2.5 text-xs font-semibold mb-4 px-1">
            {/* Row 1: Baitang, Seksiyon | Guro */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-10">
                <div className="flex items-center gap-1">
                  <SkeletonBlock className="h-3.5 w-14 rounded-md" />
                  <SkeletonBlock className="h-4 w-10 rounded-none border-b border-ink/20" />
                </div>
                <div className="flex items-center gap-1">
                  <SkeletonBlock className="h-3.5 w-16 rounded-md" />
                  <SkeletonBlock className="h-4 w-28 rounded-none border-b border-ink/20" />
                </div>
              </div>
              <div className="flex items-center gap-1">
                <SkeletonBlock className="h-3.5 w-10 rounded-md" />
                <SkeletonBlock className="h-4 w-36 rounded-none border-b border-ink/20" />
              </div>
            </div>

            {/* Row 2: Paaralan */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <SkeletonBlock className="h-3.5 w-16 rounded-md" />
                <SkeletonBlock className="h-4 w-60 rounded-none border-b border-ink/20" />
              </div>
            </div>

            {/* Row 3: Antas ng Pangkatang Pagtatasa | Petsa */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <SkeletonBlock className="h-3.5 w-44 rounded-md" />
                <SkeletonBlock className="h-4 w-10 rounded-none border-b border-ink/20" />
              </div>
              <div className="flex items-center gap-1">
                <SkeletonBlock className="h-3.5 w-12 rounded-md" />
                <SkeletonBlock className="h-4 w-32 rounded-none border-b border-ink/20" />
              </div>
            </div>
          </div>

          {/* DepEd Table Grid Skeleton (Matches exact 2-row table header layout) */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-center text-xs font-sans border border-gray-400">
              <thead>
                <tr className="bg-[#e2e2e2] font-bold text-gray-900 uppercase border border-gray-400">
                  <th rowSpan={2} className="w-11 min-w-[40px] border border-gray-400 p-2 bg-[#d4d4d4]">
                    <SkeletonBlock className="h-3.5 w-3 mx-auto" />
                  </th>
                  <th rowSpan={2} className="border border-gray-400 p-2 text-left w-[26%]">
                    <SkeletonBlock className="h-3.5 w-24" />
                  </th>
                  <th rowSpan={2} className="border border-gray-400 p-2 w-[7%]">
                    <SkeletonBlock className="h-3.5 w-12 mx-auto" />
                  </th>
                  <th rowSpan={2} className="border border-gray-400 p-2 w-[8%]">
                    <SkeletonBlock className="h-3.5 w-16 mx-auto" />
                  </th>
                  <th colSpan={3} className="border border-gray-400 p-1.5">
                    <SkeletonBlock className="h-3.5 w-48 mx-auto" />
                  </th>
                  <th rowSpan={2} className="border border-gray-400 p-2 w-[9%] bg-[#d4d4d4]">
                    <SkeletonBlock className="h-3.5 w-20 mx-auto" />
                  </th>
                  <th rowSpan={2} className="border border-gray-400 p-2 w-[8%]">
                    <SkeletonBlock className="h-3.5 w-16 mx-auto" />
                  </th>
                  <th rowSpan={2} className="border border-gray-400 p-2 w-[15%]">
                    <SkeletonBlock className="h-3.5 w-28 mx-auto" />
                  </th>
                  <th rowSpan={2} className="border border-gray-400 p-2 w-[8%]">
                    <SkeletonBlock className="h-3.5 w-16 mx-auto" />
                  </th>
                </tr>
                <tr className="bg-[#e2e2e2] font-bold text-gray-900 uppercase border border-gray-400">
                  <th className="border border-gray-400 p-1.5 w-[7%]">
                    <SkeletonBlock className="h-3 w-10 mx-auto" />
                  </th>
                  <th className="border border-gray-400 p-1.5 w-[7%]">
                    <SkeletonBlock className="h-3 w-12 mx-auto" />
                  </th>
                  <th className="border border-gray-400 p-1.5 w-[7%]">
                    <SkeletonBlock className="h-3 w-10 mx-auto" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="hover:bg-[#f5faf6]">
                    <td className="border border-gray-400 p-1 bg-[#d4d4d4]">
                      <SkeletonBlock className="h-3.5 w-4 mx-auto" />
                    </td>
                    <td className="border border-gray-400 p-1 bg-[#eaeaea]">
                      <SkeletonBlock className="h-3.5 w-40" />
                    </td>
                    <td className="border border-gray-400 p-1">
                      <SkeletonBlock className="h-3.5 w-4 mx-auto" />
                    </td>
                    <td className="border border-gray-400 p-1">
                      <SkeletonBlock className="h-3.5 w-4 mx-auto" />
                    </td>
                    <td className="border border-gray-400 p-1">
                      <SkeletonBlock className="h-3.5 w-6 mx-auto" />
                    </td>
                    <td className="border border-gray-400 p-1">
                      <SkeletonBlock className="h-3.5 w-6 mx-auto" />
                    </td>
                    <td className="border border-gray-400 p-1">
                      <SkeletonBlock className="h-3.5 w-6 mx-auto" />
                    </td>
                    <td className="border border-gray-400 p-1 bg-[#eaeaea]">
                      <SkeletonBlock className="h-3.5 w-8 mx-auto" />
                    </td>
                    <td className="border border-gray-400 p-1">
                      <SkeletonBlock className="h-3.5 w-4 mx-auto" />
                    </td>
                    <td className="border border-gray-400 p-1">
                      <SkeletonBlock className="h-3.5 w-24 mx-auto" />
                    </td>
                    <td className="border border-gray-400 p-1">
                      <SkeletonBlock className="h-3.5 w-4 mx-auto" />
                    </td>
                  </tr>
                ))}

                {/* Male Summary Yellow Highlight Bar Skeleton */}
                <tr className="bg-[#fef08a]">
                  <td colSpan={2} className="border border-gray-400 p-2 text-left">
                    <SkeletonBlock className="h-3.5 w-44 bg-amber-400/50" />
                  </td>
                  <td className="border border-gray-400 p-2">
                    <SkeletonBlock className="h-3.5 w-4 mx-auto bg-amber-400/50" />
                  </td>
                  <td className="border border-gray-400 p-2">
                    <SkeletonBlock className="h-3.5 w-6 mx-auto bg-amber-400/50" />
                  </td>
                  <td colSpan={5} className="border border-gray-400 p-2 text-right">
                    <SkeletonBlock className="h-3.5 w-28 ml-auto bg-amber-400/50" />
                  </td>
                  <td colSpan={2} className="border border-gray-400 p-2 text-right">
                    <SkeletonBlock className="h-3.5 w-20 ml-auto bg-amber-400/50" />
                  </td>
                </tr>

                {/* Female Section Skeleton Rows */}
                {Array.from({ length: 4 }).map((_, i) => (
                  <tr key={`f-${i}`} className="hover:bg-[#f5faf6]">
                    <td className="border border-gray-400 p-1 bg-[#d4d4d4]">
                      <SkeletonBlock className="h-3.5 w-4 mx-auto" />
                    </td>
                    <td className="border border-gray-400 p-1 bg-[#eaeaea]">
                      <SkeletonBlock className="h-3.5 w-36" />
                    </td>
                    <td className="border border-gray-400 p-1">
                      <SkeletonBlock className="h-3.5 w-4 mx-auto" />
                    </td>
                    <td className="border border-gray-400 p-1">
                      <SkeletonBlock className="h-3.5 w-4 mx-auto" />
                    </td>
                    <td className="border border-gray-400 p-1">
                      <SkeletonBlock className="h-3.5 w-6 mx-auto" />
                    </td>
                    <td className="border border-gray-400 p-1">
                      <SkeletonBlock className="h-3.5 w-6 mx-auto" />
                    </td>
                    <td className="border border-gray-400 p-1">
                      <SkeletonBlock className="h-3.5 w-6 mx-auto" />
                    </td>
                    <td className="border border-gray-400 p-1 bg-[#eaeaea]">
                      <SkeletonBlock className="h-3.5 w-8 mx-auto" />
                    </td>
                    <td className="border border-gray-400 p-1">
                      <SkeletonBlock className="h-3.5 w-4 mx-auto" />
                    </td>
                    <td className="border border-gray-400 p-1">
                      <SkeletonBlock className="h-3.5 w-24 mx-auto" />
                    </td>
                    <td className="border border-gray-400 p-1">
                      <SkeletonBlock className="h-3.5 w-4 mx-auto" />
                    </td>
                  </tr>
                ))}

                {/* Female Summary Yellow Highlight Bar Skeleton */}
                <tr className="bg-[#fef08a]">
                  <td colSpan={2} className="border border-gray-400 p-2 text-left">
                    <SkeletonBlock className="h-3.5 w-44 bg-amber-400/50" />
                  </td>
                  <td className="border border-gray-400 p-2">
                    <SkeletonBlock className="h-3.5 w-4 mx-auto bg-amber-400/50" />
                  </td>
                  <td className="border border-gray-400 p-2">
                    <SkeletonBlock className="h-3.5 w-6 mx-auto bg-amber-400/50" />
                  </td>
                  <td colSpan={5} className="border border-gray-400 p-2 text-right">
                    <SkeletonBlock className="h-3.5 w-28 ml-auto bg-amber-400/50" />
                  </td>
                  <td colSpan={2} className="border border-gray-400 p-2 text-right">
                    <SkeletonBlock className="h-3.5 w-20 ml-auto bg-amber-400/50" />
                  </td>
                </tr>

                {/* Grand Total Green Summary Bar Skeleton */}
                <tr className="bg-[#107c41]">
                  <td colSpan={2} className="p-2.5 text-left border border-gray-400">
                    <SkeletonBlock className="h-4 w-56 bg-white/30" />
                  </td>
                  <td className="p-2.5 border border-gray-400">
                    <SkeletonBlock className="h-4 w-6 mx-auto bg-white/30" />
                  </td>
                  <td className="p-2.5 border border-gray-400">
                    <SkeletonBlock className="h-4 w-6 mx-auto bg-white/30" />
                  </td>
                  <td colSpan={5} className="p-2.5 text-right border border-gray-400">
                    <SkeletonBlock className="h-4 w-32 ml-auto bg-white/30" />
                  </td>
                  <td colSpan={2} className="p-2.5 text-right border border-gray-400">
                    <SkeletonBlock className="h-4 w-28 ml-auto bg-white/30" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * PhilIriForm2Skeleton
 * Matches Phil-IRI Form 2 layout: Top toolbar + Excel Form 2 table grid
 */
export function PhilIriForm2Skeleton({ rows = 6 }) {
  return (
    <div className="relative font-sans text-xs">
      {/* Top Action Bar Skeleton */}
      <div className="mb-4 flex items-center justify-between">
        <SkeletonBlock className="h-6 w-96 max-w-full rounded-md" />
        <div className="flex items-center gap-2">
          <SkeletonBlock className="h-8 w-28 rounded-lg" />
          <SkeletonBlock className="h-8 w-28 rounded-lg" />
        </div>
      </div>

      {/* Main Form 2 Document Paper Skeleton */}
      <div className="overflow-x-auto rounded-lg border border-ink/20 bg-white p-6 shadow-xs">
        <div className="min-w-[850px]">
          {/* Header Titles */}
          <div className="text-center space-y-1 mb-4">
            <div className="flex justify-end">
              <SkeletonBlock className="h-3.5 w-28 rounded-md" />
            </div>
            <SkeletonBlock className="h-4 w-80 rounded-md mx-auto" />
            <SkeletonBlock className="h-4 w-64 rounded-md mx-auto" />
          </div>

          {/* Form Header Info Grid (School, Division, District, Region) */}
          <div className="space-y-2.5 text-xs font-semibold mb-6 px-1">
            <div className="grid grid-cols-2 gap-x-12">
              <div className="flex items-center gap-2">
                <SkeletonBlock className="h-3.5 w-12" />
                <SkeletonBlock className="h-4 grow rounded-none border-b border-ink/20" />
              </div>
              <div className="flex items-center gap-2">
                <SkeletonBlock className="h-3.5 w-14" />
                <SkeletonBlock className="h-4 grow rounded-none border-b border-ink/20" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-12">
              <div className="flex items-center gap-2">
                <SkeletonBlock className="h-3.5 w-12" />
                <SkeletonBlock className="h-4 grow rounded-none border-b border-ink/20" />
              </div>
              <div className="flex items-center gap-2">
                <SkeletonBlock className="h-3.5 w-12" />
                <SkeletonBlock className="h-4 grow rounded-none border-b border-ink/20" />
              </div>
            </div>
          </div>

          {/* Form 2 Table Grid Skeleton */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-center text-xs font-sans border border-gray-400">
              <thead>
                <tr className="bg-[#e2e2e2] font-bold uppercase border border-gray-400">
                  <th rowSpan={2} className="w-[15%] border border-gray-400 p-2.5 bg-[#d4d4d4]">
                    <SkeletonBlock className="h-3.5 w-12 mx-auto" />
                  </th>
                  <th rowSpan={2} className="w-[30%] border border-gray-400 p-2.5 text-left">
                    <SkeletonBlock className="h-3.5 w-24" />
                  </th>
                  <th rowSpan={2} className="w-[20%] border border-gray-400 p-2.5 bg-[#d4d4d4]">
                    <SkeletonBlock className="h-3.5 w-20 mx-auto" />
                  </th>
                  <th colSpan={2} className="border border-gray-400 p-2">
                    <SkeletonBlock className="h-3.5 w-28 mx-auto" />
                  </th>
                </tr>
                <tr className="bg-[#e2e2e2] font-bold uppercase border border-gray-400">
                  <th className="w-[17.5%] border border-gray-400 p-2">
                    <SkeletonBlock className="h-3 w-20 mx-auto" />
                  </th>
                  <th className="w-[17.5%] border border-gray-400 p-2">
                    <SkeletonBlock className="h-3 w-20 mx-auto" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {['IV', 'V', 'VI'].map((gradeLabel, gIdx) => (
                  <React.Fragment key={gIdx}>
                    {/* Yellow Grade Total Row Skeleton */}
                    <tr className="bg-[#fef08a] font-bold">
                      <td className="border border-gray-400 p-2 bg-[#d4d4d4]">
                        <SkeletonBlock className="h-3.5 w-6 mx-auto" />
                      </td>
                      <td className="border border-gray-400 p-2 text-left font-semibold">
                        <SkeletonBlock className="h-3.5 w-24" />
                      </td>
                      <td className="border border-gray-400 p-2 text-right">
                        <SkeletonBlock className="h-3.5 w-8 ml-auto" />
                      </td>
                      <td className="border border-gray-400 p-2 text-right">
                        <SkeletonBlock className="h-3.5 w-8 ml-auto" />
                      </td>
                      <td className="border border-gray-400 p-2 text-right">
                        <SkeletonBlock className="h-3.5 w-8 ml-auto" />
                      </td>
                    </tr>

                    {/* 3 Section Rows under Grade */}
                    {Array.from({ length: 3 }).map((_, sIdx) => (
                      <tr key={sIdx} className="hover:bg-[#f5faf6]">
                        <td className="border border-gray-400 p-2 bg-[#d4d4d4]">
                          {'\u00A0'}
                        </td>
                        <td className="border border-gray-400 p-2 text-left">
                          <SkeletonBlock className="h-3.5 w-28" />
                        </td>
                        <td className="border border-gray-400 p-2 bg-[#eaeaea]">
                          <SkeletonBlock className="h-3.5 w-8 mx-auto" />
                        </td>
                        <td className="border border-gray-400 p-2">
                          <SkeletonBlock className="h-3.5 w-8 mx-auto" />
                        </td>
                        <td className="border border-gray-400 p-2">
                          <SkeletonBlock className="h-3.5 w-8 mx-auto" />
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}

                {/* Grand Total Row Skeleton */}
                <tr className="bg-[#107c41]">
                  <td colSpan={2} className="p-3 text-left border border-gray-400">
                    <SkeletonBlock className="h-4 w-52 bg-white/30" />
                  </td>
                  <td className="p-3 border border-gray-400">
                    <SkeletonBlock className="h-4 w-8 mx-auto bg-white/30" />
                  </td>
                  <td className="p-3 border border-gray-400">
                    <SkeletonBlock className="h-4 w-8 mx-auto bg-white/30" />
                  </td>
                  <td className="p-3 border border-gray-400">
                    <SkeletonBlock className="h-4 w-8 mx-auto bg-white/30" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

