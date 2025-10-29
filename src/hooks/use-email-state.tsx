'use client';

import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from 'react';
import { InboxEmail, SentEmail } from '@/lib/types';
import { inboxEmails as initialInboxEmails, sentEmails as initialSentEmails } from '@/lib/mock-data';

interface EmailContextType {
  inboxEmails: InboxEmail[];
  setInboxEmails: Dispatch<SetStateAction<InboxEmail[]>>;
  sentEmails: SentEmail[];
  setSentEmails: Dispatch<SetStateAction<SentEmail[]>>;
}

const EmailContext = createContext<EmailContextType | undefined>(undefined);

export const EmailProvider = ({ children }: { children: ReactNode }) => {
  const [inboxEmails, setInboxEmails] = useState<InboxEmail[]>(initialInboxEmails);
  const [sentEmails, setSentEmails] = useState<SentEmail[]>(initialSentEmails);

  return (
    <EmailContext.Provider value={{ inboxEmails, setInboxEmails, sentEmails, setSentEmails }}>
      {children}
    </EmailContext.Provider>
  );
};

export const useEmailState = () => {
  const context = useContext(EmailContext);
  if (context === undefined) {
    throw new Error('useEmailState must be used within an EmailProvider');
  }
  return context;
};
