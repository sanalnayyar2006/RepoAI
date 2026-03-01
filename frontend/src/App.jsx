import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';


const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// ─────────────────────────────────────────────────────────────
// AUTH COMPONENTS
// ─────────────────────────────────────────────────────────────

const AuthPage = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isSignUp) {
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
    }

    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const user = {
        email: formData.email,
        fullName: isSignUp ? formData.fullName : formData.email.split('@')[0]
      };
      localStorage.setItem('user', JSON.stringify(user));
      onLogin(user);
      setLoading(false);
    }, 1000);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-brand">
            <div className="auth-brand-icon">RP</div>
            <h1 className="auth-brand-name">RepoPilot AI</h1>
          </div>
          <p className="auth-tagline">AI-powered GitHub Intelligence Platform</p>
        </div>

        <div className="auth-card">
          <div className="auth-tabs">
            <button
              className={`auth-tab ${!isSignUp ? 'auth-tab-active' : ''}`}
              onClick={() => setIsSignUp(false)}
            >
              Sign In
            </button>
            <button
              className={`auth-tab ${isSignUp ? 'auth-tab-active' : ''}`}
              onClick={() => setIsSignUp(true)}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="auth-error">{error}</div>}

            {isSignUp && (
              <div className="form-group">
                <label htmlFor="fullName">Full Name</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  placeholder="Enter your full name"
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
              />
            </div>

            {isSignUp && (
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="Confirm your password"
                />
              </div>
            )}

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner" />
                  {isSignUp ? 'Creating Account...' : 'Signing In...'}
                </>
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </button>
          </form>

          <div className="auth-footer">
            {!isSignUp ? (
              <p>
                Don't have an account?{' '}
                <button className="auth-link" onClick={() => setIsSignUp(true)}>
                  Sign up
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button className="auth-link" onClick={() => setIsSignUp(false)}>
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>

        <div className="auth-features">
          <div className="auth-feature">
            <div className="auth-feature-icon">PR</div>
            <h3>PR Analysis</h3>
            <p>Smart code review and risk scoring</p>
          </div>
          <div className="auth-feature">
            <div className="auth-feature-icon">IQ</div>
            <h3>Issue Queue</h3>
            <p>Intelligent issue prioritization</p>
          </div>
          <div className="auth-feature">
            <div className="auth-feature-icon">HS</div>
            <h3>Health Score</h3>
            <p>Project vitality metrics</p>
          </div>
        </div>
      </div>
    </div>
  );
};

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
  const icon = { High: '!', Medium: '~', Low: '✓' };
  return <span className={`badge ${map[level] || 'badge-low'}`}>{icon[level]} {level} Risk</span>;
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

const SectionTitle = ({ children }) => (
  <h2 className="section-title">
    {children}
  </h2>
);

const EmptyState = ({ message }) => (
  <div className="empty-state">
    <p>{message}</p>
  </div>
);

const CollapsibleCard = ({ header, children, defaultOpen = false, accent }) => {
  const [open, setOpen] = useState(defaultOpen);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 10;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  return (
    <div 
      ref={cardRef}
      className="item-card" 
      style={accent ? { 
        borderLeft: `4px solid ${accent}`,
        transform: `perspective(1000px) rotateY(${mousePos.x}deg) rotateX(${-mousePos.y}deg)`
      } : {
        transform: `perspective(1000px) rotateY(${mousePos.x}deg) rotateX(${-mousePos.y}deg)`
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
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
    return <EmptyState message="No open PRs — the queue is clear!" />;

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
                  <span className="meta-chip">Author: {pr.author}</span>
                  <span className="meta-chip">Open: {pr.daysOpen}d</span>
                  <span className="meta-chip">Changes: +{pr.additions} -{pr.deletions}</span>
                  {pr.hasConflict && <span className="meta-chip chip-danger">! Conflict</span>}
                  {pr.daysOpen > 14 && !pr.hasConflict && <span className="meta-chip chip-warn">~ Stale</span>}
                  <RiskBadge level={pr.riskLevel} />
                  <PriorityBadge label={pr.priorityLabel} />
                </div>
              </div>
            }
          >
            <div className="ai-insight-box">
              <p className="ai-summary-text">{pr.summary}</p>
            </div>
              {[
                { key: 'codeImprovements', title: 'Code Issues', icon: '!' },
                { key: 'securityRisks', title: 'Security / Perf', icon: '⚠' },
                { key: 'styleImprovements', title: 'Style', icon: '~' },
              ].map(({ key, title, icon }) => {
                const items = pr.categories[key];
                if (!items || items.length === 0) return null;
                return (
                  <div key={key} className="review-section">
                    <div className="review-section-title">{icon} {title}</div>
                    <ul className="insight-list">
                      {items.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                );
              })}
          </CollapsibleCard>
        );
      })}
    </div>
  );
};

const PriorityQueue = ({ prReviews }) => {
  if (!prReviews || prReviews.length === 0)
    return <EmptyState message="Priority queue is empty." />;

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
            {t === 'roadmap' ? 'Roadmap' : t === 'stale' ? `Stale (${issueMetrics?.staleCount || 0})` : `High Noise (${issueMetrics?.highNoiseCount || 0})`}
          </button>
        ))}
      </div>

      {tab === 'roadmap' && (
        <div className="roadmap-columns">
          {[
            { key: 'shortTerm', label: 'Short-Term', sub: 'Bugs and Hotfixes', color: 'var(--danger)' },
            { key: 'midTerm', label: 'Mid-Term', sub: 'Features and Enhancements', color: 'var(--primary)' },
            { key: 'longTerm', label: 'Long-Term', sub: 'Architecture and Epics', color: 'var(--secondary)' },
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
            ? <EmptyState message="No stale issues! Everything is active." />
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
            ? <EmptyState message="No high-noise issues detected." />
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
    return <EmptyState message="No high-noise threads detected. All quiet!" />;

  return (
    <div>
      {pingMonitor.mostPinged.length > 0 && (
        <>
          <div className="sub-section-title">Most-Pinged PRs</div>
          <div className="item-list" style={{ marginBottom: 24 }}>
            {pingMonitor.mostPinged.map(pr => (
              <div key={pr.id} className="item-card">
                <div className="ping-row">
                  <a href={pr.url} target="_blank" rel="noreferrer" className="item-link">#{pr.id} {pr.title}</a>
                  <span className="noise-count">Comments: {pr.comments}</span>
                </div>
                <button className="reply-btn" onClick={() => toggle(`pr-${pr.id}`)}>
                  {replyVisible[`pr-${pr.id}`] ? 'Hide Reply' : 'AI Reply Template'}
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
          <div className="sub-section-title">High-Noise Issues</div>
          <div className="item-list">
            {pingMonitor.highNoiseIssues.map(i => (
              <div key={i.id} className="item-card">
                <div className="ping-row">
                  <a href={i.url} target="_blank" rel="noreferrer" className="item-link">#{i.id} {i.title}</a>
                  <span className="noise-count">Comments: {i.comments}</span>
                </div>
                <button className="reply-btn" onClick={() => toggle(`i-${i.id}`)}>
                  {replyVisible[`i-${i.id}`] ? 'Hide Reply' : 'AI Reply Template'}
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
  if (!healthScore) return <EmptyState message="Loading health data..." />;
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
              ! Burnout Risk Alert — review load is high!
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
    return <EmptyState message="No PRs found for this repository." />;

  const pr = prReviews?.[0];
  const status = myPrStatus;
  if (!status) return <EmptyState message="No PR status available." />;

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
            <span>Open: {pr.daysOpen} days</span>
          </div>
        </div>
      )}
      <div className="status-card" style={{ borderColor: stateColor }}>
        <div className="status-state" style={{ color: stateColor }}>{status.state}</div>
        <p className="status-explanation">{status.explanation}</p>
        <div className="next-action-box">
          <strong>Suggested Next Action:</strong>
          <p>{status.nextAction}</p>
        </div>
      </div>
    </div>
  );
};

const ConflictHelper = ({ myPrStatus }) => {
  const conflict = myPrStatus?.conflictInfo;
  if (!conflict) return <EmptyState message="Analyze a repository to see conflict info." />;

  if (!conflict.hasConflict) {
    return (
      <div className="status-card" style={{ borderColor: 'var(--success)' }}>
        <div className="status-state" style={{ color: 'var(--success)' }}>✓ No Conflicts Detected</div>
        <p className="status-explanation">{conflict.message}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="status-card" style={{ borderColor: 'var(--danger)' }}>
        <div className="status-state" style={{ color: 'var(--danger)' }}>! Merge Conflict Detected</div>
        <p className="status-explanation">{conflict.explanation}</p>
      </div>
      <div className="conflict-steps">
        <div className="sub-section-title">Resolution Steps</div>
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
    return <EmptyState message="No beginner-friendly issues detected." />;

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
            <span className="muted-text">Comments: {issue.comments}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

const CodePlagiarismChecker = () => {
  const [code1, setCode1] = useState('');
  const [code2, setCode2] = useState('');
  const [author1, setAuthor1] = useState('');
  const [author2, setAuthor2] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCompare = async () => {
    if (!code1.trim() || !code2.trim()) return;
    setLoading(true);
    setResult(null);

    // Simulate API delay
    setTimeout(() => {
      const analysis = analyzeCodeSimilarity(code1, code2);
      setResult(analysis);
      setLoading(false);
    }, 1500);
  };

  const analyzeCodeSimilarity = (code1, code2) => {
    // Split code into lines
    const lines1 = code1.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const lines2 = code2.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    // Find matching lines
    const matches = [];
    lines1.forEach((line1, idx1) => {
      lines2.forEach((line2, idx2) => {
        const similarity = calculateLineSimilarity(line1, line2);
        if (similarity > 0.8 && line1.length > 10) { // 80% similar and meaningful length
          matches.push({
            line1: idx1 + 1,
            line2: idx2 + 1,
            text: line1,
            similarity: Math.round(similarity * 100)
          });
        }
      });
    });

    // Remove duplicate matches (keep highest similarity)
    const uniqueMatches = [];
    const seenLines1 = new Set();
    const seenLines2 = new Set();
    
    matches
      .sort((a, b) => b.similarity - a.similarity)
      .forEach(match => {
        if (!seenLines1.has(match.line1) && !seenLines2.has(match.line2)) {
          uniqueMatches.push(match);
          seenLines1.add(match.line1);
          seenLines2.add(match.line2);
        }
      });

    // Calculate overall similarity
    const overallSimilarity = calculateOverallSimilarity(code1, code2);
    const isPlagiarism = overallSimilarity > 70;

    return {
      similarity: overallSimilarity,
      isPlagiarism,
      matches: uniqueMatches.slice(0, 10), // Show top 10 matches
      totalMatches: uniqueMatches.length,
      analysis: isPlagiarism 
        ? `High similarity detected (${overallSimilarity}%). Code appears to be copied or heavily inspired. Found ${uniqueMatches.length} matching segments.`
        : `Low similarity (${overallSimilarity}%). Code appears to be original or significantly different. Found ${uniqueMatches.length} matching segments.`
    };
  };

  const calculateLineSimilarity = (str1, str2) => {
    // Normalize strings
    const normalize = (str) => str.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
    const norm1 = normalize(str1);
    const norm2 = normalize(str2);

    if (norm1.length === 0 || norm2.length === 0) return 0;

    // Calculate Levenshtein distance
    const matrix = [];
    for (let i = 0; i <= norm2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= norm1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= norm2.length; i++) {
      for (let j = 1; j <= norm1.length; j++) {
        if (norm2.charAt(i - 1) === norm1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    const distance = matrix[norm2.length][norm1.length];
    const maxLen = Math.max(norm1.length, norm2.length);
    return 1 - (distance / maxLen);
  };

  const calculateOverallSimilarity = (str1, str2) => {
    const normalize = (str) => str.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
    const norm1 = normalize(str1);
    const norm2 = normalize(str2);

    if (norm1.length === 0 || norm2.length === 0) return 0;

    // Use longest common subsequence
    const lcs = longestCommonSubsequence(norm1, norm2);
    const similarity = (2 * lcs) / (norm1.length + norm2.length);
    
    return Math.round(similarity * 100);
  };

  const longestCommonSubsequence = (str1, str2) => {
    const m = str1.length;
    const n = str2.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    return dp[m][n];
  };

  const similarityColor = result
    ? result.similarity >= 70 ? 'var(--danger)' : result.similarity >= 40 ? 'var(--warning)' : 'var(--success)'
    : 'var(--text)';

  return (
    <div>
      <p className="muted-text" style={{ marginBottom: 24 }}>
        Compare two code submissions to detect potential plagiarism or code copying.
      </p>

      <div className="comparison-grid">
        <div className="comparison-panel">
          <div className="comparison-header">
            <label htmlFor="author1">Author 1</label>
            <input
              type="text"
              id="author1"
              className="author-input"
              placeholder="Enter author name"
              value={author1}
              onChange={e => setAuthor1(e.target.value)}
            />
          </div>
          <textarea
            className="code-textarea"
            placeholder="// Paste first code submission here..."
            value={code1}
            onChange={e => setCode1(e.target.value)}
            rows={12}
          />
        </div>

        <div className="comparison-divider">VS</div>

        <div className="comparison-panel">
          <div className="comparison-header">
            <label htmlFor="author2">Author 2</label>
            <input
              type="text"
              id="author2"
              className="author-input"
              placeholder="Enter author name"
              value={author2}
              onChange={e => setAuthor2(e.target.value)}
            />
          </div>
          <textarea
            className="code-textarea"
            placeholder="// Paste second code submission here..."
            value={code2}
            onChange={e => setCode2(e.target.value)}
            rows={12}
          />
        </div>
      </div>

      <button 
        className="cta-button" 
        onClick={handleCompare} 
        disabled={loading || !code1.trim() || !code2.trim()}
        style={{ margin: '24px auto', display: 'flex' }}
      >
        {loading ? (
          <>
            <span className="spinner" />
            Analyzing...
          </>
        ) : (
          'Compare Code'
        )}
      </button>

      {result && (
        <div className="plagiarism-result">
          <div className="plagiarism-header">
            <div className="similarity-score" style={{ borderColor: similarityColor }}>
              <div className="similarity-percentage" style={{ color: similarityColor }}>
                {result.similarity}%
              </div>
              <div className="similarity-label">Similarity</div>
            </div>
            <div className="plagiarism-verdict" style={{ 
              background: result.isPlagiarism ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
              borderColor: result.isPlagiarism ? 'var(--danger)' : 'var(--success)',
              color: result.isPlagiarism ? 'var(--danger)' : 'var(--success)'
            }}>
              {result.isPlagiarism ? '! Potential Plagiarism Detected' : '✓ Code Appears Original'}
            </div>
          </div>

          <div className="plagiarism-analysis">
            <strong>Analysis:</strong>
            <p>{result.analysis}</p>
          </div>

          {result.matches.length > 0 ? (
            <div className="plagiarism-matches">
              <div className="sub-section-title">
                Matching Code Segments ({result.matches.length} {result.totalMatches > 10 ? `of ${result.totalMatches}` : 'found'})
              </div>
              {result.matches.map((match, i) => (
                <div key={i} className="match-item">
                  <div className="match-header">
                    <span className="match-location">
                      {author1 || 'Author 1'} (Line {match.line1}) ↔ {author2 || 'Author 2'} (Line {match.line2})
                    </span>
                    <span className="match-similarity">{match.similarity}% match</span>
                  </div>
                  <code className="match-code">{match.text}</code>
                </div>
              ))}
            </div>
          ) : (
            <div className="plagiarism-matches">
              <div className="sub-section-title">Matching Code Segments</div>
              <div className="empty-state">
                <p>No significant matching code segments found.</p>
              </div>
            </div>
          )}

          <div className="plagiarism-recommendations">
            <div className="sub-section-title">Recommendations</div>
            <ul className="insight-list">
              {result.isPlagiarism ? (
                <>
                  <li>Review both submissions carefully for academic integrity violations</li>
                  <li>Interview authors separately about their implementation approach</li>
                  <li>Check commit history and timestamps for both submissions</li>
                  <li>Consider requesting additional documentation or explanation</li>
                  <li>Compare with other submissions to identify the original source</li>
                </>
              ) : (
                <>
                  <li>Code appears to be independently written</li>
                  <li>Minor similarities may be due to common patterns or best practices</li>
                  <li>No further action required regarding plagiarism</li>
                  <li>Continue with normal code review process</li>
                </>
              )}
            </ul>
          </div>
        </div>
      )}
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
        {loading ? 'Analyzing...' : 'Run AI Review'}
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
              <strong>Suggested Commit Message:</strong>
              <code>{result.commitMessage}</code>
            </div>
          )}

          <div className="sub-section-title" style={{ marginTop: 16 }}>Findings</div>
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
        { value: overview.stars?.toLocaleString(), label: 'Stars', icon: '★' },
        { value: overview.forks?.toLocaleString(), label: 'Forks', icon: '⑂' },
        { value: overview.openPrs, label: 'Open PRs', icon: '⇄', warn: overview.openPrs > 20 },
        { value: overview.openIssues, label: 'Open Issues', icon: '!', warn: overview.openIssues > 50 },
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
  const [user, setUser] = useState(null);
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [view, setView] = useState('maintainer'); // 'maintainer' | 'contributor'
  const [activeSection, setActiveSection] = useState({
    maintainer: 'pr-control',
    contributor: 'my-pr',
  });
  const [scrollY, setScrollY] = useState(0);
  const contentRef = useRef(null);
  const landingRef = useRef(null);

  // Check for existing user session
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setData(null);
    setRepoUrl('');
  };

  // Scroll tracking for parallax effects
  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        setScrollY(contentRef.current.scrollTop);
      }
    };

    const handleLandingScroll = () => {
      if (landingRef.current) {
        setScrollY(window.scrollY);
      }
    };

    const contentEl = contentRef.current;
    if (contentEl) {
      contentEl.addEventListener('scroll', handleScroll);
      return () => contentEl.removeEventListener('scroll', handleScroll);
    } else {
      window.addEventListener('scroll', handleLandingScroll);
      return () => window.removeEventListener('scroll', handleLandingScroll);
    }
  }, [data]);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            // Once animated, stop observing to prevent re-animation
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      const elements = document.querySelectorAll('.scroll-animate:not(.animate-in)');
      elements.forEach((el) => observer.observe(el));
    }, 100);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [data, activeSection, view]);

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
    { id: 'pr-control', label: 'PR Control', count: data?.prReviews?.length },
    { id: 'priority', label: 'Priority Queue' },
    { id: 'plagiarism', label: 'Code Comparison' },
    { id: 'issues', label: 'Issue Analyzer' },
    { id: 'ping', label: 'Ping Monitor' },
    { id: 'health', label: 'Health Score' },
  ];

  const contributorSections = [
    { id: 'my-pr', label: 'My PR Status' },
    { id: 'conflict', label: 'Conflict Helper' },
    { id: 'issues', label: 'Good First Issues' },
    { id: 'prereview', label: 'AI Pre-Review' },
  ];

  const sections = view === 'maintainer' ? maintainerSections : contributorSections;
  const current = activeSection[view];

  // Show auth page if not logged in
  if (!user) {
    return <AuthPage onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="app-header" style={{ transform: `translateY(${Math.min(scrollY * 0.5, 20)}px)` }}>
        <div className="header-brand">
          <div className="brand-icon">RP</div>
          <div>
            <div className="brand-name">RepoPilot AI</div>
            <div className="brand-tagline">AI-powered GitHub Intelligence</div>
          </div>
        </div>

        <form onSubmit={handleAnalyze} className="search-form">
          <div className="search-wrapper">
            <span className="search-icon-inner">⌕</span>
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
            Maintainer
          </button>
          <button
            className={`toggle-btn ${view === 'contributor' ? 'toggle-active' : ''}`}
            onClick={() => setView('contributor')}
          >
            Contributor
          </button>
        </div>

        {/* User Menu */}
        <div className="user-menu">
          <div className="user-avatar">{user.fullName?.[0] || user.email[0]}</div>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      {loading && (
        <div className="loading-screen">
          <div className="loading-orb" />
          <p className="loading-text">Analyzing Repository...</p>
          <div className="loading-steps">
            {['Connecting to GitHub API', 'Fetching PRs and Issues', 'Running AI Analysis', 'Generating Insights'].map((s, i) => (
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
            <nav className="sidebar" style={{ transform: `translateX(${Math.min(scrollY * -0.1, 0)}px)` }}>
              <div className="sidebar-label">
                {view === 'maintainer' ? 'MAINTAINER' : 'CONTRIBUTOR'}
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

            <main className="content-area" ref={contentRef}>
              {/* ── MAINTAINER SECTIONS ── */}
              {view === 'maintainer' && (
                <>
                  {current === 'pr-control' && (
                    <div className="panel">
                      <SectionTitle>PR Control Dashboard</SectionTitle>
                      <PRControlPanel prReviews={data.prReviews} />
                    </div>
                  )}
                  {current === 'priority' && (
                    <div className="panel">
                      <SectionTitle>PR Prioritization Engine</SectionTitle>
                      <PriorityQueue prReviews={data.prReviews} />
                    </div>
                  )}
                  {current === 'plagiarism' && (
                    <div className="panel">
                      <SectionTitle>Code Plagiarism Detector</SectionTitle>
                      <CodePlagiarismChecker />
                    </div>
                  )}
                  {current === 'issues' && (
                    <div className="panel">
                      <SectionTitle>Issue Overload Analyzer & Roadmap</SectionTitle>
                      <IssueAnalyzer issueMetrics={data.issueMetrics} roadmap={data.roadmap} />
                    </div>
                  )}
                  {current === 'ping' && (
                    <div className="panel">
                      <SectionTitle>Maintainer Ping & Noise Monitor</SectionTitle>
                      <PingMonitor pingMonitor={data.pingMonitor} />
                    </div>
                  )}
                  {current === 'health' && (
                    <div className="panel">
                      <SectionTitle>Project Health Score</SectionTitle>
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
                      <SectionTitle>My PR Status Intelligence</SectionTitle>
                      <MyPRStatus myPrStatus={data.myPrStatus} prReviews={data.prReviews} />
                    </div>
                  )}
                  {current === 'conflict' && (
                    <div className="panel">
                      <SectionTitle>Merge Conflict Explainer</SectionTitle>
                      <ConflictHelper myPrStatus={data.myPrStatus} />
                    </div>
                  )}
                  {current === 'issues' && (
                    <div className="panel">
                      <SectionTitle>Smart Contribution Guidance</SectionTitle>
                      <RecommendedIssues goodFirstIssues={data.goodFirstIssues} />
                    </div>
                  )}
                  {current === 'prereview' && (
                    <div className="panel">
                      <SectionTitle>AI Pre-Submission Review</SectionTitle>
                      <AIPreReview />
                    </div>
                  )}
                </>
              )}
            </main>
          </div>
        </div>
      )}


    </div>
  );
}

export default App;
