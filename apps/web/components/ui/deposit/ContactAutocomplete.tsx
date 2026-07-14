import React from 'react';
import { User } from 'lucide-react';
import { Contact } from '@/lib/utils/contacts';
import { truncateAddress } from '@/lib/utils/format';

interface ContactAutocompleteProps {
  contacts: Contact[];
  query: string;
  onSelect: (address: string) => void;
  visible: boolean;
}

const ContactAutocomplete: React.FC<ContactAutocompleteProps> = ({
  contacts,
  query,
  onSelect,
  visible,
}) => {
  if (!visible) return null;

  const normalizedQuery = query.trim().toLowerCase();
  
  // Filter contacts by matching name or address
  const filtered = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(normalizedQuery) ||
      c.address.toLowerCase().includes(normalizedQuery)
  );

  // If input is empty, show all contacts. If input is not empty but no matches found, don't render or show "No matches"
  if (filtered.length === 0) {
    if (!normalizedQuery) return null; // don't show empty dropdown if no query and no contacts
    return (
      <div className="absolute left-0 right-0 mt-1 bg-white border border-outline-variant rounded-xl shadow-lg z-50 p-3 text-center text-xs text-on-surface-variant">
        No matching contacts saved
      </div>
    );
  }

  return (
    <div className="absolute left-0 right-0 mt-1 bg-white border border-outline-variant rounded-xl shadow-lg z-50 max-h-56 overflow-y-auto overflow-hidden divide-y divide-outline-variant/50">
      {filtered.map((contact) => (
        <button
          key={contact.address}
          type="button"
          onMouseDown={() => onSelect(contact.address)}
          className="w-full text-left px-4 py-2.5 hover:bg-surface-container transition-colors flex items-center gap-3 cursor-pointer border-0 bg-transparent"
        >
          <div className="p-1.5 bg-primary/10 rounded-full text-primary shrink-0">
            <User size={14} />
          </div>
          <div className="flex-grow min-w-0">
            <p className="text-xs font-bold text-on-surface truncate">{contact.name}</p>
            <p className="text-[10px] font-mono text-on-surface-variant truncate">
              {truncateAddress(contact.address)}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
};

export default ContactAutocomplete;
