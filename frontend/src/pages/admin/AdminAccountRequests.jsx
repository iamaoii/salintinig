import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCheck,
  MagnifyingGlass,
  Check,
  X,
  Clock,
  EnvelopeSimple,
  Phone,
  Building,
  GraduationCap,
  Funnel,
} from '@phosphor-icons/react';
import ToastNotification from '../../components/common/ToastNotification.jsx';
import BackButton from '../../components/common/BackButton.jsx';
import { getToken } from '../../lib/auth.js';

export default function AdminAccountRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [processingId, setProcessingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchRequests = async () => {
    try {
      const token = getToken();
      const res = await fetch('http://localhost:5000/api/admin/account-requests', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRequests(data.requests || []);
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

  const handleApprove = async (id, name) => {
    if (processingId) return;
    setProcessingId(id);
    try {
      const token = getToken();
      const res = await fetch(`http://localhost:5000/api/admin/account-requests/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Account for ${name} approved! Welcome email sent.`);
        fetchRequests();
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
      const res = await fetch(`http://localhost:5000/api/admin/account-requests/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Account request for ${name} rejected.`);
        fetchRequests();
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
      const name = r.full_name || [r.first_name, r.middle_name, r.last_name].filter(Boolean).join(' ');
      const matchesSearch =
        !query ||
        name.toLowerCase().includes(query) ||
        (r.email && r.email.toLowerCase().includes(query)) ||
        (r.teacher_no && r.teacher_no.toLowerCase().includes(query)) ||
        (r.school_id && r.school_id.includes(query));

      const matchesStatus =
        statusFilter === 'All' ||
        (r.status || 'pending').toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [requests, searchQuery, statusFilter]);

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
            Manage teacher account creation and credentials requests submitted via Contact Admin
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-cream p-4 shadow-[0px_4px_8px_0px_rgba(26,24,22,0.04)]">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
            <input
              type="text"
              placeholder="Search by teacher name, email, or school ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-ink/20 bg-white pl-9 pr-4 py-2 text-xs text-ink outline-none focus:border-brand-blue"
            />
          </div>

          <div className="flex items-center gap-2">
            <Funnel size={16} className="text-ink/40" />
            <span className="text-xs font-bold text-ink/70">Filter Status:</span>
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

        {/* Account Requests Master Table */}
        <div className="rounded-2xl border border-ink/10 bg-cream p-6 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead>
                <tr className="text-xs text-ink/70">
                  <th className="border border-ink/10 bg-ink/[0.03] p-2.5 text-left">Teacher Name</th>
                  <th className="border border-ink/10 bg-ink/[0.03] p-2.5 text-left">Teacher ID</th>
                  <th className="border border-ink/10 bg-ink/[0.03] p-2.5 text-left">Sex / Gender</th>
                  <th className="border border-ink/10 bg-ink/[0.03] p-2.5 text-left">DepEd Email</th>
                  <th className="border border-ink/10 bg-ink/[0.03] p-2.5 text-left">DepEd School ID</th>
                  <th className="border border-ink/10 bg-ink/[0.03] p-2.5 text-left min-w-[130px] whitespace-nowrap">Request Status</th>
                  <th className="border border-ink/10 bg-ink/[0.03] p-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="border border-ink/10 p-12 text-center text-ink/50">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="size-10 rounded-full border-4 border-ink/10 border-t-brand-blue animate-spin" />
                        <span className="text-xs font-bold text-ink/70">Loading account activation requests...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="border border-ink/10 p-12 text-center">
                      <div className="mx-auto max-w-sm flex flex-col items-center justify-center">
                        <UserCheck size={48} weight="regular" className="text-ink/30 mb-3" />
                        <h4 className="text-sm font-bold text-ink tracking-tight">
                          {requests.length === 0 ? 'No Account Activation Requests' : 'No Matching Account Requests'}
                        </h4>
                        <p className="mt-1 text-xs text-ink/60 leading-relaxed">
                          {requests.length === 0
                            ? 'There are currently no account activation requests submitted by teachers.'
                            : 'No account activation requests match your search or status filter.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((req) => {
                    const tName = req.full_name || [req.first_name, req.middle_name, req.last_name].filter(Boolean).join(' ') || 'Teacher';
                    return (
                      <tr key={req.request_id || req.email} className="hover:bg-ink/[0.02] transition-colors">
                        <td className="border border-ink/10 p-2.5 font-bold text-xs text-ink">
                          <div className="flex items-center gap-2">
                            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue font-bold text-xs">
                              {(tName || 'T')[0]}
                            </div>
                            <span>{tName}</span>
                          </div>
                        </td>
                        <td className="border border-ink/10 p-2.5 font-mono text-xs text-ink/80">{req.teacher_no || 'N/A'}</td>
                        <td className="border border-ink/10 p-2.5 text-xs text-ink/70">{req.sex || 'Male'}</td>
                        <td className="border border-ink/10 p-2.5 text-xs text-ink/70">{req.email}</td>
                        <td className="border border-ink/10 p-2.5 font-mono text-xs text-ink/80">{req.school_id}</td>
                        <td className="border border-ink/10 p-2.5 text-xs whitespace-nowrap">
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
                        <td className="border border-ink/10 p-2.5 text-right">
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
        </div>
      </div>
    </>
  );
}
