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
