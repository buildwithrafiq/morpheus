import { useState, useEffect, useCallback } from 'react'
import { UserPlus, Trash2, Shield, Pencil, Eye, Users } from 'lucide-react'
import { useServices } from '@/contexts/ServiceContext'

type Role = 'viewer' | 'editor' | 'admin'

interface TeamMember {
  id: string
  name: string
  email: string
  role: Role
  joinedAt: string
  avatarInitials: string
}

const roleConfig: Record<Role, { label: string; color: string; icon: typeof Shield }> = {
  admin: { label: 'Admin', color: 'bg-purple-100 text-purple-700', icon: Shield },
  editor: { label: 'Editor', color: 'bg-blue-100 text-blue-700', icon: Pencil },
  viewer: { label: 'Viewer', color: 'bg-gray-100 text-gray-700', icon: Eye },
}

export default function TeamManager() {
  const { storage } = useServices()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<Role>('viewer')

  useEffect(() => {
    storage.getSetting<TeamMember[]>('teamMembers').then(saved => {
      if (saved) setMembers(saved)
      setLoading(false)
    })
  }, [storage])

  const persist = useCallback(
    (updated: TeamMember[]) => storage.saveSetting('teamMembers', updated),
    [storage]
  )

  function inviteMember() {
    if (!inviteEmail.trim()) return
    const name = inviteEmail.split('@')[0] ?? inviteEmail
    const initials = name.slice(0, 2).toUpperCase()
    const newMember: TeamMember = {
      id: `user-${Date.now()}`,
      name,
      email: inviteEmail.trim(),
      role: inviteRole,
      joinedAt: new Date().toISOString(),
      avatarInitials: initials,
    }
    const updated = [...members, newMember]
    setMembers(updated)
    persist(updated)
    setInviteEmail('')
    setInviteRole('viewer')
    setShowInvite(false)
  }

  function changeRole(id: string, role: Role) {
    const updated = members.map(m => (m.id === id ? { ...m, role } : m))
    setMembers(updated)
    persist(updated)
  }

  function removeMember(id: string) {
    const updated = members.filter(m => m.id !== id)
    setMembers(updated)
    persist(updated)
  }

  if (loading) {
    return <div className="text-sm text-gray-500">Loading team members…</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Team</h3>
          <p className="text-sm text-gray-500">Manage team members and their access levels</p>
        </div>
        <button
          type="button"
          onClick={() => setShowInvite(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <UserPlus className="h-4 w-4" />
          Invite Member
        </button>
      </div>

      {showInvite && (
        <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <label htmlFor="invite-email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="colleague@example.com"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="invite-role" className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                id="invite-role"
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value as Role)}
                className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={inviteMember}
                disabled={!inviteEmail.trim()}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                Send Invite
              </button>
              <button
                type="button"
                onClick={() => { setShowInvite(false); setInviteEmail(''); setInviteRole('viewer') }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {members.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-12 text-center">
          <Users className="h-10 w-10 text-gray-400 mb-3" />
          <p className="text-sm font-medium text-gray-900">No team members yet</p>
          <p className="mt-1 text-sm text-gray-500">Invite someone to get started</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
          {members.map(member => {
            const rc = roleConfig[member.role]
            const RoleIcon = rc.icon
            return (
              <div key={member.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                    {member.avatarInitials}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{member.name}</p>
                    <p className="text-xs text-gray-500">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${rc.color}`}>
                    <RoleIcon className="h-3 w-3" />
                    {rc.label}
                  </span>
                  <select
                    value={member.role}
                    onChange={e => changeRole(member.id, e.target.value as Role)}
                    className="rounded-lg border border-gray-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    aria-label={`Change role for ${member.name}`}
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => removeMember(member.id)}
                    className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    aria-label={`Remove ${member.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
