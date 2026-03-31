'use client';

import { useState } from 'react';
import { Trash2, UserPlus, Crown, UserCheck } from 'lucide-react';
import { Member } from '@/lib/types';
import { cn, getInitials, getAvatarColor } from '@/lib/utils';
import { useSessionStore } from '@/lib/store';
import { useToast } from './Toast';

interface MembersCardProps {
  sessionId: string;
  members: Member[];
}

export default function MembersCard({ sessionId, members }: MembersCardProps) {
  const [newName, setNewName]       = useState('');
  const [showInput, setShowInput]   = useState(false);
  const { addMember, removeMember } = useSessionStore();
  const { showToast }               = useToast();

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    if (members.some(m => m.name.toLowerCase() === name.toLowerCase())) {
      showToast('Name already exists', 'warning');
      return;
    }
    addMember(sessionId, name);
    setNewName('');
    setShowInput(false);
    showToast(`${name} joined! 🎉`);
  };

  const handleRemove = (member: Member) => {
    removeMember(sessionId, member.id);
    showToast(`${member.name} removed`);
  };

  return (
    <div className="card p-4 animate-[fade-in_0.25s_ease-out]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <span className="text-lg">👥</span> Members
          <span className="badge badge-neutral ml-0.5">{members.length}</span>
        </h3>
        <button
          onClick={() => setShowInput(!showInput)}
          className={cn(
            'flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-xl transition-all',
            showInput
              ? 'bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-700'
              : 'text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20'
          )}
        >
          <UserPlus size={15} strokeWidth={2.5} />
          {showInput ? 'Cancel' : 'Add'}
        </button>
      </div>

      {/* Inline add */}
      {showInput && (
        <div className="flex gap-2 mb-3 animate-[scale-in_0.2s_cubic-bezier(0.16,1,0.3,1)]">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleAdd();
              if (e.key === 'Escape') setShowInput(false);
            }}
            placeholder="Enter name…"
            className="input flex-1 h-10 text-sm"
            autoFocus
            id="new-member-name"
          />
          <button
            onClick={handleAdd}
            disabled={!newName.trim()}
            className="btn-primary h-10 px-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
      )}

      {/* Member chips */}
      <div className="flex flex-wrap gap-2">
        {members.map((member, i) => (
          <div
            key={member.id}
            className="group flex items-center gap-2 px-3 py-1.5 rounded-xl
                       bg-white/70 dark:bg-slate-800/70
                       border border-white/90 dark:border-slate-700/60
                       hover:bg-white dark:hover:bg-slate-800
                       hover:border-sky-100 dark:hover:border-sky-900
                       shadow-sm hover:shadow-md
                       backdrop-blur-sm transition-all"
          >
            <div className={cn('avatar w-7 h-7 text-xs shadow-sm', getAvatarColor(i))}>
              {getInitials(member.name)}
            </div>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {member.name}
            </span>
            {i === 0 && <span title="Owner"><Crown size={12} className="text-amber-400" /></span>}
            <button
              onClick={() => handleRemove(member)}
              className="opacity-0 group-hover:opacity-100 transition-opacity ml-0.5
                         text-slate-300 dark:text-slate-600
                         hover:text-red-500 dark:hover:text-red-400
                         hover:bg-red-50 dark:hover:bg-red-900/30
                         p-0.5 rounded-md"
              title="Remove member"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>

      {/* Empty */}
      {members.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-5 text-center">
          <div className="w-12 h-12 bg-sky-50 dark:bg-sky-900/30 rounded-2xl flex items-center justify-center">
            <UserCheck size={22} className="text-sky-300 dark:text-sky-700" />
          </div>
          <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">
            Add members to get started 🚀
          </p>
        </div>
      )}
    </div>
  );
}