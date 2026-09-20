import { getApiUrl } from '../../config/api.js';
import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Buildings,
  MagnifyingGlass,
  Plus,
  Pencil,
  Eye,
  CheckCircle,
  Prohibit,
  Users,
  Student,
  ChalkboardTeacher,
  CaretLeft,
  CaretRight,
  EnvelopeSimple,
  User,
  X,
  SpinnerGap,
} from '@phosphor-icons/react';
import ToastNotification from '../../components/common/ToastNotification.jsx';
import { getToken } from '../../lib/auth.js';

function StatusBadge({ status }) {
  const s = (status || 'active').toLowerCase();
  const isActive = s === 'active';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize ${
        isActive
          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
          : 'bg-ink/5 text-ink/50 border border-ink/10'
      }`}
    >
      <span className={`size-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-ink/40'}`} />
      {s}
    </span>
  );
}

export default function SuperAdminSchools() {
  const navigate = useNavigate();
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'active' | 'inactive'
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState(null);
  const PAGE_SIZE = 10;

  // Edit School Modal state
  const [editingSchool, setEditingSchool] = useState(null);
  const [editFormData, setEditFormData] = useState({
    schoolName: '',
    division: '',
    region: '',
    officialEmail: '',
    principalName: '',
    status: 'active',
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const res = await fetch(getApiUrl('/api/super-admin/schools'), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.schools)) {
        setSchools(data.schools);
      } else {
        setSchools([]);
      }
    } catch (err) {
      console.warn('Failed to fetch schools:', err);
      setToast({ message: 'Failed to load schools.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  const handleToggleStatus = async (schoolId, currentStatus, e) => {
    e.stopPropagation();
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const token = getToken();
      const res = await fetch(getApiUrl(`/api/super-admin/schools/${schoolId}/status`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToast({ message: `School set to ${newStatus}.`, type: 'success' });
        setSchools((prev) =>
          prev.map((s) => (s.school_id === schoolId ? { ...s, status: newStatus } : s))
        );
      } else {
        setToast({ message: data.error || 'Failed to update school status.', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Network error updating status.', type: 'error' });
    }
  };

  const openEditModal = (school, e) => {
    e.stopPropagation();
    setEditingSchool(school);
    setEditFormData({
      schoolName: school.school_name || '',
      division: school.division || '',
      region: school.region || '',
      officialEmail: school.official_email || '',
      principalName: school.principal_name || '',
      status: school.status || 'active',
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingSchool) return;
    try {
      setSavingEdit(true);
      const token = getToken();
      const res = await fetch(getApiUrl(`/api/super-admin/schools/${editingSchool.school_id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(editFormData),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToast({ message: 'School details updated successfully.', type: 'success' });
        setEditingSchool(null);
        fetchSchools();
      } else {
        setToast({ message: data.error || 'Failed to update school.', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Network error updating school.', type: 'error' });
    } finally {
      setSavingEdit(false);
    }
  };

  const filteredSchools = useMemo(() => {
    return schools.filter((school) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        school.school_name?.toLowerCase().includes(q) ||
        school.school_id?.toLowerCase().includes(q) ||
        school.division?.toLowerCase().includes(q) ||
        school.principal_name?.toLowerCase().includes(q) ||
        school.admin_email?.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'All' ||
        (school.status || 'active').toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [schools, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredSchools.length / PAGE_SIZE) || 1;
  const paginatedSchools = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredSchools.slice(start, start + PAGE_SIZE);
  }, [filteredSchools, currentPage]);

  return (
    <>
      <ToastNotification message={toast?.message} onClose={() => setToast(null)} />

      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Buildings size={24} className="text-brand-red shrink-0" />
              <h1 className="text-2xl font-bold text-ink">Schools Management</h1>
            </div>
            <p className="mt-0.5 text-xs text-ink/60">
              Manage registered DepEd schools, assigned school administrators, and institutional records.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/super-admin/schools/add')}
            className="inline-flex items-center gap-2 rounded-full bg-brand-red px-5 py-2.5 text-xs font-bold text-cream shadow-xs hover:bg-brand-red/90 transition-colors cursor-pointer shrink-0"
          >
            <Plus size={16} weight="bold" />
            <span>Add School</span>
          </button>
        </div>

        {/* Toolbar: Search & Filter */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 rounded-2xl border border-ink/10 bg-cream p-4 shadow-[0px_2px_8px_rgba(26,24,22,0.06)]">
          <div className="relative w-full md:w-80">
            <MagnifyingGlass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
            <input
              type="text"
              placeholder="Search school name, ID, division, or admin..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-full border border-ink/20 bg-cream pl-10 pr-4 py-2 text-xs text-ink outline-none focus:border-brand-red"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-semibold text-ink/60">Status:</span>
            {['All', 'active', 'inactive'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => {
                  setStatusFilter(status);
                  setCurrentPage(1);
                }}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition-colors cursor-pointer ${
                  statusFilter === status
                    ? 'bg-brand-red text-cream shadow-xs'
                    : 'bg-ink/[0.04] text-ink/70 hover:bg-ink/10'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Schools Table */}
        <div className="rounded-2xl border border-ink/10 bg-cream p-6 shadow-[0px_2px_8px_rgba(26,24,22,0.06)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] border-collapse text-sm">
              <thead>
                <tr className="text-xs text-ink/70">
                  <th className="border border-ink/10 bg-ink/[0.03] p-3 text-left">School Code & Name</th>
                  <th className="border border-ink/10 bg-ink/[0.03] p-3 text-left">Division & Region</th>
                  <th className="border border-ink/10 bg-ink/[0.03] p-3 text-left">School Admin</th>
                  <th className="border border-ink/10 bg-ink/[0.03] p-3 text-center">Students</th>
                  <th className="border border-ink/10 bg-ink/[0.03] p-3 text-center">Teachers</th>
                  <th className="border border-ink/10 bg-ink/[0.03] p-3 text-center">Status</th>
                  <th className="border border-ink/10 bg-ink/[0.03] p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="border border-ink/10 p-12 text-center text-ink/50">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <SpinnerGap size={28} className="animate-spin text-brand-red" />
                        <span className="text-xs font-semibold">Loading schools...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedSchools.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="border border-ink/10 p-12 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Buildings size={40} className="text-ink/30" />
                        <p className="text-sm font-bold text-ink">No schools found</p>
                        <p className="text-xs text-ink/50">
                          {searchQuery || statusFilter !== 'All'
                            ? 'Try adjusting your search query or filters.'
                            : 'Click "Add School" above to register your first school.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedSchools.map((school) => (
                    <tr
                      key={school.school_id}
                      onClick={() => navigate(`/super-admin/schools/${school.school_id}`)}
                      className="border border-ink/10 hover:bg-ink/[0.02] transition-colors cursor-pointer"
                    >
                      <td className="border border-ink/10 p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-red/10 text-brand-red font-bold text-xs">
                            <Buildings size={18} />
                          </div>
                          <div>
                            <p className="font-bold text-ink text-xs leading-tight">{school.school_name}</p>
                            <p className="text-[11px] font-mono text-ink/50 mt-0.5">Code: {school.school_id}</p>
                          </div>
                        </div>
                      </td>

                      <td className="border border-ink/10 p-3 text-xs text-ink/70">
                        <p className="font-medium text-ink leading-tight">{school.division || '—'}</p>
                        <p className="text-[11px] text-ink/50 mt-0.5">{school.region || '—'}</p>
                      </td>

                      <td className="border border-ink/10 p-3 text-xs text-ink/70">
                        {school.admin_email ? (
                          <div>
                            <p className="font-semibold text-ink leading-tight">
                              {school.admin_name || 'Admin'}
                            </p>
                            <p className="text-[11px] text-ink/50 mt-0.5">{school.admin_email}</p>
                          </div>
                        ) : (
                          <span className="text-ink/40 italic">No admin assigned</span>
                        )}
                      </td>

                      <td className="border border-ink/10 p-3 text-center text-xs font-semibold text-ink">
                        {school.student_count ?? 0}
                      </td>

                      <td className="border border-ink/10 p-3 text-center text-xs font-semibold text-ink">
                        {school.teacher_count ?? 0}
                      </td>

                      <td className="border border-ink/10 p-3 text-center">
                        <StatusBadge status={school.status} />
                      </td>

                      <td className="border border-ink/10 p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => navigate(`/super-admin/schools/${school.school_id}`)}
                            className="flex size-7 items-center justify-center rounded-lg text-ink/60 hover:bg-ink/5 hover:text-ink transition-colors cursor-pointer"
                            title="View School Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => openEditModal(school, e)}
                            className="flex size-7 items-center justify-center rounded-lg text-ink/60 hover:bg-ink/5 hover:text-brand-blue transition-colors cursor-pointer"
                            title="Edit School"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleToggleStatus(school.school_id, school.status, e)}
                            className={`flex size-7 items-center justify-center rounded-lg transition-colors cursor-pointer ${
                              school.status === 'active'
                                ? 'text-rose-600 hover:bg-rose-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={school.status === 'active' ? 'Deactivate School' : 'Activate School'}
                          >
                            {school.status === 'active' ? <Prohibit size={16} /> : <CheckCircle size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t border-ink/10 pt-4 text-xs text-ink/60">
              <span>
                Showing {(currentPage - 1) * PAGE_SIZE + 1} to{' '}
                {Math.min(currentPage * PAGE_SIZE, filteredSchools.length)} of {filteredSchools.length} schools
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="flex size-8 items-center justify-center rounded-lg border border-ink/10 bg-cream text-ink/70 hover:bg-ink/5 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                >
                  <CaretLeft size={16} />
                </button>
                <span className="px-2 font-bold text-ink">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="flex size-8 items-center justify-center rounded-lg border border-ink/10 bg-cream text-ink/70 hover:bg-ink/5 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                >
                  <CaretRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit School Modal */}
      {editingSchool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-ink/10 bg-cream p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-ink/10 pb-3">
              <div>
                <h3 className="text-base font-bold text-ink">Edit School Details</h3>
                <p className="text-xs text-ink/50 mt-0.5">School ID: {editingSchool.school_id}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingSchool(null)}
                className="flex size-7 items-center justify-center rounded-lg text-ink/60 hover:bg-ink/5 hover:text-ink cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">School Name</label>
                <input
                  type="text"
                  required
                  value={editFormData.schoolName}
                  onChange={(e) => setEditFormData({ ...editFormData, schoolName: e.target.value })}
                  className="w-full rounded-xl border border-ink/20 bg-cream px-3 py-2 text-xs text-ink outline-none focus:border-brand-red"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Division</label>
                  <input
                    type="text"
                    value={editFormData.division}
                    onChange={(e) => setEditFormData({ ...editFormData, division: e.target.value })}
                    className="w-full rounded-xl border border-ink/20 bg-cream px-3 py-2 text-xs text-ink outline-none focus:border-brand-red"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Region</label>
                  <input
                    type="text"
                    value={editFormData.region}
                    onChange={(e) => setEditFormData({ ...editFormData, region: e.target.value })}
                    className="w-full rounded-xl border border-ink/20 bg-cream px-3 py-2 text-xs text-ink outline-none focus:border-brand-red"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Official Email</label>
                <input
                  type="email"
                  value={editFormData.officialEmail}
                  onChange={(e) => setEditFormData({ ...editFormData, officialEmail: e.target.value })}
                  className="w-full rounded-xl border border-ink/20 bg-cream px-3 py-2 text-xs text-ink outline-none focus:border-brand-red"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Principal Name</label>
                <input
                  type="text"
                  value={editFormData.principalName}
                  onChange={(e) => setEditFormData({ ...editFormData, principalName: e.target.value })}
                  className="w-full rounded-xl border border-ink/20 bg-cream px-3 py-2 text-xs text-ink outline-none focus:border-brand-red"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Status</label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  className="w-full rounded-xl border border-ink/20 bg-cream px-3 py-2 text-xs font-medium text-ink outline-none cursor-pointer focus:border-brand-red"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-ink/10">
                <button
                  type="button"
                  onClick={() => setEditingSchool(null)}
                  className="rounded-full border border-ink/10 px-4 py-2 text-xs font-semibold text-ink/70 hover:bg-ink/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="rounded-full bg-brand-red px-5 py-2 text-xs font-bold text-cream hover:bg-brand-red/90 disabled:opacity-50 cursor-pointer"
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
