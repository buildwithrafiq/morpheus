import type { MarketplaceListing } from '@/services/marketplace.service'

/**
 * Pre-built marketplace agent templates.
 * These are ready-made agents users can fork and customize.
 * Dates are pinned to the competition window (May 2026).
 */
export const MARKETPLACE_TEMPLATES: MarketplaceListing[] = [
  {
    agentId: 'mkt-customer-support',
    name: 'Customer Support Bot',
    description:
      'Handles common support tickets with empathetic, on-brand responses. Escalates complex issues to humans. Supports FAQ lookup, order status, and refund workflows.',
    category: 'Customer Service',
    usageCount: 3_842,
    authorId: 'community',
    authorName: 'Morpheus Team',
    publishedAt: '2026-05-12T10:00:00Z',
    tags: ['support', 'customer', 'faq', 'tickets'],
  },
  {
    agentId: 'mkt-sql-analyst',
    name: 'SQL Data Analyst',
    description:
      'Translates natural language questions into SQL queries, runs them against your schema, and returns formatted results with charts. Supports PostgreSQL and MySQL dialects.',
    category: 'Data & Analytics',
    usageCount: 2_715,
    authorId: 'community',
    authorName: 'DataCraft',
    publishedAt: '2026-05-15T14:30:00Z',
    tags: ['sql', 'data', 'analytics', 'database'],
  },
  {
    agentId: 'mkt-content-writer',
    name: 'Blog & SEO Writer',
    description:
      'Generates long-form blog posts optimized for SEO. Takes a topic and target keywords, produces structured articles with headings, meta descriptions, and internal link suggestions.',
    category: 'Content',
    usageCount: 5_120,
    authorId: 'community',
    authorName: 'ContentLab',
    publishedAt: '2026-05-10T09:00:00Z',
    tags: ['writing', 'seo', 'blog', 'content'],
  },
  {
    agentId: 'mkt-code-reviewer',
    name: 'PR Review Assistant',
    description:
      'Reviews pull requests for bugs, security vulnerabilities, and style issues. Provides inline suggestions with severity levels and fix recommendations.',
    category: 'Developer Tools',
    usageCount: 4_203,
    authorId: 'community',
    authorName: 'DevToolkit',
    publishedAt: '2026-05-08T11:00:00Z',
    tags: ['code-review', 'security', 'developer', 'github'],
  },
  {
    agentId: 'mkt-email-drafter',
    name: 'Professional Email Drafter',
    description:
      'Composes professional emails from bullet points or rough notes. Adjusts tone for cold outreach, follow-ups, internal comms, or executive summaries.',
    category: 'Productivity',
    usageCount: 6_891,
    authorId: 'community',
    authorName: 'Morpheus Team',
    publishedAt: '2026-05-18T08:00:00Z',
    tags: ['email', 'writing', 'productivity', 'communication'],
  },
  {
    agentId: 'mkt-api-doc-gen',
    name: 'API Documentation Generator',
    description:
      'Generates OpenAPI specs and human-readable docs from code. Supports Express, FastAPI, and Spring Boot. Outputs Markdown or interactive HTML.',
    category: 'Developer Tools',
    usageCount: 1_987,
    authorId: 'community',
    authorName: 'DevToolkit',
    publishedAt: '2026-05-20T16:00:00Z',
    tags: ['api', 'documentation', 'openapi', 'developer'],
  },
  {
    agentId: 'mkt-legal-summarizer',
    name: 'Legal Document Summarizer',
    description:
      'Summarizes contracts, terms of service, and legal documents into plain language. Highlights key obligations, risks, and deadlines.',
    category: 'Business',
    usageCount: 2_340,
    authorId: 'community',
    authorName: 'LegalAI',
    publishedAt: '2026-05-22T12:00:00Z',
    tags: ['legal', 'contracts', 'summary', 'compliance'],
  },
  {
    agentId: 'mkt-image-alt-text',
    name: 'Image Alt-Text Generator',
    description:
      'Generates descriptive, accessible alt-text for images using Gemini vision. Supports batch processing and WCAG-friendly output for web accessibility.',
    category: 'Accessibility',
    usageCount: 1_456,
    authorId: 'community',
    authorName: 'A11yTools',
    publishedAt: '2026-05-25T10:30:00Z',
    tags: ['accessibility', 'images', 'alt-text', 'a11y'],
  },
  {
    agentId: 'mkt-meeting-summarizer',
    name: 'Meeting Notes & Action Items',
    description:
      'Turns meeting transcripts into structured summaries with decisions, action items, owners, and deadlines. Exports to Notion, Slack, or Markdown.',
    category: 'Productivity',
    usageCount: 3_567,
    authorId: 'community',
    authorName: 'Morpheus Team',
    publishedAt: '2026-05-14T13:00:00Z',
    tags: ['meetings', 'notes', 'action-items', 'productivity'],
  },
  {
    agentId: 'mkt-sentiment-analyzer',
    name: 'Review Sentiment Analyzer',
    description:
      'Analyzes customer reviews and feedback at scale. Returns sentiment scores, topic extraction, and trend analysis with exportable dashboards.',
    category: 'Data & Analytics',
    usageCount: 1_823,
    authorId: 'community',
    authorName: 'DataCraft',
    publishedAt: '2026-05-19T15:00:00Z',
    tags: ['sentiment', 'reviews', 'analytics', 'nlp'],
  },
  {
    agentId: 'mkt-onboarding-guide',
    name: 'Employee Onboarding Guide',
    description:
      'Interactive onboarding assistant that walks new hires through company policies, tool setup, and team introductions. Customizable per department.',
    category: 'HR & People',
    usageCount: 978,
    authorId: 'community',
    authorName: 'PeopleOps',
    publishedAt: '2026-05-28T09:00:00Z',
    tags: ['onboarding', 'hr', 'training', 'employees'],
  },
  {
    agentId: 'mkt-changelog-writer',
    name: 'Changelog & Release Notes',
    description:
      'Generates user-friendly changelogs from git commits and PR descriptions. Groups by feature, fix, and breaking change. Outputs Markdown or HTML.',
    category: 'Developer Tools',
    usageCount: 2_104,
    authorId: 'community',
    authorName: 'DevToolkit',
    publishedAt: '2026-05-26T11:00:00Z',
    tags: ['changelog', 'releases', 'git', 'developer'],
  },

  // ── Education ─────────────────────────────────────────────
  {
    agentId: 'mkt-concept-explainer',
    name: 'Concept Explainer (ELI5 → Expert)',
    description:
      'Explains any technical concept at a chosen depth — from "explain like I\'m 5" to PhD-level detail. Includes analogies, diagrams-as-text, and quiz questions.',
    category: 'Education',
    usageCount: 4_312,
    authorId: 'community',
    authorName: 'Morpheus Team',
    publishedAt: '2026-05-09T10:00:00Z',
    tags: ['education', 'explainer', 'learning', 'eli5'],
  },
  {
    agentId: 'mkt-quiz-generator',
    name: 'Quiz & Flashcard Generator',
    description:
      'Creates multiple-choice quizzes, true/false questions, and Anki-compatible flashcards from any topic or study material you paste in.',
    category: 'Education',
    usageCount: 1_890,
    authorId: 'community',
    authorName: 'StudyBuddy',
    publishedAt: '2026-05-21T09:00:00Z',
    tags: ['quiz', 'flashcards', 'study', 'anki'],
  },

  // ── Design & Creative ────────────────────────────────────
  {
    agentId: 'mkt-color-palette',
    name: 'Color Palette Generator',
    description:
      'Generates accessible color palettes from a brand description or mood keywords. Returns hex codes, contrast ratios, and WCAG compliance notes for each pair.',
    category: 'Design',
    usageCount: 2_567,
    authorId: 'community',
    authorName: 'DesignLab',
    publishedAt: '2026-05-16T10:00:00Z',
    tags: ['color', 'palette', 'design', 'branding'],
  },
  {
    agentId: 'mkt-ux-copy-reviewer',
    name: 'UX Copy Reviewer',
    description:
      'Reviews UI text for clarity, consistency, and tone. Flags jargon, passive voice, and inconsistent terminology with suggested rewrites.',
    category: 'Design',
    usageCount: 1_345,
    authorId: 'community',
    authorName: 'DesignLab',
    publishedAt: '2026-05-23T14:00:00Z',
    tags: ['ux', 'copywriting', 'ui-text', 'microcopy'],
  },

  // ── DevOps & Infrastructure ──────────────────────────────
  {
    agentId: 'mkt-dockerfile-gen',
    name: 'Dockerfile Generator',
    description:
      'Generates production-ready, multi-stage Dockerfiles from a project description. Includes security best practices, layer caching, and image size optimization.',
    category: 'DevOps',
    usageCount: 2_478,
    authorId: 'community',
    authorName: 'InfraKit',
    publishedAt: '2026-05-11T08:00:00Z',
    tags: ['docker', 'containers', 'devops', 'deployment'],
  },
  {
    agentId: 'mkt-incident-runbook',
    name: 'Incident Response Playbook',
    description:
      'Given an incident description (e.g. "API latency spike"), generates a step-by-step runbook with diagnostic commands, escalation paths, and post-mortem template.',
    category: 'DevOps',
    usageCount: 1_102,
    authorId: 'community',
    authorName: 'InfraKit',
    publishedAt: '2026-05-27T16:00:00Z',
    tags: ['incident', 'runbook', 'sre', 'on-call'],
  },

  // ── Sales & Marketing ────────────────────────────────────
  {
    agentId: 'mkt-cold-outreach',
    name: 'Cold Outreach Sequence Builder',
    description:
      'Generates multi-step cold email sequences personalized to prospect data. Includes subject lines, follow-up timing, and A/B test variants.',
    category: 'Sales',
    usageCount: 3_210,
    authorId: 'community',
    authorName: 'GrowthHQ',
    publishedAt: '2026-05-13T11:00:00Z',
    tags: ['sales', 'outreach', 'email', 'sequences'],
  },
  {
    agentId: 'mkt-social-repurposer',
    name: 'Content Repurposer for Social',
    description:
      'Takes a long-form article and generates platform-specific posts for Twitter/X, LinkedIn, and Instagram with appropriate tone, length, and hashtags.',
    category: 'Content',
    usageCount: 2_890,
    authorId: 'community',
    authorName: 'ContentLab',
    publishedAt: '2026-05-24T15:00:00Z',
    tags: ['social-media', 'repurpose', 'marketing', 'linkedin'],
  },

  // ── Finance & Ops ────────────────────────────────────────
  {
    agentId: 'mkt-invoice-parser',
    name: 'Invoice & Receipt Parser',
    description:
      'Extracts line items, totals, tax, and vendor info from invoice images or PDFs using Gemini vision. Outputs structured JSON for accounting integrations.',
    category: 'Finance',
    usageCount: 1_678,
    authorId: 'community',
    authorName: 'FinOps',
    publishedAt: '2026-05-17T12:00:00Z',
    tags: ['invoice', 'receipts', 'ocr', 'accounting'],
  },
  {
    agentId: 'mkt-expense-categorizer',
    name: 'Expense Categorizer',
    description:
      'Automatically categorizes bank transactions and expenses into budget categories. Learns from corrections and exports to CSV or accounting software formats.',
    category: 'Finance',
    usageCount: 1_234,
    authorId: 'community',
    authorName: 'FinOps',
    publishedAt: '2026-05-29T10:00:00Z',
    tags: ['expenses', 'budget', 'categorization', 'finance'],
  },

  // ── Research & Knowledge ─────────────────────────────────
  {
    agentId: 'mkt-research-summarizer',
    name: 'Research Paper Summarizer',
    description:
      'Summarizes academic papers into structured briefs with key findings, methodology, limitations, and relevance scores. Supports arXiv links and PDF uploads.',
    category: 'Research',
    usageCount: 2_156,
    authorId: 'community',
    authorName: 'ScholarAI',
    publishedAt: '2026-05-07T09:00:00Z',
    tags: ['research', 'papers', 'academic', 'summary'],
  },
  {
    agentId: 'mkt-competitor-brief',
    name: 'Competitive Intelligence Brief',
    description:
      'Analyzes competitor descriptions and produces a SWOT matrix, feature comparison table, and strategic positioning recommendations.',
    category: 'Business',
    usageCount: 1_567,
    authorId: 'community',
    authorName: 'StrategyBot',
    publishedAt: '2026-05-19T14:00:00Z',
    tags: ['competitive', 'swot', 'strategy', 'market-research'],
  },

  // ── Translation & Localization ───────────────────────────
  {
    agentId: 'mkt-translator',
    name: 'Context-Aware Translator',
    description:
      'Translates text between 40+ languages while preserving tone, idioms, and domain-specific terminology. Supports glossary uploads for brand consistency.',
    category: 'Content',
    usageCount: 3_456,
    authorId: 'community',
    authorName: 'LinguaAI',
    publishedAt: '2026-05-06T08:00:00Z',
    tags: ['translation', 'localization', 'multilingual', 'i18n'],
  },

  // ── Security ─────────────────────────────────────────────
  {
    agentId: 'mkt-security-scanner',
    name: 'Dependency Security Scanner',
    description:
      'Scans package.json, requirements.txt, or Gemfile for known vulnerabilities. Returns severity ratings, CVE links, and upgrade recommendations.',
    category: 'Developer Tools',
    usageCount: 1_890,
    authorId: 'community',
    authorName: 'SecureStack',
    publishedAt: '2026-05-05T11:00:00Z',
    tags: ['security', 'dependencies', 'vulnerabilities', 'cve'],
  },

  // ── Multimodal (Gemini showcase) ─────────────────────────
  {
    agentId: 'mkt-diagram-to-code',
    name: 'Diagram-to-Code Converter',
    description:
      'Upload a whiteboard photo or architecture diagram and get working code scaffolds. Uses Gemini vision to interpret boxes, arrows, and labels into project structure.',
    category: 'Developer Tools',
    usageCount: 3_780,
    authorId: 'community',
    authorName: 'Morpheus Team',
    publishedAt: '2026-05-04T10:00:00Z',
    tags: ['vision', 'diagrams', 'code-gen', 'multimodal'],
  },
  {
    agentId: 'mkt-video-summarizer',
    name: 'Video Lecture Summarizer',
    description:
      'Processes video transcripts (or YouTube links) and produces timestamped summaries, key takeaways, and study notes. Great for lecture recordings and webinars.',
    category: 'Education',
    usageCount: 2_034,
    authorId: 'community',
    authorName: 'StudyBuddy',
    publishedAt: '2026-05-30T09:00:00Z',
    tags: ['video', 'lectures', 'summary', 'youtube'],
  },

  // ── Startup & Product ────────────────────────────────────
  {
    agentId: 'mkt-pitch-analyzer',
    name: 'Startup Pitch Analyzer',
    description:
      'Scores pitch decks on market fit, team strength, financials, and traction. Returns structured feedback with strengths, weaknesses, and actionable next steps.',
    category: 'Business',
    usageCount: 2_841,
    authorId: 'community',
    authorName: 'Morpheus Team',
    publishedAt: '2026-05-08T10:00:00Z',
    tags: ['pitch', 'startup', 'vc', 'analysis'],
  },
  {
    agentId: 'mkt-user-story-writer',
    name: 'User Story & Acceptance Criteria Writer',
    description:
      'Converts feature descriptions into well-formatted user stories with acceptance criteria, edge cases, and story point estimates. Outputs Jira-ready format.',
    category: 'Productivity',
    usageCount: 2_456,
    authorId: 'community',
    authorName: 'AgileBot',
    publishedAt: '2026-05-20T08:00:00Z',
    tags: ['user-stories', 'agile', 'jira', 'product'],
  },

  // ── Regex & Utilities ────────────────────────────────────
  {
    agentId: 'mkt-regex-builder',
    name: 'Regex Pattern Builder',
    description:
      'Converts plain-English descriptions into tested regex patterns. Returns the pattern, explanation of each part, and sample matches/non-matches.',
    category: 'Developer Tools',
    usageCount: 3_120,
    authorId: 'community',
    authorName: 'DevToolkit',
    publishedAt: '2026-05-15T11:00:00Z',
    tags: ['regex', 'patterns', 'validation', 'parsing'],
  },
  {
    agentId: 'mkt-cron-explainer',
    name: 'Cron Expression Builder',
    description:
      'Generates and explains cron expressions from natural language like "every weekday at 9am EST". Shows next 5 run times and validates syntax.',
    category: 'Developer Tools',
    usageCount: 1_567,
    authorId: 'community',
    authorName: 'DevToolkit',
    publishedAt: '2026-05-22T16:00:00Z',
    tags: ['cron', 'scheduling', 'devops', 'automation'],
  },
]
