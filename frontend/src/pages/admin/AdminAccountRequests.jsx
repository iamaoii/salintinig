import { getApiUrl } from '../../config/api.js';
import { getCompactPageItems } from '../../lib/pagination.js';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCheck,
  MagnifyingGlass,
  Check,
  X,
  Funnel,
  CaretLeft,
  CaretRight,
  UserSwitch,
  ChalkboardTeacher,
  Student,
} from '@phosphor-icons/react';
import ToastNotification from '../../components/common/ToastNotification.jsx';
import BackButton from '../../components/common/BackButton.jsx';
import { getToken } from '../../lib/auth.js';
import { cacheService } from '../../services/cacheService.js';

const PAGE_SIZE = 10;
const CACHE_KEY = 'admin_account_requests_list';

export default function AdminAccountRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [processingId, setProcessingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchRequests = async (forceRefresh = false) => {
    // 1. Dual-layer caching check
    if (!forceRefresh) {
      const cached = cacheService.get(CACHE_KEY);
      if (cached && Array.isArray(cached)) {
        setRequests(cached);
        setLoading(false);
        return;
      }
    }

    try {
      const token = getToken();
      const res = await fetch(getApiUrl('/api/admin/account-requests'), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const fetchedData = data.requests || [];
        setRequests(fetchedData);
        cacheService.set(CACHE_KEY, fetchedData, 3 * 60 * 1000); // 3 mins TTL
      }
    } catch (err) {
      console.warn('Error fetching account requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Reset to first page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, statusFilter]);

  const handleApprove = async (id, name) => {
    if (processingId) return;
    setProcessingId(id);
    try {
      const token = getToken();
      const res = await fetch(getApiUrl(`/api/admin/account-requests/${id}/approve`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Account for ${name} approved! Welcome email sent.`);
        fetchRequests(true);
      } else {
        showToast(data.error || 'Failed to approve account.');
      }
    } catch (err) {
      showToast('Network error while approving request.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id, name) => {
    if (processingId) return;
    setProcessingId(id);
    try {
      const token = getToken();
      const res = await fetch(getApiUrl(`/api/admin/account-requests/${id}/reject`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Account request for ${name} rejected.`);
        fetchRequests(true);
      }
    } catch (err) {
      showToast('Error rejecting request.');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRequests = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return requests.filter((r) => {
      const userRole = (r.role || 'Teacher').toLowerCase() === 'student' ? 'Student' : 'Teacher';
      const name = r.full_name || [r.first_name, r.middle_name, r.last_name].filter(Boolean).join(' ');
      
      const matchesSearch =
        !query ||
        name.toLowerCase().includes(query) ||
        (r.email && r.email.toLowerCase().includes(query)) ||
        (r.id_number && r.id_number.toLowerCase().includes(query)) ||
        (r.teacher_no && r.teacher_no.toLowerCase().includes(query)) ||
        (r.school_id && r.school_id.includes(query));

      const matchesStatus =
        statusFilter === 'All' ||
        (r.status || 'pending').toLowerCase() === statusFilter.toLowerCase();

      const matchesRole =
        roleFilter === 'All' ||
        userRole.toLowerCase() === roleFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [requests, searchQuery, statusFilter, roleFilter]);

  const totalPages = Math.ceil(filteredRequests.length / PAGE_SIZE) || 1;
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredRequests.slice(start, start + PAGE_SIZE);
  }, [filteredRequests, currentPage]);

  return (
    <>
      <ToastNotification message={toastMessage} onClose={() => setToastMessage(null)} />
      <div className="space-y-6">
        {/* Upper Left Back Navigation */}
        <div>
          <BackButton to="/admin/dashboard" label="Back to Dashboard" />
        </div>

        {/* Top Header */}
        <div>
          <div className="flex items-center gap-2">
            <UserCheck size={28} className="text-brand-red" />
            <h1 className="text-3xl font-bold text-ink">Account Activation Requests</h1>
          </div>
          <p className="mt-1 text-xs text-ink/50">
            Manage teacher and student account creation and credentials requests submitted via Contact Admin
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-cream p-4 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)]">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
            <input
              type="text"
              placeholder="Search by name, email, LRN / Employee ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-ink/20 bg-cream pl-10 pr-4 py-2 text-xs text-ink outline-none focus:border-brand-blue"
            />
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            {/* Role Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-ink/70">Role:</span>
              <div className="flex items-center rounded-full border border-ink/10 bg-ink/5 p-0.5 text-xs font-semibold">
                {['All', 'Teacher', 'Student'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRoleFilter(r)}
                    className={`rounded-full px-3 py-1 text-xs transition-colors cursor-pointer ${
                      roleFilter === r
                        ? 'bg-white text-ink shadow-xs font-bold'
                        : 'text-ink/60 hover:text-ink'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Funnel size={16} className="text-ink/40" />
              <span className="text-xs font-bold text-ink/70">Status:</span>
              <div className="flex items-center rounded-full border border-ink/10 bg-ink/5 p-0.5 text-xs font-semibold">
                {['All', 'Pending', 'Approved', 'Rejected'].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={`rounded-full px-3 py-1 text-xs transition-colors cursor-pointer ${
                      statusFilter === status
                        ? 'bg-white text-ink shadow-xs font-bold'
                        : 'text-ink/60 hover:text-ink'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Table Matching Standard Super Admin / Admin Table Styling */}
        <div className="rounded-2xl border border-ink/10 bg-cream shadow-[0px_2px_8px_rgba(26,24,22,0.06)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-sm table-fixed">
              <thead>
                <tr className="border-b border-ink/10 bg-ink/[0.02] text-xs">
                  <th className="w-[10%] px-5 py-3 text-left font-bold text-ink/50">Role</th>
                  <th className="w-[20%] px-4 py-3 text-left font-bold text-ink/50">Full Name</th>
                  <th className="w-[18%] px-4 py-3 text-left font-bold text-ink/50">LRN / Employee ID</th>
                  <th className="w-[10%] px-4 py-3 text-left font-bold text-ink/50">Sex / Gender</th>
                  <th className="w-[24%] px-4 py-3 text-left font-bold text-ink/50">Email Address</th>
                  <th className="w-[14%] px-4 py-3 text-center font-bold text-ink/50">Request Status</th>
                  <th className="w-[14%] pr-5 py-3 text-right font-bold text-ink/50">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {loading ? (
                  [1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-5 py-3"><div className="h-4 w-12 rounded bg-ink/10" /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="size-7 shrink-0 rounded-full bg-ink/10" />
                          <div className="h-3.5 w-28 rounded bg-ink/10" />
                        </div>
                      </td>
                      <td className="px-4 py-3"><div className="h-3.5 w-20 rounded bg-ink/10" /></td>
                      <td className="px-4 py-3"><div className="h-3.5 w-12 rounded bg-ink/10" /></td>
                      <td className="px-4 py-3"><div className="h-3.5 w-36 rounded bg-ink/10" /></td>
                      <td className="px-4 py-3"><div className="h-4 w-16 mx-auto rounded bg-ink/10" /></td>
                      <td className="pr-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-7 w-20 rounded-lg bg-ink/10" />
                          <div className="h-7 w-16 rounded-lg bg-ink/10" />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-10 text-center">
                      <div className="mx-auto max-w-sm flex flex-col items-center justify-center space-y-2">
                        <UserCheck size={40} className="text-ink/30" />
                        <h4 className="text-sm font-bold text-ink">
                          {requests.length === 0 ? 'No Account Activation Requests' : 'No Matching Account Requests'}
                        </h4>
                        <p className="text-xs text-ink/60 leading-relaxed">
                          {requests.length === 0
                            ? 'There are currently no account activation requests submitted.'
                            : 'No account activation requests match your search or status filter.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedRequests.map((req) => {
                    const userRole = (req.role || 'Teacher').toLowerCase() === 'student' ? 'Student' : 'Teacher';
                    const tName = req.full_name || [req.first_name, req.middle_name, req.last_name].filter(Boolean).join(' ') || userRole;
                    const parentEmail = req.parent_email || (req.message && req.message.includes('Parent Email:') ? req.message.replace('Parent Email:', '').trim() : null);
                    return (
                      <tr key={req.request_id || req.email} className="group hover:bg-ink/[0.02] transition-colors">
                        <td className="px-5 py-3 text-xs font-bold">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
                            userRole === 'Student'
                              ? 'bg-purple-100 text-purple-700 border-purple-200'
                              : 'bg-brand-blue/10 text-brand-blue border-brand-blue/20'
                          }`}>
                            <span>{userRole}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-xs text-ink">
                          <div className="flex items-center gap-2.5">
                            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue font-bold text-xs">
                              {(tName || 'U')[0]}
                            </div>
                            <div>
                              <div className="text-ink font-bold text-xs">{tName}</div>
                              {req.grade_level && (
                                <div className="text-[10px] font-normal text-ink/50">{req.grade_level}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-ink/80">{req.id_number || req.teacher_no || 'N/A'}</td>
                        <td className="px-4 py-3 text-xs text-ink/70">{req.sex || 'Male'}</td>
                        <td className="px-4 py-3 text-xs text-ink/70">
                          <div>
                            <div className="font-medium text-ink">{req.email}</div>
                            {userRole === 'Student' && parentEmail && (
                              <div className="text-[10px] text-ink/50">Parent: {parentEmail}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-xs whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                            req.status === 'approved' ? 'bg-green-100 text-green-700 border-green-200' :
                            req.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                            'bg-amber-100 text-amber-700 border-amber-200'
                          }`}>
                            <span className={`size-1.5 rounded-full ${
                              req.status === 'approved' ? 'bg-green-600' :
                              req.status === 'rejected' ? 'bg-red-600' :
                              'bg-amber-600'
                            }`} />
                            <span>{(req.status || 'PENDING').toUpperCase()}</span>
                          </span>
                        </td>
                        <td className="pr-5 py-3 text-right">
                          {req.status === 'pending' ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                disabled={processingId === (req.request_id || req.email)}
                                onClick={() => handleApprove(req.request_id || req.email, tName)}
                                className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-green-700 transition-colors cursor-pointer disabled:opacity-50"
                              >
                                <Check size={14} weight="bold" />
                                <span>Approve</span>
                              </button>
                              <button
                                type="button"
                                disabled={processingId === (req.request_id || req.email)}
                                onClick={() => handleReject(req.request_id || req.email, tName)}
                                className="flex items-center gap-1 rounded-lg border border-ink/10 bg-cream px-2.5 py-1 text-xs font-semibold text-ink/70 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer disabled:opacity-50"
                              >
                                <X size={14} weight="bold" />
                                <span>Reject</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs font-semibold text-ink/40">
                              {req.status === 'approved' ? 'Approved' : 'Rejected'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer / Pagination Controls */}
          {filteredRequests.length > 0 && (
            <div className="px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-ink/10 text-xs text-ink/60 bg-ink/[0.01]">
              <span>
                {filteredRequests.length === 0
                  ? 'Showing 0 of 0 account requests'
                  : `Showing ${(currentPage - 1) * PAGE_SIZE + 1} to ${Math.min(currentPage * PAGE_SIZE, filteredRequests.length)} of ${filteredRequests.length} account requests`}
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
                    {getCompactPageItems(totalPages, currentPage).map((pg, index) =>
                      pg === 'ellipsis' ? (
                        <span key={`ellipsis-${index}`} className="flex size-8 items-center justify-center text-xs font-bold text-ink/45" aria-hidden="true">
                          …
                        </span>
                      ) : (
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
                      )
                    )}
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
    </>
  );
}
