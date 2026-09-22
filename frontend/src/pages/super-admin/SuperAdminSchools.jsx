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
  Trash,
  WarningCircle,
} from '@phosphor-icons/react';
import ToastNotification from '../../components/common/ToastNotification.jsx';
import { SchoolsTableSkeleton } from '../../components/common/Skeleton.jsx';
import { getToken } from '../../lib/auth.js';
import { cacheService } from '../../services/cacheService.js';


function StatusBadge({ status }) {
  const s = (status || 'active').toLowerCase();
  const isActive = s === 'active';
  return (
    <span
      className={`inline-flex items-center justify-center min-w-[70px] gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize ${
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

  // Add School Modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({
    schoolId: '',
    schoolName: '',
    division: '',
    region: '',
    officialEmail: '',
    principalName: '',
  });
  const [addingSchool, setAddingSchool] = useState(false);

  // Edit School Modal state
  const [editingSchool, setEditingSchool] = useState(null);
  const [deletingSchool, setDeletingSchool] = useState(null);
  const [editFormData, setEditFormData] = useState({
    schoolName: '',
    division: '',
    region: '',
    officialEmail: '',
    principalName: '',
    status: 'active',
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchSchools = async (skipCache = false) => {
    try {
      const cached = cacheService.get('sa_schools');
      if (cached && !skipCache) {
        setSchools(cached);
        setLoading(false);
      } else {
        setLoading(true);
      }

      const token = getToken();
      const res = await fetch(getApiUrl('/api/super-admin/schools'), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.schools)) {
        setSchools(data.schools);
        cacheService.set('sa_schools', data.schools);
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

  useEffect(() => {
    if (editingSchool || isAddOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [editingSchool, isAddOpen]);

  const handleCreateSchool = async (e) => {
    e.preventDefault();
    if (!addFormData.schoolId.trim() || !addFormData.schoolName.trim()) {
      setToast({ message: 'School ID and School Name are required.', type: 'error' });
      return;
    }

    try {
      setAddingSchool(true);
      const token = getToken();
      const payload = {
        schoolId: addFormData.schoolId.trim(),
        schoolName: addFormData.schoolName.trim(),
        division: addFormData.division.trim() || null,
        region: addFormData.region.trim() || null,
        officialEmail: addFormData.officialEmail.trim() || null,
        principalName: addFormData.principalName.trim() || null,
        adminEmail: addFormData.officialEmail.trim() || null,
      };

      const res = await fetch(getApiUrl('/api/super-admin/schools'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setToast({ message: `School registered! Administrator credentials sent to ${addFormData.officialEmail || 'official email'}.`, type: 'success' });
        setIsAddOpen(false);
        setAddFormData({
          schoolId: '',
          schoolName: '',
          division: '',
          region: '',
          officialEmail: '',
          principalName: '',
        });
        fetchSchools();
      } else {
        setToast({ message: data.error || 'Failed to create school.', type: 'error' });
      }
    } catch (err) {
      console.error('Error adding school:', err);
      setToast({ message: 'Network error creating school.', type: 'error' });
    } finally {
      setAddingSchool(false);
    }
  };

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
        cacheService.invalidate('sa_schools');
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

  const handleDeleteSchool = async () => {
    if (!deletingSchool) return;
    try {
      const token = getToken();
      const res = await fetch(getApiUrl(`/api/super-admin/schools/${deletingSchool.school_id}`), {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToast({ message: 'School deleted successfully.', type: 'success' });
        setDeletingSchool(null);
        cacheService.invalidate('sa_schools');
        fetchSchools(true);
      } else {
        setToast({ message: data.error || 'Failed to delete school.', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Network error deleting school.', type: 'error' });
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
        cacheService.invalidate('sa_schools');
        fetchSchools(true);
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
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 rounded-full bg-brand-blue px-5 py-2 text-xs font-medium text-cream shadow-sm hover:bg-blue-700 transition-colors cursor-pointer shrink-0"
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
              className="w-full rounded-full border border-ink/20 bg-cream pl-10 pr-4 py-2 text-xs text-ink outline-none focus:border-brand-blue"
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
                    ? 'bg-brand-blue text-cream shadow-xs'
                    : 'bg-ink/[0.04] text-ink/70 hover:bg-ink/10'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Schools Table Container */}
        <div className="rounded-2xl border border-ink/10 bg-cream shadow-[0px_2px_8px_rgba(26,24,22,0.06)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm table-fixed">
              <thead>
                <tr className="border-b border-ink/10 bg-ink/[0.02] text-xs">
                  <th className="w-[24%] px-5 py-3 text-left font-bold text-ink/50">School Code & Name</th>
                  <th className="w-[17%] px-4 py-3 text-left font-bold text-ink/50">Division & Region</th>
                  <th className="w-[19%] px-4 py-3 text-left font-bold text-ink/50">School Admin</th>
                  <th className="w-[10%] px-4 py-3 text-center font-bold text-ink/50">Students</th>
                  <th className="w-[10%] px-4 py-3 text-center font-bold text-ink/50">Teachers</th>
                  <th className="w-[11%] px-4 py-3 text-center font-bold text-ink/50">Status</th>
                  <th className="w-[9%] pr-5 py-3 text-right font-bold text-ink/50">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {loading ? (
                  <SchoolsTableSkeleton rows={5} />
                ) : filteredSchools.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center">
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
                      className="group hover:bg-ink/[0.02] transition-colors cursor-pointer"
                    >
                      <td className="px-5 py-3 overflow-hidden">
                        <div className="min-w-0">
                          <p className="font-bold text-ink text-xs leading-tight truncate group-hover:text-brand-blue transition-colors" title={school.school_name}>
                            {school.school_name}
                          </p>
                          <p className="text-[11px] font-mono text-ink/50 mt-0.5 truncate" title={`Code: ${school.school_id}`}>
                            Code: {school.school_id}
                          </p>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-xs text-ink/70 overflow-hidden">
                        <div className="min-w-0">
                          <p className="font-medium text-ink leading-tight truncate" title={school.division || '—'}>
                            {school.division || '—'}
                          </p>
                          <p className="text-[11px] text-ink/50 mt-0.5 truncate" title={school.region || '—'}>
                            {school.region || '—'}
                          </p>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-xs text-ink/70 overflow-hidden">
                        {school.admin_email ? (
                          <div className="min-w-0">
                            <p className="font-semibold text-ink leading-tight truncate" title={school.admin_name || 'Admin'}>
                              {school.admin_name || 'Admin'}
                            </p>
                            <p className="text-[11px] text-ink/50 mt-0.5 truncate font-mono" title={school.admin_email}>
                              {school.admin_email}
                            </p>
                          </div>
                        ) : (
                          <span className="text-ink/40 italic">No admin assigned</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center text-xs font-semibold text-ink">
                        {school.student_count ?? 0}
                      </td>

                      <td className="px-4 py-3 text-center text-xs font-semibold text-ink">
                        {school.teacher_count ?? 0}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={school.status} />
                      </td>

                      <td className="pr-5 py-3 text-right opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => openEditModal(school, e)}
                            className="rounded-lg p-1.5 text-ink/60 hover:bg-ink/5 hover:text-ink cursor-pointer"
                            title="Edit School"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleToggleStatus(school.school_id, school.status, e)}
                            className="rounded-lg p-1.5 text-ink/60 hover:bg-ink/5 hover:text-ink cursor-pointer"
                            title={school.status === 'active' ? 'Deactivate School' : 'Activate School'}
                          >
                            {school.status === 'active' ? <Prohibit size={16} /> : <CheckCircle size={16} />}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingSchool(school);
                            }}
                            className="rounded-lg p-1.5 text-ink/60 hover:bg-brand-red/10 hover:text-brand-red cursor-pointer"
                            title="Delete School"
                          >
                            <Trash size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer / Pagination */}
          {filteredSchools.length > 0 && (
            <div className="px-5 py-3 flex items-center justify-between border-t border-ink/10 text-xs text-ink/60 bg-ink/[0.01]">
              <span>
                {totalPages > 1
                  ? `Showing ${(currentPage - 1) * PAGE_SIZE + 1} to ${Math.min(currentPage * PAGE_SIZE, filteredSchools.length)} of ${filteredSchools.length} schools`
                  : `Showing ${filteredSchools.length} of ${filteredSchools.length} schools`}
              </span>
              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    className="flex items-center gap-1 rounded-2xl border border-ink/10 bg-cream px-3 py-1.5 text-xs font-semibold text-ink/70 hover:bg-ink/5 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-all"
                  >
                    <CaretLeft size={14} /> Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                      <button
                        key={pg}
                        type="button"
                        onClick={() => setCurrentPage(pg)}
                        className={`size-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          currentPage === pg
                            ? 'bg-brand-blue text-white shadow-xs'
                            : 'bg-cream border border-ink/10 text-ink/70 hover:bg-ink/5'
                        }`}
                      >
                        {pg}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    className="flex items-center gap-1 rounded-2xl border border-ink/10 bg-cream px-3 py-1.5 text-xs font-semibold text-ink/70 hover:bg-ink/5 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-all"
                  >
                    Next <CaretRight size={14} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit School Modal */}
      {editingSchool && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-ink/10 bg-cream p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar">
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
                  className="rounded-full bg-brand-blue px-5 py-2 text-xs font-bold text-cream hover:bg-brand-blue/90 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Add School Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-ink/10 bg-cream p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between border-b border-ink/10 pb-3">
              <div>
                <h3 className="text-base font-bold text-ink">Register New School</h3>
                <p className="text-xs text-ink/50 mt-0.5">Create school profile and provision official admin login account.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="flex size-7 items-center justify-center rounded-lg text-ink/60 hover:bg-ink/5 hover:text-ink cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSchool} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    School ID / Code <span className="text-brand-red">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 109283"
                    value={addFormData.schoolId}
                    onChange={(e) => setAddFormData({ ...addFormData, schoolId: e.target.value })}
                    className="w-full rounded-xl border border-ink/20 bg-cream px-3 py-2 text-xs text-ink outline-none focus:border-brand-blue font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    School Name <span className="text-brand-red">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mandaluyong Elementary"
                    value={addFormData.schoolName}
                    onChange={(e) => setAddFormData({ ...addFormData, schoolName: e.target.value })}
                    className="w-full rounded-xl border border-ink/20 bg-cream px-3 py-2 text-xs text-ink outline-none focus:border-brand-blue"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Division</label>
                  <input
                    type="text"
                    placeholder="e.g. Division of Mandaluyong"
                    value={addFormData.division}
                    onChange={(e) => setAddFormData({ ...addFormData, division: e.target.value })}
                    className="w-full rounded-xl border border-ink/20 bg-cream px-3 py-2 text-xs text-ink outline-none focus:border-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Region</label>
                  <input
                    type="text"
                    placeholder="e.g. NCR"
                    value={addFormData.region}
                    onChange={(e) => setAddFormData({ ...addFormData, region: e.target.value })}
                    className="w-full rounded-xl border border-ink/20 bg-cream px-3 py-2 text-xs text-ink outline-none focus:border-brand-blue"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Official Email (Admin Login) <span className="text-brand-red">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. 109283@deped.gov.ph"
                  value={addFormData.officialEmail}
                  onChange={(e) => setAddFormData({ ...addFormData, officialEmail: e.target.value })}
                  className="w-full rounded-xl border border-ink/20 bg-cream px-3 py-2 text-xs text-ink outline-none focus:border-brand-blue"
                />
                <p className="text-[11px] text-ink/40 mt-1">
                  This email will receive the initial temporary login credentials.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Principal / School Head</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Maria Santos"
                  value={addFormData.principalName}
                  onChange={(e) => setAddFormData({ ...addFormData, principalName: e.target.value })}
                  className="w-full rounded-xl border border-ink/20 bg-cream px-3 py-2 text-xs text-ink outline-none focus:border-brand-blue"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-ink/10">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="rounded-full border border-ink/10 px-4 py-2 text-xs font-semibold text-ink/70 hover:bg-ink/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingSchool}
                  className="inline-flex items-center gap-2 rounded-full bg-brand-blue px-5 py-2 text-xs font-bold text-cream hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {addingSchool ? (
                    <>
                      <SpinnerGap size={14} className="animate-spin" />
                      <span>Registering...</span>
                    </>
                  ) : (
                    <span>Register School</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete School Confirmation Modal */}
      {deletingSchool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-sm rounded-2xl border border-ink/10 bg-cream p-6 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-brand-red/10 text-brand-red mb-3">
                <WarningCircle size={24} weight="bold" />
              </div>
              <h3 className="text-base font-bold text-ink">Delete School Record?</h3>
              <p className="mt-1 text-xs text-ink/60 leading-relaxed">
                Are you sure you want to permanently delete <strong className="text-ink">{deletingSchool.school_name}</strong> (Code: {deletingSchool.school_id})? This action cannot be undone.
              </p>
            </div>

            <div className="mt-5 flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingSchool(null)}
                className="rounded-full border border-ink/10 bg-cream px-4 py-1.5 text-xs font-medium text-ink hover:bg-ink/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSchool}
                className="rounded-full bg-brand-red px-5 py-1.5 text-xs font-semibold text-white hover:bg-red-700 shadow-xs cursor-pointer"
              >
                Delete School
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
