import React, { useState } from 'react';
import { createMember, MEMBER_COLORS } from './SplitEngine';
import Button from '../../components/Button';
import Card from '../../components/Card';

// ─── MemberAvatar (NAMED EXPORT) ───────────────────────────────────────
export function MemberAvatar({ member, size = 'md', showName = false }) {
  const sizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
  };

  const initials = member.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`${sizes[size]} ${member.color.bg} ${member.color.text} rounded-full flex items-center justify-center font-black shrink-0`}
      >
        {initials}
      </div>
      {showName && (
        <p className="text-xs text-slate-500 text-center truncate max-w-[60px]">
          {member.name}
        </p>
      )}
    </div>
  );
}

// ─── MemberRow ──────────────────────────────────────────────────────────
function MemberRow({ member, onDelete, expenseCount }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleDelete() {
    if (confirmDelete) {
      onDelete(member.id);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  }

  return (
    <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 hover:bg-slate-100 transition">
      <div className="flex items-center gap-3">
        <MemberAvatar member={member} size="md" />
        <div>
          <p className="font-bold text-sm">{member.name}</p>
          <p className="text-xs text-slate-400">
            {expenseCount} ta expense e involved
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: member.color.hex }}
        />
        <button
          onClick={handleDelete}
          className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition ${
            confirmDelete
              ? 'bg-red-500 text-white'
              : 'bg-slate-200 text-slate-500 hover:bg-red-100 hover:text-red-500'
          }`}
        >
          {confirmDelete ? '!' : '×'}
        </button>
      </div>
    </div>
  );
}

// ─── AddMemberForm ──────────────────────────────────────────────────────
function AddMemberForm({ onAdd, memberCount }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  function handleAdd() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Name likhte hobe.');
      return;
    }
    if (trimmed.length < 2) {
      setError('Name kam se kam 2 character er hobe.');
      return;
    }
    if (memberCount >= 8) {
      setError('Maximum 8 jon member add kora jay.');
      return;
    }
    onAdd(trimmed);
    setName('');
    setError('');
  }

  function handleKey(e) {
    if (e.key === 'Enter') handleAdd();
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          className="flex-1 min-w-0 rounded-2xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-950"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
          onKeyDown={handleKey}
          placeholder="Member er naam likho..."
        />
        <Button onClick={handleAdd} disabled={!name.trim()}>
          + Add
        </Button>
      </div>
      {error && <p className="text-xs text-red-500 font-bold px-1">{error}</p>}
    </div>
  );
}

// ─── ColorPreview ───────────────────────────────────────────────────────
function ColorPreview({ memberCount }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {MEMBER_COLORS.map((c, index) => (
        <div
          key={index}
          className={`w-5 h-5 rounded-full ${c.bg} ${
            index < memberCount
              ? 'ring-2 ring-offset-1 ring-slate-400'
              : 'opacity-30'
          }`}
        />
      ))}
    </div>
  );
}

// ─── EmptyMembers ───────────────────────────────────────────────────────
function EmptyMembers() {
  return (
    <div className="py-8 text-center">
      <p className="text-4xl">👥</p>
      <p className="font-bold text-slate-700">Kono member nei</p>
      <p className="text-sm text-slate-400">
        Upore naam likhe member add koro.
      </p>
    </div>
  );
}

// ─── QuickSuggestions ───────────────────────────────────────────────────
function QuickSuggestions({ onAdd, existingNames }) {
  const suggestions = [
    'Rahim',
    'Karim',
    'Sadia',
    'Nadia',
    'Rafi',
    'Toma',
    'Arif',
    'Mitu',
  ].filter((name) => !existingNames.includes(name));

  if (suggestions.length === 0) return null;

  return (
    <div>
      <p className="text-xs text-slate-400 mb-2">Quick add:</p>
      <div className="flex flex-wrap gap-1.5">
        {suggestions.slice(0, 5).map((name) => (
          <button
            key={name}
            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 hover:bg-slate-200 transition"
            onClick={() => onAdd(name)}
          >
            + {name}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── MemberList (DEFAULT EXPORT) ────────────────────────────────────────
function MemberList({ members, expenses, onAdd, onDelete }) {
  const existingNames = members.map((m) => m.name);

  function handleAdd(name) {
    const newMember = createMember(name, members.length);
    onAdd(newMember);
  }

  function getMemberExpenseCount(memberId) {
    return expenses.filter(
      (e) =>
        e.paidById === memberId ||
        (e.memberIds || []).includes(memberId)
    ).length;
  }

  return (
    <Card padding={false} className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-black">Group Members</h3>
          <p className="text-xs text-slate-400">
            {members.length}/8 members added
          </p>
        </div>
        <ColorPreview memberCount={members.length} />
      </div>

      {/* Add member form */}
      <AddMemberForm onAdd={handleAdd} memberCount={members.length} />

      {/* Quick suggestions */}
      {members.length < 8 && (
        <div className="mt-3">
          <QuickSuggestions onAdd={handleAdd} existingNames={existingNames} />
        </div>
      )}

      {/* Member list */}
      <div className="mt-4 space-y-2">
        {members.length === 0 ? (
          <EmptyMembers />
        ) : (
          members.map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              onDelete={onDelete}
              expenseCount={getMemberExpenseCount(member.id)}
            />
          ))
        )}
      </div>

      {/* Footer avatars */}
      {members.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            {members.map((m) => (
              <MemberAvatar key={m.id} member={m} size="sm" showName />
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

export default MemberList;
