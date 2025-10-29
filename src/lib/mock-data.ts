import type { MockEmail } from '@/lib/types';

export const mockEmails: MockEmail[] = [
  {
    label: 'Suspicious Email Example',
    subject: 'Urgent Action Required: Your Accont is Suspended!',
    senderDomain: 'secure-bank-support.com',
    senderIp: '198.51.100.23',
    urlList: ['http://bit.ly/verify-acct-now'],
    body: `
Dear Valued Customer,

We have detected unusual activity on your account. For your security, we have temporarily suspended your account.

To restore access, you must verify your identity immediately. Please click the link below to login and confirm your details.

Click here: http://bit.ly/verify-acct-now

Failure to do so within 24 hours will result in permanent account closure.

Thank you,
Your Bank Security Team
`,
  },
  {
    label: 'Safe Email Example',
    subject: 'Weekly Project Update',
    senderDomain: 'your-company.com',
    senderIp: '203.0.113.15',
    urlList: ['https://your-company.com/docs/project-alpha'],
    body: `
Hi Team,

Here is the weekly update for Project Alpha.

We have successfully completed the user authentication module and are on track with the project timeline. Please review the latest documentation attached and on our project portal.

Docs link: https://your-company.com/docs/project-alpha

Let's sync up on Monday to discuss the next phase.

Best,
Project Manager
`,
  },
];
