import type { DetectPhishingEmailOutput } from '@/ai/flows/phishing-email-detection';
import type { UrlRiskAssessmentOutput } from '@/ai/flows/url-risk-assessment';
import type { AiAssistedReplyOutput } from '@/ai/flows/ai-assisted-reply';

export type AnalysisStatus = 'idle' | 'loading' | 'success' | 'error';

export type EmailAnalysisState = {
  status: AnalysisStatus;
  result: DetectPhishingEmailOutput | null;
  error: string | null;
};

export type UrlAnalysisState = {
  status: AnalysisStatus;
  result: UrlRiskAssessmentOutput | null;
  error: string | null;
};

export type ReplyGenerationState = {
  status: AnalysisStatus;
  result: AiAssistedReplyOutput | null;
  error: string | null;
};

export type MockEmail = {
  subject: string;
  senderDomain: string;
  senderIp: string;
  body: string;
  label: string;
  urlList: string[];
};
