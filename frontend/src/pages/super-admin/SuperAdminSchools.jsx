import { getApiUrl } from '../../config/api.js';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Buildings,
  MagnifyingGlass,
  Plus,
  Eye,
  ArrowRight,
  CheckCircle,
  XCircle,
  Student,
  ChalkboardTeacher,
} from '@phosphor-icons/react';
import { getToken } from '../../lib/auth.js';
import ToastNotification from '../../components/common/ToastNotification.jsx';

export default function SuperAdminSchools() {
  const navigate = useNavigate();
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [toast, setToast] = useState(null);

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const res = await fetch(getApiUrl('/api/super-admin/schools'), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSchools(data.schools || []);
      }
    } catch (err) {
      console.warn('Failed to fetch schools:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  const filteredSchools = useMemo(() => {
    return schools.filter((s) => {
      const matchesSearch =
        !searchQuery ||
        s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.division?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [schools, searchQuery, statusFilter]);

  const handleToggleStatus = async (school) => {
    const newStatus = school.status === 'active' ? 'inactive' : 'active';
    try {
      const token = getToken();
      const res = await fetch(getApiUrl(`/api/super-admin/schools/${school.id}/status`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToast({ message: `School ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully.`, type: 'success' });
        fetchSchools();
      } else {
        setToast({ message: data.error || 'Failed to update status.', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Network error.', type: 'error' });
    }
  };

  return (
    <div className="space-y-5">
      <ToastNotification message={toast?.message || null} type={toast?.type || 'success'} onClose={() => setToast(null)} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Buildings size={24} className="text-purple-700" />
            <h1 className="text-2xl font-bold text-ink">Schools</h1>
          </div>
          <p className="mt-0.5 text-xs text-ink/50">
            Manage all registered schools and their administrators
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/super-admin/schools/add')}
          className="flex items-center gap-2 rounded-full bg-purple-700 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-purple-800 transition-colors cursor-pointer"
        >
          <Plus size={14} weight="bold" />
          Add School
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            type="text"
            placeholder="Search schools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-ink/10 bg-cream py-2 pl-9 pr-4 text-xs text-ink placeholder-ink/40 shadow-sm outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-200 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          {['all', 'active', 'inactive'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors cursor-pointer capitalize ${
                statusFilter === s
                  ? 'bg-purple-700 text-white'
                  : 'border border-ink/10 bg-cream text-ink/60 hover:text-ink hover:bg-ink/5'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Schools Table / Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2 text-ink/50">
          <div className="size-8 rounded-full border-2 border-purple-600 border-t-transparent animate-spin" />
          <span className="text-xs font-semibold">Loading schools...</span>
        </div>
      ) : filteredSchools.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-ink/10 bg-cream">
          <Buildings size={40} className="text-ink/30 mb-3" />
          <p className="text-sm font-bold text-ink">
            {searchQuery ? 'No schools match your search' : 'No schools registered yet'}
          </p>
          <p className="text-xs text-ink/50 mt-1 max-w-[240px]">
            {searchQuery ? 'Try adjusting your search or filters.' : 'Add your first school to get started.'}
          </p>
          {!searchQuery && (
            <button
              type="button"
              onClick={() => navigate('/super-admin/schools/add')}
              className="mt-4 flex items-center gap-1.5 rounded-full bg-purple-700 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-800 transition-colors cursor-pointer"
            >
              <Plus size={12} weight="bold" />
              Add School
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-ink/10 bg-cream shadow-[0px_4px_8px_0px_rgba(26,24,22,0.05)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-ink/10 bg-ink/[0.02]">
                  <th className="py-3 px-4 text-left font-bold text-ink/60">School</th>
                  <th className="py-3 px-4 text-left font-bold text-ink/60 hidden md:table-cell">Division</th>
                  <th className="py-3 px-4 text-left font-bold text-ink/60 hidden lg:table-cell">Principal</th>
                  <th className="py-3 px-4 text-center font-bold text-ink/60">
                    <div className="flex items-center justify-center gap-1">
                      <Student size={12} /> Students
                    </div>
                  </th>
                  <th className="py-3 px-4 text-center font-bold text-ink/60">
                    <div className="flex items-center justify-center gap-1">
                      <ChalkboardTeacher size={12} /> Teachers
                    </div>
                  </th>
                  <th className="py-3 px-4 text-center font-bold text-ink/60">Status</th>
                  <th className="py-3 px-4 text-right font-bold text-ink/60">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {filteredSchools.map((school) => (
                  <tr key={school.id} className="hover:bg-ink/[0.015] transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-bold text-ink">{school.name}</p>
                        <p className="text-ink/50 text-[11px]">ID: {school.id}</p>
                        {school.admin_email && (
                          <p className="text-ink/40 text-[11px] truncate max-w-[200px]">Admin: {school.admin_email}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <span className="text-ink/70">{school.division || '—'}</span>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <span className="text-ink/70">{school.principal || '—'}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-semibold text-ink">{school.student_count ?? 0}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-semibold text-ink">{school.teacher_count ?? 0}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(school)}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold transition-colors cursor-pointer ${
                          school.status === 'active'
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-ink/10 text-ink/50 hover:bg-ink/15'
                        }`}
                      >
                        {school.status === 'active' ? (
                          <><CheckCircle size={10} weight="fill" /> Active</>
                        ) : (
                          <><XCircle size={10} weight="fill" /> Inactive</>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => navigate(`/super-admin/schools/${school.id}`)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 hover:underline cursor-pointer"
                      >
                        <Eye size={12} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-ink/10 px-4 py-2.5 text-[11px] text-ink/50">
            Showing {filteredSchools.length} of {schools.length} schools
          </div>
        </div>
      )}
    </div>
  );
}
