import type { MockEmail, InboxEmail } from '@/lib/types';

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


export const inboxEmails: InboxEmail[] = [
    {
      id: '1',
      from: { name: 'Alice', email: 'alice@example.com', avatar: 'https://i.pravatar.cc/150?u=alice' },
      subject: 'Project discussion',
      snippet: 'Hi team, let\'s discuss the new project features.',
      body: '<p>Hi team,</p><p>Let\'s discuss the new project features. I have some ideas I\'d like to share.</p><p>Best,</p><p>Alice</p>',
      date: '2024-05-20T10:00:00Z',
      unread: true,
      tags: ['work', 'project'],
    },
    {
      id: '2',
      from: { name: 'Bob', email: 'bob@example.com', avatar: 'https://i.pravatar.cc/150?u=bob' },
      subject: 'Lunch today?',
      snippet: 'Hey, are you free for lunch today at 1 PM?',
      body: '<p>Hey,</p><p>Are you free for lunch today at 1 PM? I know a great new place.</p><p>Cheers,</p><p>Bob</p>',
      date: '2024-05-20T09:30:00Z',
      unread: true,
      tags: ['social'],
    },
    {
      id: '3',
      from: { name: 'Marketing @ CoolApp', email: 'marketing@coolapp.com', avatar: 'https://i.pravatar.cc/150?u=coolapp' },
      subject: 'New features in CoolApp!',
      snippet: 'We\'ve just released some amazing new features you\'ll love.',
      body: '<p>Hello!</p><p>We\'ve just released some amazing new features you\'ll love. Check them out now!</p>',
      date: '2024-05-19T15:00:00Z',
      unread: false,
      tags: ['promotions'],
    },
    {
        id: '4',
        from: { name: 'Charlie', email: 'charlie@example.com', avatar: 'https://i.pravatar.cc/150?u=charlie' },
        subject: 'Re: Your submission',
        snippet: 'Thanks for your submission, we will review it shortly.',
        body: '<p>Hi,</p><p>Thanks for your submission, we will review it shortly.</p><p>Regards,</p><p>Charlie</p>',
        date: '2024-05-18T12:00:00Z',
        unread: false,
        tags: [],
    },
    {
        id: '5',
        from: { name: 'Diana', email: 'diana@example.com', avatar: 'https://i.pravatar.cc/150?u=diana' },
        subject: 'Weekend plans',
        snippet: 'Any plans for this weekend? I was thinking of going for a hike.',
        body: '<p>Hey,</p><p>Any plans for this weekend? I was thinking of going for a hike. Let me know if you are interested!</p><p>Best,</p><p>Diana</p>',
        date: '2024-05-17T18:00:00Z',
        unread: false,
        tags: ['social'],
    }
];
