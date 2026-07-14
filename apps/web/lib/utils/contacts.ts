export interface Contact {
  name: string;
  address: string;
}

export const getContacts = (): Contact[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('ingat_contacts');
  return stored ? JSON.parse(stored) : [];
};

export const saveContact = (name: string, address: string) => {
  if (typeof window === 'undefined') return;
  const contacts = getContacts();
  const index = contacts.findIndex((c) => c.address === address);
  if (index >= 0) {
    contacts[index].name = name;
  } else {
    contacts.push({ name, address });
  }
  localStorage.setItem('ingat_contacts', JSON.stringify(contacts));
};

export const getContactName = (address: string): string | null => {
  const contacts = getContacts();
  const contact = contacts.find((c) => c.address === address);
  return contact ? contact.name : null;
};
