import { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  MagnifyingGlass,
  Funnel,
  CheckCircle,
  XCircle,
  Pencil,
  X,
  WarningCircle,
  UserGear,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Eye,
} from '@phosphor-icons/react';
import { initialAdminUsers } from '../../data/adminData.js';

export default function AdminUserManagement() {
  const { globalSearch } = useOutletContext() || {};
  const [users, setUsers] = useState(initialAdminUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals state
  const [viewingUser, setViewingUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [toggleStatusUser, setToggleStatusUser] = useState(null);

  // Form State
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    role: 'Teacher',
  });

  // Toast notification
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    const query = (globalSearch || searchQuery).toLowerCase().trim();
    return users.filter((u) => {
      const matchesSearch =
        !query ||
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.role.toLowerCase().includes(query);

      const matchesRole = roleFilter === 'All' || u.role === roleFilter;
      const matchesStatus = statusFilter === 'All' || u.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, globalSearch, searchQuery, roleFilter, statusFilter]);

  // Handlers
  const handleSaveUser = (e) => {
    e.preventDefault();
    if (editingUser) {
      setUsers((prev) =>
        prev.map((u) => (u.id === editingUser.id ? { ...u, ...editFormData } : u))
      );
      showToast(`User details for ${editFormData.name} updated.`);
      setEditingUser(null);
    }
  };

  const handleConfirmToggleStatus = () => {
    if (toggleStatusUser) {
      const newStatus = toggleStatusUser.status === 'Active' ? 'Inactive' : 'Active';
      setUsers((prev) =>
        prev.map((u) => (u.id === toggleStatusUser.id ? { ...u, status: newStatus } : u))
      );
      showToast(`Account for ${toggleStatusUser.name} is now ${newStatus}.`);
      setToggleStatusUser(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-[#00a652] px-4 py-3 text-xs font-semibold text-white shadow-lg animate-in fade-in">
          <CheckCircle size={18} weight="fill" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <UserGear size={28} className="text-brand-red" />
            <h1 className="text-3xl font-bold text-ink">User Management</h1>
          </div>
          <p className="mt-1 text-xs text-ink/50">
            Control user access roles, account status, and system security privileges
          </p>
        </div>

        <div className="rounded-2xl border border-ink/10 bg-cream px-4 py-2.5 shadow-[0px_2px_4px_rgba(0,0,0,0.04)] text-xs font-semibold text-ink flex items-center gap-2">
          <ShieldCheck size={18} className="text-[#00a652]" />
          <span>Security Protocol Active</span>
        </div>
      </div>

      {/* Toolbar Filter */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 rounded-2xl border border-ink/10 bg-cream p-4 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)]">
        <div className="relative w-full md:w-80">
          <MagnifyingGlass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-ink/20 bg-cream pl-10 pr-4 py-2 text-xs text-ink outline-none focus:border-brand-blue"
          />
        </div>

        <div className="flex w-full md:w-auto items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-ink/60 font-semibold">
            <Funnel size={16} />
            <span>Filter By:</span>
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-full border border-ink/20 bg-cream px-3.5 py-1.5 text-xs font-medium text-ink outline-none focus:border-brand-blue"
          >
            <option value="All">All Roles</option>
            <option value="School Admin">School Admin</option>
            <option value="Teacher">Teacher</option>
            <option value="Parent">Parent</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-full border border-ink/20 bg-cream px-3.5 py-1.5 text-xs font-medium text-ink outline-none focus:border-brand-blue"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Main User Table matching Phil-IRI table styling */}
      <div className="rounded-2xl border border-ink/10 bg-cream p-6 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="text-xs text-ink/70">
                <th className="border border-ink/10 bg-ink/[0.03] p-2 text-left">User Name</th>
                <th className="border border-ink/10 bg-ink/[0.03] p-2 text-left">Email Address</th>
                <th className="border border-ink/10 bg-ink/[0.03] p-2 text-left">Role</th>
                <th className="border border-ink/10 bg-ink/[0.03] p-2 text-left">Status</th>
                <th className="border border-ink/10 bg-ink/[0.03] p-2 text-left">Last Login</th>
                <th className="border border-ink/10 bg-ink/[0.03] p-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="border border-ink/10 p-6 text-center text-ink/40">
                    No user accounts found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((usr) => (
                  <tr key={usr.id} className="hover:bg-ink/[0.02] transition-colors">
                    <td className="border border-ink/10 p-2 font-semibold text-ink">{usr.name}</td>
                    <td className="border border-ink/10 p-2 text-ink/70 text-xs">{usr.email}</td>
                    <td className="border border-ink/10 p-2 text-xs font-semibold">
                      <span
                        className={`rounded-full px-2.5 py-0.5 ${
                          usr.role === 'School Admin'
                            ? 'bg-brand-red/10 text-brand-red'
                            : usr.role === 'Teacher'
                            ? 'bg-brand-blue/10 text-brand-blue'
                            : 'bg-purple-100 text-purple-700'
                        }`}
                      >
                        {usr.role}
                      </span>
                    </td>
                    <td className="border border-ink/10 p-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          usr.status === 'Active'
                            ? 'bg-[#00a652]/15 text-[#00a652]'
                            : 'bg-ink/10 text-ink/50'
                        }`}
                      >
                        {usr.status === 'Active' ? <CheckCircle size={12} weight="fill" /> : <XCircle size={12} />}
                        {usr.status}
                      </span>
                    </td>
                    <td className="border border-ink/10 p-2 text-ink/50 text-xs">{usr.lastLogin}</td>
                    <td className="border border-ink/10 p-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setViewingUser(usr)}
                          className="rounded-lg p-1.5 text-ink/60 hover:bg-ink/5 hover:text-ink cursor-pointer"
                          title="View Account Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingUser(usr);
                            setEditFormData({
                              name: usr.name,
                              email: usr.email,
                              role: usr.role,
                            });
                          }}
                          className="rounded-lg p-1.5 text-ink/60 hover:bg-ink/5 hover:text-ink cursor-pointer"
                          title="Edit User Info"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setToggleStatusUser(usr)}
                          className={`rounded-lg p-1.5 cursor-pointer ${
                            usr.status === 'Active'
                              ? 'text-brand-red hover:bg-brand-red/10'
                              : 'text-[#00a652] hover:bg-[#00a652]/10'
                          }`}
                          title={usr.status === 'Active' ? 'Deactivate Account' : 'Activate Account'}
                        >
                          {usr.status === 'Active' ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View User Details Modal */}
      {viewingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-ink/10 bg-cream p-6 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-ink/10">
              <h3 className="text-base font-bold text-ink">User Account Profile</h3>
              <button
                type="button"
                onClick={() => setViewingUser(null)}
                className="rounded-lg p-1 text-ink/40 hover:bg-ink/5 hover:text-ink cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-ink/5">
                <span className="text-ink/50">Full Name</span>
                <span className="font-bold text-ink">{viewingUser.name}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-ink/5">
                <span className="text-ink/50">Email Address</span>
                <span className="font-bold text-ink">{viewingUser.email}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-ink/5">
                <span className="text-ink/50">Assigned Role</span>
                <span className="font-bold text-brand-blue">{viewingUser.role}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-ink/5">
                <span className="text-ink/50">Account Status</span>
                <span className="font-bold text-[#00a652]">{viewingUser.status}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-ink/5">
                <span className="text-ink/50">Account Created</span>
                <span className="font-semibold text-ink/80">{viewingUser.dateCreated}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-ink/50">Last Login Activity</span>
                <span className="font-semibold text-ink/80">{viewingUser.lastLogin}</span>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end border-t border-ink/10">
              <button
                type="button"
                onClick={() => setViewingUser(null)}
                className="rounded-full bg-brand-blue px-5 py-2 text-xs font-medium text-cream cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-ink/10 bg-cream p-6 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-ink/10">
              <h3 className="text-base font-bold text-ink">Edit User Account</h3>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="rounded-lg p-1 text-ink/40 hover:bg-ink/5 hover:text-ink cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-ink">Full Name</label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs text-ink outline-none focus:border-brand-blue"
                />
              </div>

              <div>
                <label className="font-semibold text-ink">Email Address</label>
                <input
                  type="email"
                  required
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs text-ink outline-none focus:border-brand-blue"
                />
              </div>

              <div>
                <label className="font-semibold text-ink">System Role</label>
                <select
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs text-ink outline-none focus:border-brand-blue"
                >
                  <option value="School Admin">School Admin</option>
                  <option value="Teacher">Teacher</option>
                  <option value="Parent">Parent</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-ink/10">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="rounded-full border border-ink/10 bg-cream px-4 py-2 text-xs font-medium text-ink/70 hover:bg-ink/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-brand-blue px-5 py-2 text-xs font-medium text-cream shadow-sm hover:bg-blue-700 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toggle Active Status Modal */}
      {toggleStatusUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl border border-ink/10 bg-cream p-6 shadow-2xl text-center animate-in fade-in">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue mb-3">
              <WarningCircle size={28} weight="fill" />
            </div>
            <h3 className="text-base font-bold text-ink">
              {toggleStatusUser.status === 'Active' ? 'Deactivate Account?' : 'Activate Account?'}
            </h3>
            <p className="mt-1 text-xs text-ink/60">
              Are you sure you want to {toggleStatusUser.status === 'Active' ? 'deactivate' : 'activate'} access for{' '}
              <span className="font-bold text-ink">{toggleStatusUser.name}</span>?
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setToggleStatusUser(null)}
                className="rounded-full border border-ink/10 bg-cream px-4 py-2 text-xs font-medium text-ink/70 hover:bg-ink/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmToggleStatus}
                className="rounded-full bg-brand-blue px-5 py-2 text-xs font-medium text-cream shadow-sm hover:bg-blue-700 cursor-pointer"
              >
                Confirm Status Change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
