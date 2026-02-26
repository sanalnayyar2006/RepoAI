import React, { useState } from 'react';
import axios from 'axios';
import './App.css';


const API_BASE_URL = 'http://localhost:5001/api';

// ─────────────────────────────────────────────────────────────
// UTILITY
// ─────────────────────────────────────────────────────────────
const timeAgo = (dateStr) => {
  if (!dateStr) return 'Unknown';
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
};

const RiskBadge = ({ level }) => {
  const map = { High: 'badge-high', Medium: 'badge-medium', Low: 'badge-low' };
  return <span className={`badge ${map[level] || 'badge-low'}`}>{level} Risk</span>;
};

const PriorityBadge = ({ label }) => {
  const map = {
    'Review Now': 'badge-high',
    'Needs Rebase': 'badge-medium',
    'Low Priority': 'badge-low',
  };
  return <span className={`badge ${map[label] || 'badge-low'}`}>{label}</span>;
};

const DiffBadge = ({ label }) => {
  const map = { Easy: 'badge-low', Medium: 'badge-medium', Hard: 'badge-high' };
  return <span className={`badge ${map[label] || 'badge-medium'}`}>{label}</span>;
};

const Avatar = ({ src, name, size = 32 }) => (
  src
    ? <img src={src} alt={name} className="avatar" style={{ width: size, height: size }} />
    : <div className="avatar avatar-placeholder" style={{ width: size, height: size }}>
      {(name || '?')[0].toUpperCase()}
    </div>
);

const SectionTitle = ({ icon, children }) => (
  <h2 className="section-title">
    <span className="section-icon">{icon}</span>
    {children}
  </h2>
);

const EmptyState = ({ icon, message }) => (
  <div className="empty-state">
    <span className="empty-icon">{icon}</span>
    <p>{message}</p>
  </div>
);

const CollapsibleCard = ({ header, children, defaultOpen = false, accent }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="item-card" style={accent ? { borderLeft: `4px solid ${accent}` } : {}}>
      <div className="collapsible-header" onClick={() => setOpen(!open)}>
        <div className="collapsible-header-left">{header}</div>
        <span className="chevron">{open ? '▲' : '▼'}</span>
      </div>
      {open && <div className="collapsible-body">{children}</div>}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// MAINTAINER PANELS
// ─────────────────────────────────────────────────────────────

const PRControlPanel = ({ prReviews }) => {
  if (!prReviews || prReviews.length === 0)
    return <EmptyState icon="✅" message="No open PRs — the queue is clear!" />;

  return (
    <div className="item-list">
      {prReviews.map((pr) => {
        const conflictColor = pr.hasConflict ? 'var(--danger)' :
          pr.daysOpen > 14 ? 'var(--warning)' :
            pr.riskLevel === 'High' ? 'var(--danger)' : 'var(--border)';

        return (
          <CollapsibleCard
            key={pr.id}
            accent={conflictColor}
            defaultOpen={pr.priorityScore >= 75}
            header={
              <div className="pr-header">
                <div className="pr-header-row">
                  <Avatar src={pr.authorAvatar} name={pr.author} size={28} />
                  <a href={pr.url} target="_blank" rel="noreferrer" className="item-link">
                    <span className="pr-number">#{pr.number}</span> {pr.title}
                  </a>
                </div>
                <div className="pr-meta-row">
                  <span className="meta-chip">👤 {pr.author}</span>
                  <span className="meta-chip">🕐 {pr.daysOpen}d open</span>
                  <span className="meta-chip">📝 +{pr.additions} −{pr.deletions}</span>
                  {pr.hasConflict && <span className="meta-chip chip-danger">⚡ Conflict</span>}
                  {pr.daysOpen > 14 && !pr.hasConflict && <span className="meta-chip chip-warn">⏳ Stale</span>}
                  <RiskBadge level={pr.riskLevel} />
                  <PriorityBadge label={pr.priorityLabel} />
                </div>
              </div>
            }
          >
            <div className="ai-insight-box">
              <p className="ai-summary-text">{pr.summary}</p>
            </div>
            <div className="review-grid">
              {pr.categories.codeImprovements.length > 0 && (
                <div className="review-section">
                  <div className="review-section-title" style={{ color: 'var(--primary)' }}>🔧 Code Issues</div>
                  <ul className="insight-list">
                    {pr.categories.codeImprovements.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
              {pr.categories.securityRisks.length > 0 && (
                <div className="review-section">
                  <div className="review-section-title" style={{ color: 'var(--danger)' }}>🛡️ Security / Perf</div>
                  <ul className="insight-list">
                    {pr.categories.securityRisks.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
              {pr.categories.styleImprovements.length > 0 && (
                <div className="review-section">
                  <div className="review-section-title" style={{ color: 'var(--secondary)' }}>✨ Style</div>
                  <ul className="insight-list">
                    {pr.categories.styleImprovements.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </CollapsibleCard>
        );
      })}
    </div>
  );
};

const PriorityQueue = ({ prReviews }) => {
  if (!prReviews || prReviews.length === 0)
    return <EmptyState icon="🎉" message="Priority queue is empty." />;

  const groups = {
    'Review Now': prReviews.filter(p => p.priorityLabel === 'Review Now'),
    'Needs Rebase': prReviews.filter(p => p.priorityLabel === 'Needs Rebase'),
    'Low Priority': prReviews.filter(p => p.priorityLabel === 'Low Priority'),
  };
  const accent = { 'Review Now': 'var(--danger)', 'Needs Rebase': 'var(--warning)', 'Low Priority': 'var(--success)' };

  return (
    <div className="priority-columns">
      {Object.entries(groups).map(([label, items]) => (
        <div key={label} className="priority-col">
          <div className="priority-col-header" style={{ borderColor: accent[label] }}>
            <span className="priority-col-label" style={{ color: accent[label] }}>{label}</span>
            <span className="priority-count">{items.length}</span>
          </div>
          <div className="priority-col-items">
            {items.length === 0 && <span className="muted-text">None</span>}
            {items.map(pr => (
              <div key={pr.id} className="priority-item">
                <a href={pr.url} target="_blank" rel="noreferrer" className="priority-item-title">
                  #{pr.number} {pr.title}
                </a>
                <div className="priority-item-meta">
                  <span>Score: {pr.priorityScore}</span>
                  <span>{pr.priorityReason}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const IssueAnalyzer = ({ issueMetrics, roadmap }) => {
  const [tab, setTab] = useState('roadmap');
  return (
    <div>
      <div className="tab-bar">
        {['roadmap', 'stale', 'noise'].map(t => (
          <button key={t} className={`tab-btn ${tab === t ? 'tab-btn-active' : ''}`} onClick={() => setTab(t)}>
            {t === 'roadmap' ? '🗺️ Roadmap' : t === 'stale' ? `⏰ Stale (${issueMetrics?.staleCount || 0})` : `📣 High Noise (${issueMetrics?.highNoiseCount || 0})`}
          </button>
        ))}
      </div>

      {tab === 'roadmap' && (
        <div className="roadmap-columns">
          {[
            { key: 'shortTerm', label: '🔥 Short-Term', sub: 'Bugs & Hotfixes', color: 'var(--danger)' },
            { key: 'midTerm', label: '🚀 Mid-Term', sub: 'Features & Enhancements', color: 'var(--primary)' },
            { key: 'longTerm', label: '🏛️ Long-Term', sub: 'Architecture & Epics', color: 'var(--secondary)' },
          ].map(({ key, label, sub, color }) => (
            <div key={key} className="roadmap-col">
              <div className="roadmap-col-header">
                <span className="roadmap-col-label">{label}</span>
                <span className="roadmap-col-sub">{sub}</span>
              </div>
              {(!roadmap?.[key] || roadmap[key].length === 0) && <span className="muted-text">None detected</span>}
              {(roadmap?.[key] || []).map(i => (
                <div key={i.id} className="roadmap-issue-item" style={{ borderLeft: `3px solid ${color}` }}>
                  <a href={i.url} target="_blank" rel="noreferrer" className="item-link">#{i.id} {i.title}</a>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {tab === 'stale' && (
        <div className="item-list">
          {(!issueMetrics?.stale || issueMetrics.stale.length === 0)
            ? <EmptyState icon="✅" message="No stale issues! Everything is active." />
            : issueMetrics.stale.map(i => (
              <div key={i.id} className="item-card">
                <a href={i.url} target="_blank" rel="noreferrer" className="item-link">#{i.id} {i.title}</a>
                <span className="muted-text" style={{ marginTop: 4, display: 'block' }}>
                  Last activity {i.daysSinceUpdate} days ago
                </span>
              </div>
            ))
          }
        </div>
      )}

      {tab === 'noise' && (
        <div className="item-list">
          {(!issueMetrics?.highNoise || issueMetrics.highNoise.length === 0)
            ? <EmptyState icon="🔇" message="No high-noise issues detected." />
            : issueMetrics.highNoise.map(i => (
              <div key={i.id} className="item-card">
                <a href={i.url} target="_blank" rel="noreferrer" className="item-link">#{i.id} {i.title}</a>
                <span className="noise-count">💬 {i.comments} comments</span>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
};

const PingMonitor = ({ pingMonitor }) => {
  const [replyVisible, setReplyVisible] = useState({});
  const toggle = (id) => setReplyVisible(prev => ({ ...prev, [id]: !prev[id] }));

  if (!pingMonitor || (pingMonitor.mostPinged.length === 0 && pingMonitor.highNoiseIssues.length === 0))
    return <EmptyState icon="🔕" message="No high-noise threads detected. All quiet!" />;

  return (
    <div>
      {pingMonitor.mostPinged.length > 0 && (
        <>
          <div className="sub-section-title">🔔 Most-Pinged PRs</div>
          <div className="item-list" style={{ marginBottom: 24 }}>
            {pingMonitor.mostPinged.map(pr => (
              <div key={pr.id} className="item-card">
                <div className="ping-row">
                  <a href={pr.url} target="_blank" rel="noreferrer" className="item-link">#{pr.id} {pr.title}</a>
                  <span className="noise-count">💬 {pr.comments}</span>
                </div>
                <button className="reply-btn" onClick={() => toggle(`pr-${pr.id}`)}>
                  {replyVisible[`pr-${pr.id}`] ? 'Hide Reply' : '✨ AI Reply Template'}
                </button>
                {replyVisible[`pr-${pr.id}`] && (
                  <div className="reply-box">{pr.suggestedReply}</div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
      {pingMonitor.highNoiseIssues.length > 0 && (
        <>
          <div className="sub-section-title">📣 High-Noise Issues</div>
          <div className="item-list">
            {pingMonitor.highNoiseIssues.map(i => (
              <div key={i.id} className="item-card">
                <div className="ping-row">
                  <a href={i.url} target="_blank" rel="noreferrer" className="item-link">#{i.id} {i.title}</a>
                  <span className="noise-count">💬 {i.comments}</span>
                </div>
                <button className="reply-btn" onClick={() => toggle(`i-${i.id}`)}>
                  {replyVisible[`i-${i.id}`] ? 'Hide Reply' : '✨ AI Reply Template'}
                </button>
                {replyVisible[`i-${i.id}`] && (
                  <div className="reply-box">{i.suggestedReply}</div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const HealthDashboard = ({ healthScore, overview }) => {
  if (!healthScore) return <EmptyState icon="📊" message="Loading health data..." />;
  const { score, status, burnoutRisk, breakdown } = healthScore;
  const color = score >= 80 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--danger)';

  const metrics = [
    { label: 'Avg PR Delay', value: `${breakdown.avgPrDelay}d`, warn: breakdown.avgPrDelay > 14 },
    { label: 'Conflict Ratio', value: `${breakdown.conflictRatio}%`, warn: breakdown.conflictRatio > 10 },
    { label: 'Stale Issues', value: `${breakdown.staleRatio}%`, warn: breakdown.staleRatio > 20 },
    { label: 'Open PRs', value: breakdown.openPrCount, warn: breakdown.openPrCount > 20 },
    { label: 'Recent Commits', value: breakdown.recentCommits, warn: false },
  ];

  return (
    <div>
      <div className="health-hero">
        <div className="health-circle" style={{ borderColor: color, color }}>
          <span className="health-score-num">{score}</span>
          <span className="health-score-label">/100</span>
        </div>
        <div className="health-info">
          <div className="health-status" style={{ color }}>{status}</div>
          {burnoutRisk && (
            <div className="burnout-alert">
              🔥 Burnout Risk Alert — review load is high!
            </div>
          )}
        </div>
      </div>

      <div className="health-metrics">
        {metrics.map(m => (
          <div key={m.label} className={`health-metric ${m.warn ? 'metric-warn' : ''}`}>
            <div className="metric-value">{m.value}</div>
            <div className="metric-label">{m.label}</div>
          </div>
        ))}
      </div>

      <div className="health-bar-container">
        <div className="health-bar" style={{ width: `${score}%`, background: color }} />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// CONTRIBUTOR PANELS
// ─────────────────────────────────────────────────────────────

const MyPRStatus = ({ myPrStatus, prReviews }) => {
  if (!myPrStatus && (!prReviews || prReviews.length === 0))
    return <EmptyState icon="📭" message="No PRs found for this repository." />;

  const pr = prReviews?.[0];
  const status = myPrStatus;
  if (!status) return <EmptyState icon="📭" message="No PR status available." />;

  const stateColor = status.state.includes('Blocked') ? 'var(--danger)' :
    status.state.includes('Awaiting') ? 'var(--warning)' : 'var(--primary)';

  return (
    <div>
      {pr && (
        <div className="contributor-pr-hero">
          <a href={pr.url} target="_blank" rel="noreferrer" className="item-link contributor-pr-title">
            #{pr.number} {pr.title}
          </a>
          <div className="contributor-pr-meta">
            <span>by {pr.author}</span>
            <span>🕐 {pr.daysOpen} days open</span>
          </div>
        </div>
      )}
      <div className="status-card" style={{ borderColor: stateColor }}>
        <div className="status-state" style={{ color: stateColor }}>{status.state}</div>
        <p className="status-explanation">{status.explanation}</p>
        <div className="next-action-box">
          <strong>💡 Suggested Next Action:</strong>
          <p>{status.nextAction}</p>
        </div>
      </div>
    </div>
  );
};

const ConflictHelper = ({ myPrStatus }) => {
  const conflict = myPrStatus?.conflictInfo;
  if (!conflict) return <EmptyState icon="🔍" message="Analyze a repository to see conflict info." />;

  if (!conflict.hasConflict) {
    return (
      <div className="status-card" style={{ borderColor: 'var(--success)' }}>
        <div className="status-state" style={{ color: 'var(--success)' }}>✅ No Conflicts Detected</div>
        <p className="status-explanation">{conflict.message}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="status-card" style={{ borderColor: 'var(--danger)' }}>
        <div className="status-state" style={{ color: 'var(--danger)' }}>⚡ Merge Conflict Detected</div>
        <p className="status-explanation">{conflict.explanation}</p>
      </div>
      <div className="conflict-steps">
        <div className="sub-section-title">📋 Resolution Steps</div>
        {conflict.steps.map((step, i) => (
          <div key={i} className="conflict-step">
            <code className="conflict-code">{step}</code>
          </div>
        ))}
      </div>
    </div>
  );
};

const RecommendedIssues = ({ goodFirstIssues }) => {
  if (!goodFirstIssues || goodFirstIssues.length === 0)
    return <EmptyState icon="🔍" message="No beginner-friendly issues detected." />;

  return (
    <div className="item-list">
      {goodFirstIssues.map(issue => (
        <div key={issue.id} className="item-card">
          <div className="item-card-header">
            <a href={issue.url} target="_blank" rel="noreferrer" className="item-link">
              #{issue.id} {issue.title}
            </a>
            <DiffBadge label={issue.difficulty} />
          </div>
          {issue.body && <p className="issue-body-preview">{issue.body}</p>}
          <div className="label-chips">
            {(issue.labels || []).slice(0, 4).map(l => (
              <span key={l} className="label-chip">{l}</span>
            ))}
          </div>
          <div className="issue-meta-row">
            <span className="muted-text">💬 {issue.comments} comments</span>
          </div>
        </div>
      ))}
    </div>
  );
};

const AIPreReview = () => {
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleReview = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await axios.post(`${API_BASE_URL}/review-code`, { code });
      setResult(res.data);
    } catch {
      setResult({ improvements: ['Failed to connect to AI service.'], score: 0 });
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = result
    ? result.score >= 80 ? 'var(--success)' : result.score >= 50 ? 'var(--warning)' : 'var(--danger)'
    : 'var(--text)';

  return (
    <div>
      <p className="muted-text" style={{ marginBottom: 12 }}>
        Paste your code below for an AI review before you submit your PR.
      </p>
      <textarea
        className="code-textarea"
        placeholder="// Paste your code snippet here..."
        value={code}
        onChange={e => setCode(e.target.value)}
        rows={10}
      />
      <button className="cta-button" onClick={handleReview} disabled={loading || !code.trim()}>
        {loading ? '⏳ Analyzing...' : '🤖 Run AI Review'}
      </button>

      {result && (
        <div className="review-result">
          <div className="review-result-header">
            <span className="review-score" style={{ color: scoreColor }}>
              Score: {result.score}/100
            </span>
            {result.lines && <span className="muted-text">{result.lines} lines analyzed</span>}
          </div>

          {result.commitMessage && (
            <div className="commit-msg-box">
              <strong>💬 Suggested Commit Message:</strong>
              <code>{result.commitMessage}</code>
            </div>
          )}

          <div className="sub-section-title" style={{ marginTop: 16 }}>🔍 Findings</div>
          <ul className="insight-list">
            {result.improvements.map((imp, i) => <li key={i}>{imp}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// OVERVIEW PANEL
// ─────────────────────────────────────────────────────────────
const OverviewPanel = ({ overview, isMock, rateLimited }) => (
  <div className="overview-panel">
    {isMock && (
      <div className="mock-banner">
        {rateLimited
          ? '⚠️ GitHub API rate limit exceeded — showing mock data. Add GITHUB_TOKEN to .env for real data.'
          : '⚠️ Repo not found — showing mock prototype data for demo purposes.'}
      </div>
    )}
    <div className="overview-hero">
      <div className="overview-name">{overview.name}</div>
      {overview.description && <p className="overview-desc">{overview.description}</p>}
      {overview.language && <span className="lang-chip">{overview.language}</span>}
    </div>
    <div className="stats-grid">
      {[
        { value: overview.stars?.toLocaleString(), label: 'Stars', icon: '⭐' },
        { value: overview.forks?.toLocaleString(), label: 'Forks', icon: '🍴' },
        { value: overview.openPrs, label: 'Open PRs', icon: '🔀', warn: overview.openPrs > 20 },
        { value: overview.openIssues, label: 'Open Issues', icon: '🐛', warn: overview.openIssues > 50 },
      ].map(s => (
        <div key={s.label} className="stat-card">
          <div className="stat-icon">{s.icon}</div>
          <div className={`stat-value ${s.warn ? 'stat-warn' : ''}`}>{s.value}</div>
          <div className="stat-label">{s.label}</div>
        </div>
      ))}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────
function App() {
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [view, setView] = useState('maintainer'); // 'maintainer' | 'contributor'
  const [activeSection, setActiveSection] = useState({
    maintainer: 'pr-control',
    contributor: 'my-pr',
  });

  const extractOwnerRepo = (url) => {
    try {
      if (!url.includes('github.com')) return null;
      const parts = url.split('github.com/')[1].split('/');
      if (parts.length >= 2) return { owner: parts[0], repo: parts[1] };
      return null;
    } catch { return null; }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!repoUrl) return;
    const parsed = extractOwnerRepo(repoUrl);
    if (!parsed) {
      setError('Please enter a valid GitHub URL (e.g., https://github.com/facebook/react)');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_BASE_URL}/analyze/${parsed.owner}/${parsed.repo}`);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to analyze repository. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const setSection = (sec) =>
    setActiveSection(prev => ({ ...prev, [view]: sec }));

  const maintainerSections = [
    { id: 'pr-control', label: '🔀 PR Control', count: data?.prReviews?.length },
    { id: 'priority', label: '⚡ Priority Queue' },
    { id: 'issues', label: '📋 Issue Analyzer' },
    { id: 'ping', label: '🔔 Ping Monitor' },
    { id: 'health', label: '📊 Health Score' },
  ];

  const contributorSections = [
    { id: 'my-pr', label: '🔀 My PR Status' },
    { id: 'conflict', label: '⚡ Conflict Helper' },
    { id: 'issues', label: '🎯 Good First Issues' },
    { id: 'prereview', label: '🤖 AI Pre-Review' },
  ];

  const sections = view === 'maintainer' ? maintainerSections : contributorSections;
  const current = activeSection[view];

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="app-header">
        <div className="header-brand">
          <div className="brand-icon">🚀</div>
          <div>
            <div className="brand-name">RepoPilot AI</div>
            <div className="brand-tagline">AI-powered GitHub Intelligence</div>
          </div>
        </div>

        <form onSubmit={handleAnalyze} className="search-form">
          <div className="search-wrapper">
            <span className="search-icon-inner">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="https://github.com/owner/repo"
              value={repoUrl}
              onChange={e => setRepoUrl(e.target.value)}
            />
          </div>
          <button type="submit" className="analyze-btn" disabled={loading}>
            {loading ? <span className="spinner" /> : null}
            {loading ? 'Analyzing…' : 'Analyze'}
          </button>
        </form>

        {/* View Toggle */}
        <div className="view-toggle">
          <button
            className={`toggle-btn ${view === 'maintainer' ? 'toggle-active' : ''}`}
            onClick={() => setView('maintainer')}
          >
            🛡️ Maintainer
          </button>
          <button
            className={`toggle-btn ${view === 'contributor' ? 'toggle-active' : ''}`}
            onClick={() => setView('contributor')}
          >
            👨‍💻 Contributor
          </button>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      {loading && (
        <div className="loading-screen">
          <div className="loading-orb" />
          <p className="loading-text">Fetching GitHub data & running AI analysis…</p>
          <div className="loading-steps">
            {['Connecting to GitHub API', 'Fetching PRs & Issues', 'Running AI Analysis', 'Generating Insights'].map((s, i) => (
              <div key={i} className="loading-step" style={{ animationDelay: `${i * 0.4}s` }}>
                <span className="loading-dot" />
                {s}
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && data && (
        <div className="dashboard">
          {/* Overview */}
          <OverviewPanel
            overview={data.overview}
            isMock={data.isMock}
            rateLimited={data.rateLimited}
          />

          {/* Sidebar + Content */}
          <div className="dashboard-body">
            <nav className="sidebar">
              <div className="sidebar-label">
                {view === 'maintainer' ? '🛡️ MAINTAINER' : '👨‍💻 CONTRIBUTOR'}
              </div>
              {sections.map(s => (
                <button
                  key={s.id}
                  className={`nav-btn ${current === s.id ? 'nav-btn-active' : ''}`}
                  onClick={() => setSection(s.id)}
                >
                  {s.label}
                  {s.count != null && <span className="nav-count">{s.count}</span>}
                </button>
              ))}
            </nav>

            <main className="content-area">
              {/* ── MAINTAINER SECTIONS ── */}
              {view === 'maintainer' && (
                <>
                  {current === 'pr-control' && (
                    <div className="panel">
                      <SectionTitle icon="🔀">PR Control Dashboard</SectionTitle>
                      <PRControlPanel prReviews={data.prReviews} />
                    </div>
                  )}
                  {current === 'priority' && (
                    <div className="panel">
                      <SectionTitle icon="⚡">PR Prioritization Engine</SectionTitle>
                      <PriorityQueue prReviews={data.prReviews} />
                    </div>
                  )}
                  {current === 'issues' && (
                    <div className="panel">
                      <SectionTitle icon="📋">Issue Overload Analyzer & Roadmap</SectionTitle>
                      <IssueAnalyzer issueMetrics={data.issueMetrics} roadmap={data.roadmap} />
                    </div>
                  )}
                  {current === 'ping' && (
                    <div className="panel">
                      <SectionTitle icon="🔔">Maintainer Ping & Noise Monitor</SectionTitle>
                      <PingMonitor pingMonitor={data.pingMonitor} />
                    </div>
                  )}
                  {current === 'health' && (
                    <div className="panel">
                      <SectionTitle icon="📊">Project Health Score</SectionTitle>
                      <HealthDashboard healthScore={data.healthScore} overview={data.overview} />
                    </div>
                  )}
                </>
              )}

              {/* ── CONTRIBUTOR SECTIONS ── */}
              {view === 'contributor' && (
                <>
                  {current === 'my-pr' && (
                    <div className="panel">
                      <SectionTitle icon="🔀">My PR Status Intelligence</SectionTitle>
                      <MyPRStatus myPrStatus={data.myPrStatus} prReviews={data.prReviews} />
                    </div>
                  )}
                  {current === 'conflict' && (
                    <div className="panel">
                      <SectionTitle icon="⚡">Merge Conflict Explainer</SectionTitle>
                      <ConflictHelper myPrStatus={data.myPrStatus} />
                    </div>
                  )}
                  {current === 'issues' && (
                    <div className="panel">
                      <SectionTitle icon="🎯">Smart Contribution Guidance</SectionTitle>
                      <RecommendedIssues goodFirstIssues={data.goodFirstIssues} />
                    </div>
                  )}
                  {current === 'prereview' && (
                    <div className="panel">
                      <SectionTitle icon="🤖">AI Pre-Submission Review</SectionTitle>
                      <AIPreReview />
                    </div>
                  )}
                </>
              )}
            </main>
          </div>
        </div>
      )}

      {!loading && !data && !error && (
        <div className="landing">
          <div className="landing-glow" />
          <h2 className="landing-headline">Reduce Maintainer Burnout.<br />Empower Contributors.</h2>
          <p className="landing-sub">
            Enter any GitHub repository URL above to get AI-powered PR analysis,
            issue triage, health scoring, and contribution guidance — instantly.
          </p>
          <div className="landing-features">
            {[
              { icon: '🛡️', title: 'Maintainer Command Center', desc: 'PR prioritization, issue roadmap, ping monitor, and burnout alerts' },
              { icon: '👨‍💻', title: 'Contributor Assistant', desc: 'PR status tracking, conflict resolution, and "good first issue" finder' },
              { icon: '🤖', title: 'AI-Powered Analysis', desc: 'Smart code review, security scanning, and risk scoring on every PR' },
              { icon: '📊', title: 'Project Health Score', desc: 'Composite 0-100 score measuring project vitality and team workload' },
            ].map(f => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
          <div className="demo-repos">
            <div className="demo-label">Try with a real repo:</div>
            <div className="demo-chips">
              {[
                'https://github.com/facebook/react',
                'https://github.com/vercel/next.js',
                'https://github.com/microsoft/vscode',
              ].map(url => (
                <button key={url} className="demo-chip" onClick={() => setRepoUrl(url)}>
                  {url.replace('https://github.com/', '')}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
