'use server';

/**
 * @fileOverview A phishing email detection AI agent.
 *
 * - detectPhishingEmail - A function that handles the phishing email detection process.
 * - DetectPhishingEmailInput - The input type for the detectPhishingEmail function.
 * - DetectPhishingEmailOutput - The return type for the detectPhishingEmail function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectPhishingEmailInputSchema = z.object({
  emailBody: z.string().describe('The content of the email to analyze.'),
  senderDomain: z.string().describe('The domain of the sender email address.'),
  emailSubject: z.string().describe('The subject line of the email.'),
  senderIp: z.string().describe('The IP address of the sender.'),
  urlList: z.array(z.string()).describe('List of urls found in the email'),
});
export type DetectPhishingEmailInput = z.infer<typeof DetectPhishingEmailInputSchema>;

const DetectPhishingEmailOutputSchema = z.object({
  isPhishing: z.boolean().describe('Whether or not the email is classified as phishing.'),
  phishingScore: z.number().describe('A score indicating the likelihood of the email being a phishing attempt (0-1).'),
  riskFactors: z.array(z.string()).describe('A list of factors contributing to the phishing risk.'),
  safeReplySuggestion: z.string().describe('A suggestion for a safe and professional reply.'),
});
export type DetectPhishingEmailOutput = z.infer<typeof DetectPhishingEmailOutputSchema>;

export async function detectPhishingEmail(input: DetectPhishingEmailInput): Promise<DetectPhishingEmailOutput> {
  return detectPhishingEmailFlow(input);
}

const detectPhishingEmailPrompt = ai.definePrompt({
  name: 'detectPhishingEmailPrompt',
  input: {schema: DetectPhishingEmailInputSchema},
  output: {schema: DetectPhishingEmailOutputSchema},
  prompt: `You are an expert in identifying phishing emails. Analyze the provided email content, sender information, and URLs to determine if it is a phishing attempt.

Email Body: {{{emailBody}}}
Sender Domain: {{{senderDomain}}}
Email Subject: {{{emailSubject}}}
Sender IP: {{{senderIp}}}
URLs: {{#each urlList}}{{{this}}} {{/each}}

Based on your analysis, provide the following:

*   isPhishing: true if the email is likely a phishing attempt, false otherwise.
*   phishingScore: A score between 0 and 1 indicating the likelihood of the email being a phishing attempt.
*   riskFactors: A list of factors that contribute to the phishing risk, such as suspicious URLs, sender domain, or email content.
*   safeReplySuggestion: Suggest a safe and professional reply, avoiding any sensitive information or potentially harmful interactions.

Consider the following when making your determination:

*   Suspicious URLs: Check for URL shorteners, unusual domains, or redirects.
*   Sender Domain: Verify the legitimacy of the sender domain and check for any inconsistencies.
*   Email Content: Analyze the email body for grammar errors, urgent requests, or suspicious links.
*   Sender IP: Verify if the sender IP address is associated with any known malicious activity.

Output in JSON format.
`,
});

const detectPhishingEmailFlow = ai.defineFlow(
  {
    name: 'detectPhishingEmailFlow',
    inputSchema: DetectPhishingEmailInputSchema,
    outputSchema: DetectPhishingEmailOutputSchema,
  },
  async input => {
    const {output} = await detectPhishingEmailPrompt(input);
    return output!;
  }
);
