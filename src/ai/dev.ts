import { config } from 'dotenv';
config();

import '@/ai/flows/phishing-email-detection.ts';
import '@/ai/flows/url-risk-assessment.ts';
import '@/ai/flows/ai-assisted-reply.ts';