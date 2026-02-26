# 🏗️ RepoPilot AI - Technical Architecture

## System Overview

RepoPilot AI is a stateless, real-time GitHub intelligence system built with a clean separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  React 19 + Vite + Plain CSS                                │
│  - Maintainer Command Center                                │
│  - Contributor Assistant Panel                              │
│  - Real-time UI updates                                     │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/REST
                     │
┌────────────────────▼────────────────────────────────────────┐
│                    Backend API                               │
│  Node.js + Express                                          │
│  - /api/analyze/:owner/:repo (GET)                          │
│  - /api/review-code (POST)                                  │
└────────────┬───────────────────┬────────────────────────────┘
             │                   │
    ┌────────▼────────┐  ┌──────▼──────────┐
    │  GitHub Service │  │   AI Service    │
    │  - API calls    │  │  - PR analysis  │
    │  - Rate limits  │  │  - Issue triage │
    │  - Mock fallback│  │  - Health score │
    └─────────────────┘  └─────────────────┘
```

---

## Frontend Architecture

### Component Structure

```
App.jsx (822 lines)
├── Header
│   ├── Brand
│   ├── Search Form
│   └── View Toggle (Maintainer/Contributor)
├── Landing Page (no data state)
│   ├── Hero Section
│   ├── Feature Cards
│   └── Demo Repo Chips
├── Loading Screen (fetching state)
│   ├── Animated Orb
│   └── Progress Steps
└── Dashboard (data loaded)
    ├── Overview Panel
    │   ├── Repo Stats
    │   └── Mock Data Banner
    ├── Sidebar Navigation
    │   ├── Maintainer Sections
    │   └── Contributor Sections
    └── Content Area
        ├── Maintainer Panels
        │   ├── PR Control Dashboard
        │   ├── Priority Queue
        │   ├── Issue Analyzer
        │   ├── Ping Monitor
        │   └── Health Dashboard
        └── Contributor Panels
            ├── My PR Status
            ├── Conflict Helper
            ├── Recommended Issues
            └── AI Pre-Review
```

### State Management

**Single Component State (useState)**
- `repoUrl`: Current input value
- `loading`: Fetch in progress
- `error`: Error message string
- `data`: Complete analysis result
- `view`: 'maintainer' | 'contributor'
- `activeSection`: Current panel per view

**Why no Redux/Context?**
- Single source of truth (API response)
- No complex state mutations
- Simpler debugging
- Faster development

### Styling Strategy

**Plain CSS with CSS Variables**
```css
:root {
  --bg: #0a0e1a;
  --surface: #141824;
  --primary: #3b82f6;
  --danger: #ef4444;
  /* ... */
}
```

**Benefits:**
- No build-time CSS processing
- Easy theme customization
- Better performance (no runtime CSS-in-JS)
- Hackathon-friendly (no learning curve)

**Design System:**
- Dark mode optimized
- Color-coded priorities (red/yellow/green)
- Consistent spacing (4px grid)
- Smooth transitions (0.2s)
- Responsive breakpoints (1024px, 768px)

---

## Backend Architecture

### API Endpoints

#### GET /api/analyze/:owner/:repo
**Purpose:** Fetch and analyze complete repository data

**Flow:**
1. Extract owner/repo from URL params
2. Call `getRepoData(owner, repo)` from GitHub service
3. Run parallel AI analysis:
   - `analyzePRs()` - PR risk scoring
   - `generateRoadmap()` - Issue categorization
   - `analyzeIssues()` - Stale/noise detection
   - `identifyGoodFirstIssues()` - Contributor guidance
   - `calculateHealthScore()` - Project metrics
   - `analyzePingNoise()` - Maintainer protection
4. Generate contributor PR status (first PR as example)
5. Return unified JSON response

**Response Schema:**
```javascript
{
  overview: {
    name: string,
    stars: number,
    forks: number,
    openPrs: number,
    openIssues: number,
    description: string,
    language: string
  },
  healthScore: {
    score: number,        // 0-100
    status: string,       // Healthy/Moderate/Critical
    burnoutRisk: boolean,
    breakdown: {
      avgPrDelay: number,
      conflictRatio: number,
      staleRatio: number,
      openPrCount: number,
      recentCommits: number
    }
  },
  prReviews: Array<{
    id: number,
    number: number,
    title: string,
    author: string,
    daysOpen: number,
    hasConflict: boolean,
    riskLevel: 'High'|'Medium'|'Low',
    priorityScore: number,
    priorityLabel: string,
    summary: string,
    categories: {
      codeImprovements: string[],
      styleImprovements: string[],
      securityRisks: string[]
    }
  }>,
  roadmap: {
    shortTerm: Issue[],
    midTerm: Issue[],
    longTerm: Issue[]
  },
  issueMetrics: {
    stale: Issue[],
    highNoise: Issue[],
    staleCount: number,
    highNoiseCount: number
  },
  goodFirstIssues: Issue[],
  pingMonitor: {
    mostPinged: PR[],
    highNoiseIssues: Issue[]
  },
  myPrStatus: {
    state: string,
    explanation: string,
    nextAction: string,
    conflictInfo: ConflictInfo
  },
  isMock: boolean,
  rateLimited: boolean
}
```

#### POST /api/review-code
**Purpose:** Pre-submission code review

**Request Body:**
```javascript
{
  code: string  // Code snippet to analyze
}
```

**Response:**
```javascript
{
  improvements: string[],
  commitMessage: string,
  score: number,  // 0-100
  lines: number
}
```

---

## GitHub Service

### Data Fetching Strategy

**Parallel Requests:**
```javascript
const [overview, prs, issues, commits, contributors] = await Promise.all([
  axios.get(`/repos/${owner}/${repo}`),
  axios.get(`/repos/${owner}/${repo}/pulls?state=open`),
  axios.get(`/search/issues?q=repo:${owner}/${repo} is:issue`),
  axios.get(`/repos/${owner}/${repo}/commits`),
  axios.get(`/repos/${owner}/${repo}/contributors`)
]);
```

**PR Diff Fetching:**
- Top 5 PRs get full diff content
- Uses `Accept: application/vnd.github.v3.diff` header
- Remaining PRs use body text as fallback

**Rate Limit Handling:**
```javascript
try {
  // Fetch real data
} catch (error) {
  if (error.response.status === 403) {
    return mockData + { rateLimited: true };
  }
  if (error.response.status === 404) {
    return mockData + { isMock: true };
  }
}
```

### Mock Data Design

**Realistic Scenarios:**
- 2 PRs (one with conflict, one clean)
- 3 issues (bug, feature, architecture)
- Mixed staleness (10d, 40d, 60d old)
- Varied comment counts (1, 5, 12)
- Good first issue labels

**Why Mock Data?**
- Demo reliability (no API dependency)
- Showcase all features (even if real repo is clean)
- Rate limit protection (60 req/hr unauthenticated)

---

## AI Service

### PR Analysis Algorithm

**Risk Level Determination:**
```javascript
function determineRiskLevel(pr, diff) {
  // Critical patterns
  if (diff.includes('eval(') || diff.includes('innerHTML'))
    return 'High';
  
  // Size-based risk
  const totalChanges = pr.additions + pr.deletions;
  if (totalChanges > 500 || diff.includes('null'))
    return 'Medium';
  
  return 'Low';
}
```

**Priority Scoring (0-100):**
```javascript
Base: 50
+ High Risk: +30
+ Medium Risk: +12
+ Conflict: +20
+ Age >21d: +25
+ Age >14d: +18
+ Age >7d: +8
+ Size <60: +12
- Size >800: -8
```

**Categories:**
- Code Improvements: null checks, console.log, TODO
- Style: var vs const, == vs ===, indentation
- Security: eval(), innerHTML, SQL injection

### Issue Classification

**Roadmap Generation:**
```javascript
Keywords:
- Short-term: bug, fix, urgent, crash, security, hotfix
- Mid-term: feature, enhancement, add, improve, support
- Long-term: architecture, epic, refactor, migration
```

**Good First Issue Detection:**
```javascript
Criteria:
1. Has label: "good first issue", "documentation", "help wanted"
2. OR: Low comments (<5) + reasonable body length (10-2500 chars)

Difficulty:
- Easy: documentation, typo, CSS, color, simple
- Hard: architecture, database, migration, performance
- Medium: everything else
```

### Health Score Calculation

**Formula:**
```javascript
Base: 100

Deductions:
- avgPrDelay >21d: -25
- avgPrDelay >14d: -15
- avgPrDelay >7d: -8
- conflictRatio >30%: -20
- conflictRatio >10%: -10
- staleRatio >50%: -25
- staleRatio >20%: -12
- openPrs >50: -20
- openPrs >20: -10
- openPrs >10: -5

Bonuses:
- recentCommits >10: +5

Final: Math.max(0, Math.min(100, score))
```

**Status Mapping:**
- 80-100: Healthy
- 50-79: Moderate Risk
- 0-49: Critical

**Burnout Risk:**
```javascript
avgPrDelay > 14 || openPrs > 30 || staleRatio > 0.4
```

---

## Data Flow

### Typical Request Flow

```
1. User enters: https://github.com/facebook/react
2. Frontend extracts: owner=facebook, repo=react
3. POST to: /api/analyze/facebook/react
4. Backend fetches from GitHub:
   - Repository metadata
   - Open PRs (with diffs for top 5)
   - Open issues (excluding PRs)
   - Recent commits
   - Top contributors
5. AI service processes:
   - Analyze each PR (2-3ms each)
   - Categorize issues (5-10ms)
   - Calculate health score (1ms)
   - Generate roadmap (2ms)
6. Backend returns unified JSON (~50-200KB)
7. Frontend renders dashboard
8. User toggles between views (instant, no API call)
```

**Performance:**
- GitHub API: 2-5 seconds
- AI processing: <100ms
- Total: 2-5 seconds

---

## Security Considerations

### API Token Handling
- Stored in `.env` file (not committed)
- Passed via Authorization header
- Optional (falls back to unauthenticated)

### Input Validation
```javascript
// URL parsing
const extractOwnerRepo = (url) => {
  if (!url.includes('github.com')) return null;
  const parts = url.split('github.com/')[1].split('/');
  if (parts.length >= 2) return { owner, repo };
  return null;
};

// Code review input
if (typeof code !== 'string') {
  return res.status(400).json({ error: 'Invalid input' });
}
```

### CORS Configuration
```javascript
app.use(cors());  // Allow all origins (hackathon mode)
// Production: app.use(cors({ origin: 'https://repopilot.ai' }))
```

---

## Scalability

### Current Limitations
- Stateless (no caching)
- Single-threaded Node.js
- GitHub API rate limits (5000 req/hr authenticated)

### Production Improvements

**Caching Layer:**
```javascript
Redis cache:
- Key: `repo:${owner}/${repo}`
- TTL: 5 minutes
- Invalidate on webhook
```

**Queue System:**
```javascript
Bull queue:
- Job: Analyze repository
- Workers: 4 concurrent
- Priority: Based on repo size
```

**Database:**
```javascript
PostgreSQL:
- Store historical health scores
- Track analysis trends
- User preferences
```

**Webhooks:**
```javascript
GitHub webhooks:
- PR opened/closed
- Issue created/updated
- Push events
→ Trigger real-time re-analysis
```

---

## Testing Strategy

### Unit Tests (Future)
```javascript
// ai.js
describe('calculateHealthScore', () => {
  it('returns 100 for perfect repo', () => {
    const data = { pullRequests: [], issues: [], commits: [] };
    expect(calculateHealthScore(data).score).toBe(100);
  });
  
  it('penalizes high PR delay', () => {
    const data = {
      pullRequests: [{ created_at: '2024-01-01' }],
      issues: [],
      commits: []
    };
    expect(calculateHealthScore(data).score).toBeLessThan(80);
  });
});
```

### Integration Tests (Future)
```javascript
// server.test.js
describe('GET /api/analyze/:owner/:repo', () => {
  it('returns analysis for valid repo', async () => {
    const res = await request(app)
      .get('/api/analyze/facebook/react')
      .expect(200);
    
    expect(res.body).toHaveProperty('healthScore');
    expect(res.body).toHaveProperty('prReviews');
  });
  
  it('falls back to mock for invalid repo', async () => {
    const res = await request(app)
      .get('/api/analyze/invalid/repo')
      .expect(200);
    
    expect(res.body.isMock).toBe(true);
  });
});
```

---

## Deployment

### Development
```bash
# Backend
cd backend && npm install && node server.js

# Frontend
cd frontend && npm install && npm run dev
```

### Production (Future)

**Backend (Heroku/Railway):**
```bash
# Procfile
web: node server.js

# Environment
PORT=5001
GITHUB_TOKEN=<token>
NODE_ENV=production
```

**Frontend (Vercel/Netlify):**
```bash
# Build
npm run build

# Environment
VITE_API_URL=https://api.repopilot.ai
```

---

## Tech Stack Justification

### Why React?
- Component reusability (cards, badges, panels)
- Fast development (hooks, no class components)
- Large ecosystem (axios, lucide-react icons)

### Why Plain CSS?
- No build complexity
- Faster load times (no CSS-in-JS runtime)
- Easy customization (CSS variables)
- Hackathon-friendly (no Tailwind learning curve)

### Why Node.js + Express?
- JavaScript everywhere (same language as frontend)
- Fast prototyping (minimal boilerplate)
- Great for I/O-heavy tasks (GitHub API calls)

### Why No Database?
- Stateless = simpler deployment
- Real-time analysis = always fresh data
- No migration headaches
- Faster MVP development

---

## Future Architecture

### Microservices (Scale)
```
┌─────────────┐
│   Frontend  │
└──────┬──────┘
       │
┌──────▼──────────────────────┐
│     API Gateway             │
└──┬────────┬────────┬────────┘
   │        │        │
┌──▼──┐  ┌─▼──┐  ┌─▼────┐
│ PR  │  │Issue│  │Health│
│Svc  │  │ Svc │  │ Svc  │
└─────┘  └─────┘  └──────┘
```

### Event-Driven (Real-time)
```
GitHub Webhook → Queue → Workers → WebSocket → Frontend
```

### ML Integration (Advanced AI)
```
Historical Data → TensorFlow → Predict PR merge time
                              → Suggest reviewers
                              → Auto-label issues
```

---

## Conclusion

RepoPilot AI demonstrates clean architecture principles:
- Separation of concerns (GitHub/AI/UI)
- Stateless design (scalable)
- Graceful degradation (mock fallbacks)
- Performance-first (parallel requests)
- Developer-friendly (simple setup)

Built for hackathons, ready for production. 🚀
