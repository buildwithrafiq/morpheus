export interface DetectedCapability {
  icon: string
  label: string
  detail: string
}

interface CapabilityRule {
  pattern: RegExp
  icon: string
  label: string
  detail: string
}

const CAPABILITY_RULES: CapabilityRule[] = [
  { pattern: /\b(email|inbox|mail|smtp|imap)\b/i, icon: '📧', label: 'Email', detail: 'Email parsing & response generation' },
  { pattern: /\b(code|syntax|lint|compil|refactor|debug)\b/i, icon: '💻', label: 'Code Analysis', detail: 'Syntax highlighting & linting' },
  { pattern: /\b(slack|discord|teams|chat|messag)\b/i, icon: '💬', label: 'Messaging', detail: 'Chat integration & messaging' },
  { pattern: /\b(database|sql|postgres|mongo|sqlite|dynamo|persist)\b/i, icon: '🗄️', label: 'Database', detail: 'Database querying & persistence' },
  { pattern: /\b(real-time|streaming|websocket|mqtt|live)\b/i, icon: '⚡', label: 'Real-time', detail: 'Real-time streaming & updates' },
  { pattern: /\b(webhook|event|trigger|callback)\b/i, icon: '🔗', label: 'Webhooks', detail: 'Webhook handling & event processing' },
  { pattern: /\b(auth|oauth|jwt|login|session|permission)\b/i, icon: '🔐', label: 'Auth', detail: 'Authentication & authorization' },
  { pattern: /\b(api|endpoint|rest|graphql|grpc)\b/i, icon: '🔌', label: 'API', detail: 'API integration & endpoints' },
  { pattern: /\b(schedule|cron|recurring|periodic|timer)\b/i, icon: '⏰', label: 'Scheduling', detail: 'Scheduled task execution' },
  { pattern: /\b(file|upload|download|pdf|csv|document|image)\b/i, icon: '📁', label: 'Files', detail: 'File processing & document handling' },
  { pattern: /\b(search|index|query|find|lookup|elastic)\b/i, icon: '🔍', label: 'Search', detail: 'Search & indexing capabilities' },
  { pattern: /\b(translate|language|i18n|locali[sz])\b/i, icon: '🌐', label: 'Translation', detail: 'Multi-language translation' },
  { pattern: /\b(payment|stripe|billing|invoice|checkout)\b/i, icon: '💳', label: 'Payments', detail: 'Payment processing & billing' },
  { pattern: /\b(notification|alert|push|sms|twilio)\b/i, icon: '🔔', label: 'Notifications', detail: 'Alerts & push notifications' },
  { pattern: /\b(scrape|crawl|extract|web\s*page|html\s*pars)\b/i, icon: '🕷️', label: 'Scraping', detail: 'Web scraping & data extraction' },
  { pattern: /\b(classif|categoriz|label|tag|sort|triage)\b/i, icon: '🏷️', label: 'Classification', detail: 'Content classification & tagging' },
  { pattern: /\b(summar|digest|tldr|condense|brief)\b/i, icon: '📝', label: 'Summarization', detail: 'Content summarization & digests' },
  { pattern: /\b(deploy|docker|container|kubernetes|ci.?cd)\b/i, icon: '🚀', label: 'Deployment', detail: 'Deployment & containerization' },
]

// Always-included baseline capabilities
const BASELINE_CAPABILITIES: DetectedCapability[] = [
  { icon: '🔌', label: 'API Endpoint', detail: 'RESTful API with authentication' },
  { icon: '🖥️', label: 'Web Interface', detail: 'Instant chat UI for testing' },
  { icon: '📖', label: 'Documentation', detail: 'OpenAPI spec + usage examples' },
  { icon: '📊', label: 'Monitoring', detail: 'Real-time metrics dashboard' },
]

/**
 * Detects capabilities from a description, returning baseline items
 * plus any keyword-matched dynamic capabilities (deduplicated by label).
 */
export function detectCapabilities(description: string): DetectedCapability[] {
  const matched: DetectedCapability[] = []
  const seenLabels = new Set<string>()

  for (const rule of CAPABILITY_RULES) {
    if (rule.pattern.test(description) && !seenLabels.has(rule.label)) {
      seenLabels.add(rule.label)
      matched.push({ icon: rule.icon, label: rule.label, detail: rule.detail })
    }
  }

  // Merge: baseline first, then matched (skip if baseline already covers the label)
  const result: DetectedCapability[] = []
  const usedLabels = new Set<string>()

  for (const cap of BASELINE_CAPABILITIES) {
    // If a matched capability overlaps with a baseline label like "API", prefer the matched one
    const override = matched.find(m => m.label === 'API' && cap.label === 'API Endpoint')
    if (override) {
      result.push(override)
    } else {
      result.push(cap)
    }
    usedLabels.add(cap.label)
  }

  for (const cap of matched) {
    if (!usedLabels.has(cap.label)) {
      result.push(cap)
    }
  }

  return result
}
