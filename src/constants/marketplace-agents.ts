import type { MarketplaceListing } from '@/services/marketplace.service'

/**
 * Pre-seeded marketplace listings showcasing ready-made Gemini-powered agents.
 * These appear on /marketplace so users can fork and customize them.
 */
export const MARKETPLACE_SEED: MarketplaceListing[] = [
  // ── Business ──────────────────────────────────────────────
  {
    agentId: 'mp-pitch-analyzer',
    name: 'Startup Pitch Analyzer',
    description:
      'Scores pitch decks on market fit, team strength, financials, and traction. Returns structured feedback with strengths, weaknesses, and actionable recommendations.',
    category: 'Business',
    usageCount: 2_841,
    authorId: 'community',
    authorName: 'Morpheus Team',
    publishedAt: '2026-01-15T10:00:00Z',
    tags: ['pitch', 'startup', 'vc', 'analysis'],
  },
  {
    agentId: 'mp-proposal-writer',
    name: 'Proposal & SOW Generator',
    description:
      'Generates professional project proposals and statements of work from a brief description. Includes scope, timeline, milestones, and pricing sections.',
    category: 'Business',
    usageCount: 1_573,
    authorId: 'community',
    authorName: 'Ava Chen',
    publishedAt: '2026-02-01T08:30:00Z',
    tags: ['proposal', 'sow', 'freelance', 'consulting'],
  },
  {
    agentId: 'mp-competitor-intel',
    name: 'Competitive Intelligence Brief',
    description:
      'Analyzes competitor descriptions and produces a structured SWOT matrix, feature comparison table, and strategic positioning recommendations.',
    category: 'Business',
    usageCount: 987,
    authorId: 'community',
    authorName: 'Marcus Lee',
    publishedAt: '2026-01-28T14:00:00Z',
    tags: ['competitive', 'swot', 'strategy', 'market-research'],
  },

  // ── Developer Tools ───────────────────────────────────────
  {
    agentId: 'mp-code-reviewer',
    name: 'Code Review Assistant',
    description:
      'Reviews code for bugs, security vulnerabilities, performance issues, and style violations. Returns severity-ranked issues with line-level suggestions.',
    category: 'Developer Tools',
    usageCount: 4_210,
    authorId: 'community',
    authorName: 'Morpheus Team',
    publishedAt: '2026-01-10T12:00:00Z',
    tags: ['code-review', 'security', 'bugs', 'linting'],
  },
  {
    agentId: 'mp-api-doc-gen',
    name: 'API Documentation Generator',
    description:
      'Generates OpenAPI-style documentation from source code or endpoint descriptions. Produces markdown with request/response examples and error codes.',
    category: 'Developer Tools',
    usageCount: 2_156,
    authorId: 'community',
    authorName: 'Priya Sharma',
    publishedAt: '2026-01-20T09:00:00Z',
    tags: ['api', 'documentation', 'openapi', 'swagger'],
  },
  {
    agentId: 'mp-regex-builder',
    name: 'Regex Pattern Builder',
    description:
      'Converts plain-English descriptions into tested regex patterns. Returns the pattern, explanation of each part, and sample matches/non-matches.',
    category: 'Developer Tools',
    usageCount: 3_489,
    authorId: 'community',
    authorName: 'Jake Torres',
    publishedAt: '2026-02-05T11:00:00Z',
    tags: ['regex', 'patterns', 'validation', 'parsing'],
  },
  {
    agentId: 'mp-sql-optimizer',
    name: 'SQL Query Optimizer',
    description:
      'Analyzes SQL queries and suggests index strategies, rewrites for performance, and explains execution plan improvements. Supports PostgreSQL and MySQL dialects.',
    category: 'Developer Tools',
    usageCount: 1_834,
    authorId: 'community',
    authorName: 'Lena Kowalski',
    publishedAt: '2026-01-25T16:00:00Z',
    tags: ['sql', 'database', 'performance', 'optimization'],
  },

  // ── Productivity ──────────────────────────────────────────
  {
    agentId: 'mp-meeting-summarizer',
    name: 'Meeting Notes Summarizer',
    description:
      'Turns messy meeting transcripts into structured summaries with action items, decisions, owners, deadlines, and follow-up topics.',
    category: 'Productivity',
    usageCount: 3_672,
    authorId: 'community',
    authorName: 'Morpheus Team',
    publishedAt: '2026-01-12T09:00:00Z',
    tags: ['meetings', 'notes', 'action-items', 'summary'],
  },
  {
    agentId: 'mp-email-drafter',
    name: 'Professional Email Drafter',
    description:
      'Composes polished professional emails from bullet-point notes. Adjusts tone from casual to formal, handles follow-ups, and suggests subject lines.',
    category: 'Productivity',
    usageCount: 2_945,
    authorId: 'community',
    authorName: 'Sofia Reyes',
    publishedAt: '2026-01-18T13:00:00Z',
    tags: ['email', 'writing', 'communication', 'professional'],
  },
  {
    agentId: 'mp-changelog-writer',
    name: 'Changelog & Release Notes Writer',
    description:
      'Generates user-friendly changelogs from git commit messages or bullet points. Groups by feature, fix, and breaking change with semantic versioning suggestions.',
    category: 'Productivity',
    usageCount: 1_287,
    authorId: 'community',
    authorName: 'Noah Kim',
    publishedAt: '2026-02-03T10:00:00Z',
    tags: ['changelog', 'release-notes', 'git', 'versioning'],
  },

  // ── Content & Writing ─────────────────────────────────────
  {
    agentId: 'mp-blog-outliner',
    name: 'Blog Post Outliner & Drafter',
    description:
      'Creates SEO-aware blog post outlines with headings, key points, and a full first draft. Supports technical, marketing, and thought-leadership styles.',
    category: 'Content',
    usageCount: 2_103,
    authorId: 'community',
    authorName: 'Emma Nguyen',
    publishedAt: '2026-01-22T08:00:00Z',
    tags: ['blog', 'seo', 'writing', 'content-marketing'],
  },
  {
    agentId: 'mp-social-repurposer',
    name: 'Content Repurposer for Social',
    description:
      'Takes a long-form article or blog post and generates platform-specific social media posts for Twitter/X, LinkedIn, and Instagram with appropriate tone and length.',
    category: 'Content',
    usageCount: 1_756,
    authorId: 'community',
    authorName: 'Dani Okafor',
    publishedAt: '2026-02-07T15:00:00Z',
    tags: ['social-media', 'repurpose', 'marketing', 'twitter'],
  },

  // ── Data & Analytics ──────────────────────────────────────
  {
    agentId: 'mp-csv-analyst',
    name: 'CSV Data Analyst',
    description:
      'Accepts CSV data and a natural-language question, then returns statistical summaries, trend analysis, and plain-English insights. Great for quick data exploration.',
    category: 'Data',
    usageCount: 2_534,
    authorId: 'community',
    authorName: 'Raj Patel',
    publishedAt: '2026-01-30T11:00:00Z',
    tags: ['csv', 'data-analysis', 'statistics', 'insights'],
  },
  {
    agentId: 'mp-json-transformer',
    name: 'JSON Schema Transformer',
    description:
      'Converts between JSON schemas, generates TypeScript interfaces, and maps data from one shape to another using natural-language transformation rules.',
    category: 'Data',
    usageCount: 1_423,
    authorId: 'community',
    authorName: 'Lena Kowalski',
    publishedAt: '2026-02-04T14:00:00Z',
    tags: ['json', 'schema', 'typescript', 'data-mapping'],
  },

  // ── Education ─────────────────────────────────────────────
  {
    agentId: 'mp-concept-explainer',
    name: 'Concept Explainer (ELI5 → Expert)',
    description:
      'Explains any technical concept at your chosen level — from "explain like I\'m 5" to PhD-level detail. Includes analogies, diagrams-as-text, and quiz questions.',
    category: 'Education',
    usageCount: 3_891,
    authorId: 'community',
    authorName: 'Morpheus Team',
    publishedAt: '2026-01-08T10:00:00Z',
    tags: ['education', 'explainer', 'learning', 'eli5'],
  },
  {
    agentId: 'mp-quiz-generator',
    name: 'Quiz & Flashcard Generator',
    description:
      'Generates multiple-choice quizzes, true/false questions, and Anki-compatible flashcards from any topic or study material you provide.',
    category: 'Education',
    usageCount: 1_645,
    authorId: 'community',
    authorName: 'Tara Singh',
    publishedAt: '2026-02-06T09:00:00Z',
    tags: ['quiz', 'flashcards', 'study', 'anki'],
  },

  // ── Design & UX ───────────────────────────────────────────
  {
    agentId: 'mp-ux-copy-reviewer',
    name: 'UX Copy Reviewer',
    description:
      'Reviews UI text for clarity, consistency, accessibility, and tone. Flags jargon, passive voice, and inconsistent terminology with suggested rewrites.',
    category: 'Design',
    usageCount: 1_102,
    authorId: 'community',
    authorName: 'Mia Zhang',
    publishedAt: '2026-02-02T12:00:00Z',
    tags: ['ux', 'copywriting', 'accessibility', 'ui-text'],
  },
  {
    agentId: 'mp-color-palette',
    name: 'Color Palette Generator',
    description:
      'Generates accessible color palettes from a brand description or mood keywords. Returns hex codes, contrast ratios, and WCAG compliance notes.',
    category: 'Design',
    usageCount: 2_267,
    authorId: 'community',
    authorName: 'Carlos Ruiz',
    publishedAt: '2026-01-16T10:00:00Z',
    tags: ['color', 'palette', 'design', 'accessibility'],
  },

  // ── DevOps & Infrastructure ───────────────────────────────
  {
    agentId: 'mp-dockerfile-gen',
    name: 'Dockerfile Generator',
    description:
      'Generates production-ready, multi-stage Dockerfiles from a project description. Includes security best practices, layer caching, and size optimization.',
    category: 'DevOps',
    usageCount: 1_978,
    authorId: 'community',
    authorName: 'Alex Petrov',
    publishedAt: '2026-01-24T08:00:00Z',
    tags: ['docker', 'containers', 'devops', 'deployment'],
  },
  {
    agentId: 'mp-incident-responder',
    name: 'Incident Response Playbook',
    description:
      'Given an incident description (e.g. "API latency spike"), generates a step-by-step runbook with diagnostic commands, escalation paths, and post-mortem template.',
    category: 'DevOps',
    usageCount: 892,
    authorId: 'community',
    authorName: 'Jordan Blake',
    publishedAt: '2026-02-08T16:00:00Z',
    tags: ['incident', 'runbook', 'sre', 'on-call'],
  },
]
