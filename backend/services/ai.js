// RepoPilot AI — Mock AI Engine
// In production, replace with real OpenAI API calls.

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
const daysAgo = (dateStr) =>
    Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));

const textIncludes = (issue, keywords) => {
    const text = ((issue.title || '') + ' ' + (issue.body || '')).toLowerCase();
    return keywords.some((k) => text.includes(k));
};

const firstLine = (text, max = 120) => {
    if (!text) return '';
    const line = text.split('\n')[0].trim();
    return line.length > max ? line.slice(0, max) + '…' : line;
};

// ─────────────────────────────────────────────────────────────
// PR ANALYSIS
// ─────────────────────────────────────────────────────────────
const generateReviewText = (diff) => {
    if (!diff) return ['No diff available — ensure the PR has committed changes.'];
    const suggestions = [];
    if (diff.includes('null') || diff.includes('undefined'))
        suggestions.push('Potential null/undefined dereference detected. Add null guards.');
    if (diff.includes('console.log'))
        suggestions.push('console.log statements found — strip debug output before merging.');
    if (diff.includes('TODO') || diff.includes('FIXME'))
        suggestions.push('Unresolved TODO/FIXME comments in the diff. Address or track separately.');
    if (diff.includes('catch') && !diff.includes('console') && !diff.includes('throw'))
        suggestions.push('Silent catch block detected — errors may be swallowed silently.');
    if (suggestions.length === 0)
        suggestions.push('Code logic looks clean with no common anti-patterns detected.');
    return suggestions;
};

const generateStyleSuggestions = (diff) => {
    if (!diff) return ['Style analysis unavailable — no diff provided.'];
    const suggestions = [];
    if (diff.includes('var '))
        suggestions.push("Prefer 'const' or 'let' over legacy 'var' declarations.");
    if (diff.includes(' == ') || diff.includes(' != '))
        suggestions.push("Use strict equality '===' / '!==' instead of loose '==' / '!='.");
    if (/\t/.test(diff))
        suggestions.push('Tab characters detected — ensure consistent indentation (spaces preferred).');
    if (suggestions.length === 0)
        suggestions.push('Style conventions appear to be followed correctly.');
    return suggestions;
};

const generateSecurityRisks = (diff) => {
    if (!diff) return ['Security scan unavailable — no diff provided.'];
    const risks = [];
    if (diff.includes('eval('))
        risks.push('🔴 CRITICAL: eval() detected — major XSS/injection risk. Remove immediately.');
    if (diff.includes('innerHTML'))
        risks.push('🔴 HIGH: innerHTML assignment detected — potential XSS vector. Use textContent or DOMPurify.');
    if (diff.includes('drop table') || diff.includes('DELETE FROM'))
        risks.push('🔴 HIGH: Destructive SQL statement detected. Verify authorization guards.');
    if (diff.includes('.map') && diff.includes('await'))
        risks.push('🟡 PERF: Await inside .map() — use Promise.all() for concurrent execution.');
    if (diff.includes('SELECT *'))
        risks.push('🟡 PERF: SELECT * query detected — specify only needed columns.');
    if (risks.length === 0)
        risks.push('✅ No obvious security or critical performance issues found.');
    return risks;
};

const determineRiskLevel = (pr, diff) => {
    const d = diff || '';
    if (d.includes('eval(') || d.includes('innerHTML') || d.includes('DROP TABLE')) return 'High';
    const additions = pr.additions || 0;
    const deletions = pr.deletions || 0;
    const total = additions + deletions || d.length;
    if (d.includes('null') || d.includes('undefined') || total > 500) return 'Medium';
    return 'Low';
};

const getPriorityLabel = (score) => {
    if (score >= 75) return 'Review Now';
    if (score >= 45) return 'Needs Rebase';
    return 'Low Priority';
};

const calculatePriority = (pr, diff, riskLevel) => {
    let score = 50;
    const reasons = [];

    if (riskLevel === 'High') { score += 30; reasons.push('High-risk code detected'); }
    else if (riskLevel === 'Medium') { score += 12; reasons.push('Medium-risk changes'); }

    const total = (pr.additions || 0) + (pr.deletions || 0) || diff.length;
    if (total > 800) { score -= 8; reasons.push('Very large PR — hard to review'); }
    else if (total < 60) { score += 12; reasons.push('Tiny change — quick win'); }

    const days = daysAgo(pr.created_at || new Date());
    if (days > 21) { score += 25; reasons.push('Open > 3 weeks — critical delay'); }
    else if (days > 14) { score += 18; reasons.push('Open > 2 weeks'); }
    else if (days > 7) { score += 8; reasons.push('Open > 1 week'); }

    if (pr.mergeable === false || pr.mergeable_state === 'dirty') {
        score += 20; reasons.push('Has merge conflicts');
    }

    return {
        score: Math.min(100, Math.max(0, Math.floor(score))),
        label: getPriorityLabel(score),
        reason: reasons[0] || 'Standard priority',
    };
};

const generatePRSummary = (pr, riskLevel, days) => {
    const size = (pr.additions || 0) + (pr.deletions || 0);
    const sizeDesc = size > 500 ? 'large' : size > 100 ? 'medium-sized' : 'small';
    const conflict = pr.mergeable === false ? ' It currently has merge conflicts.' : '';
    const delay =
        days > 14
            ? ` This PR has been open for ${days} days — maintainer attention is overdue.`
            : days > 7
                ? ` Open for ${days} days without merge.`
                : '';
    return `This is a ${sizeDesc} ${riskLevel.toLowerCase()}-risk pull request by ${pr.user?.login || 'an unknown contributor'} that modifies the codebase with ${pr.additions || 0} additions and ${pr.deletions || 0} deletions.${conflict}${delay}`;
};

const analyzePRs = (pullRequests) => {
    if (!pullRequests || pullRequests.length === 0) return [];
    return pullRequests
        .map((pr) => {
            const diff = pr.diff || pr.body || '++ const update = true;';
            const days = daysAgo(pr.created_at || new Date());
            const riskLevel = determineRiskLevel(pr, diff);
            const priority = calculatePriority(pr, diff, riskLevel);
            const hasConflict = pr.mergeable === false || pr.mergeable_state === 'dirty';
            return {
                id: pr.id || pr.number,
                number: pr.number,
                title: pr.title,
                author: pr.user?.login || pr.user || 'Unknown',
                authorAvatar: pr.user?.avatar_url || null,
                daysOpen: days,
                linesChanged: (pr.additions || 0) + (pr.deletions || 0),
                additions: pr.additions || 0,
                deletions: pr.deletions || 0,
                hasConflict,
                riskLevel,
                priorityScore: priority.score,
                priorityLabel: priority.label,
                priorityReason: priority.reason,
                summary: generatePRSummary(pr, riskLevel, days),
                categories: {
                    codeImprovements: generateReviewText(diff),
                    styleImprovements: generateStyleSuggestions(diff),
                    securityRisks: generateSecurityRisks(diff),
                },
                url: pr.html_url || '#',
            };
        })
        .sort((a, b) => b.priorityScore - a.priorityScore);
};

// ─────────────────────────────────────────────────────────────
// ISSUE ANALYSIS
// ─────────────────────────────────────────────────────────────
const generateRoadmap = (issues) => {
    if (!issues || issues.length === 0) return { shortTerm: [], midTerm: [], longTerm: [] };
    const roadmap = { shortTerm: [], midTerm: [], longTerm: [] };
    issues.forEach((issue) => {
        const entry = { id: issue.number, title: issue.title, url: issue.html_url || '#', comments: issue.comments || 0 };
        if (textIncludes(issue, ['bug', 'fix', 'urgent', 'crash', 'regression', 'security', 'hotfix', 'broken']))
            roadmap.shortTerm.push(entry);
        else if (textIncludes(issue, ['feature', 'enhancement', 'add', 'improve', 'mode', 'support', 'update', 'refactor']))
            roadmap.midTerm.push(entry);
        else
            roadmap.longTerm.push(entry);
    });
    return roadmap;
};

const analyzeIssues = (issues) => {
    if (!issues || issues.length === 0)
        return { stale: [], highNoise: [], total: 0, staleCount: 0, highNoiseCount: 0 };

    const now = Date.now();
    const stale = [];
    const highNoise = [];

    issues.forEach((issue) => {
        const lastUpdate = new Date(issue.updated_at || issue.created_at).getTime();
        const daysSinceUpdate = Math.floor((now - lastUpdate) / (1000 * 60 * 60 * 24));
        if (daysSinceUpdate > 30)
            stale.push({ id: issue.number, title: issue.title, url: issue.html_url || '#', daysSinceUpdate });
        if ((issue.comments || 0) > 8)
            highNoise.push({ id: issue.number, title: issue.title, url: issue.html_url || '#', comments: issue.comments });
    });

    return {
        stale: stale.sort((a, b) => b.daysSinceUpdate - a.daysSinceUpdate),
        highNoise: highNoise.sort((a, b) => b.comments - a.comments),
        total: issues.length,
        staleCount: stale.length,
        highNoiseCount: highNoise.length,
    };
};

const identifyGoodFirstIssues = (issues) => {
    if (!issues || issues.length === 0) return [];
    const goodIssues = [];
    issues.forEach((issue) => {
        const labels = issue.labels
            ? issue.labels.map((l) => (typeof l === 'string' ? l : l.name).toLowerCase())
            : [];
        const isLabeled = labels.some((l) =>
            ['good first', 'documentation', 'help wanted', 'beginner', 'easy', 'starter'].some((k) => l.includes(k))
        );
        const commentCount = issue.comments || 0;
        const bodyLength = issue.body ? issue.body.length : 0;

        if (isLabeled || (commentCount < 5 && bodyLength > 10 && bodyLength < 2500)) {
            let difficulty = 'Medium';
            if (labels.some((l) => l.includes('documentation')) || textIncludes(issue, ['typo', 'css', 'color', 'simple', 'readme']))
                difficulty = 'Easy';
            if (textIncludes(issue, ['architecture', 'database', 'migration', 'refactor', 'performance', 'optimization']))
                difficulty = 'Hard';
            goodIssues.push({
                id: issue.number,
                title: issue.title,
                difficulty,
                url: issue.html_url || '#',
                labels,
                comments: issue.comments || 0,
                body: firstLine(issue.body),
            });
        }
    });

    if (goodIssues.length === 0 && issues.length > 0) {
        return issues
            .filter((i) => (i.comments || 0) < 5)
            .slice(0, 5)
            .map((issue) => ({
                id: issue.number,
                title: issue.title,
                difficulty: 'Medium',
                url: issue.html_url || '#',
                labels: issue.labels ? issue.labels.map((l) => (typeof l === 'string' ? l : l.name).toLowerCase()) : [],
                comments: issue.comments || 0,
                body: firstLine(issue.body),
            }));
    }
    return goodIssues;
};

// ─────────────────────────────────────────────────────────────
// PING / NOISE MONITOR
// ─────────────────────────────────────────────────────────────
const analyzePingNoise = (pullRequests, issues) => {
    const mostPinged = (pullRequests || [])
        .filter((pr) => (pr.comments || 0) > 2)
        .sort((a, b) => (b.comments || 0) - (a.comments || 0))
        .slice(0, 5)
        .map((pr) => ({
            id: pr.number,
            title: pr.title,
            url: pr.html_url || '#',
            comments: pr.comments || 0,
            suggestedReply: generateStatusReply(pr),
        }));

    const highNoiseIssues = (issues || [])
        .filter((i) => (i.comments || 0) > 10)
        .sort((a, b) => b.comments - a.comments)
        .slice(0, 5)
        .map((i) => ({
            id: i.number,
            title: i.title,
            url: i.html_url || '#',
            comments: i.comments,
            suggestedReply: `Thanks for the continued interest! This issue is being tracked in our backlog. We'll provide an update as soon as the team has capacity. Please check our project roadmap for status.`,
        }));

    return { mostPinged, highNoiseIssues };
};

const generateStatusReply = (pr) => {
    const days = daysAgo(pr.created_at || new Date());
    if (days > 14)
        return `Hi! Thanks for your patience. This PR has been in our review queue for ${days} days. We're working through our backlog and will get to it this sprint. Hang tight!`;
    return `Thanks for contributing! This PR is in review. We'll provide feedback shortly. Please make sure CI checks are passing in the meantime.`;
};

// ─────────────────────────────────────────────────────────────
// HEALTH SCORE
// ─────────────────────────────────────────────────────────────
const calculateHealthScore = (repoData) => {
    const prs = repoData.pullRequests || [];
    const issues = repoData.issues || [];
    const commits = repoData.commits || [];

    let score = 100;
    const breakdown = {};

    // 1. PR review delay (avg days open)
    const prDays = prs.map((pr) => daysAgo(pr.created_at));
    const avgPrDelay = prDays.length > 0 ? prDays.reduce((a, b) => a + b, 0) / prDays.length : 0;
    breakdown.avgPrDelay = Math.round(avgPrDelay);
    if (avgPrDelay > 21) score -= 25;
    else if (avgPrDelay > 14) score -= 15;
    else if (avgPrDelay > 7) score -= 8;

    // 2. Merge conflict ratio
    const conflictCount = prs.filter((pr) => pr.mergeable === false || pr.mergeable_state === 'dirty').length;
    const conflictRatio = prs.length > 0 ? conflictCount / prs.length : 0;
    breakdown.conflictRatio = Math.round(conflictRatio * 100);
    if (conflictRatio > 0.3) score -= 20;
    else if (conflictRatio > 0.1) score -= 10;

    // 3. Stale issues
    const now = Date.now();
    const staleCount = issues.filter((i) => {
        const d = Math.floor((now - new Date(i.updated_at || i.created_at).getTime()) / (1000 * 60 * 60 * 24));
        return d > 30;
    }).length;
    const staleRatio = issues.length > 0 ? staleCount / issues.length : 0;
    breakdown.staleRatio = Math.round(staleRatio * 100);
    if (staleRatio > 0.5) score -= 25;
    else if (staleRatio > 0.2) score -= 12;

    // 4. PR volume (maintainer workload)
    breakdown.openPrCount = prs.length;
    if (prs.length > 50) score -= 20;
    else if (prs.length > 20) score -= 10;
    else if (prs.length > 10) score -= 5;

    // 5. Commit activity bonus
    const recentCommits = commits.filter((c) => {
        const d = c.commit?.author?.date || c.date;
        return d && daysAgo(d) <= 14;
    }).length;
    breakdown.recentCommits = recentCommits;
    if (recentCommits > 10) score += 5;

    const final = Math.max(0, Math.min(100, Math.floor(score)));
    const status = final >= 80 ? 'Healthy' : final >= 50 ? 'Moderate Risk' : 'Critical';
    const burnoutRisk = avgPrDelay > 14 || prs.length > 30 || staleRatio > 0.4;

    return { score: final, status, burnoutRisk, breakdown };
};

// ─────────────────────────────────────────────────────────────
// CONTRIBUTOR FEATURES
// ─────────────────────────────────────────────────────────────
const explainConflict = (pr) => {
    const hasConflict = pr.mergeable === false || pr.mergeable_state === 'dirty';
    if (!hasConflict) {
        return {
            hasConflict: false,
            message: 'No merge conflicts detected. Your branch is clean and ready to merge.',
        };
    }

    return {
        hasConflict: true,
        conflictingFiles: pr.conflictingFiles || ['[Unknown — fetch PR details for specifics]'],
        explanation:
            'A merge conflict means your branch and the base branch have both changed the same parts of the same files. Git cannot automatically decide which version to keep.',
        steps: [
            '1. Pull the latest base branch: `git fetch origin && git checkout main && git pull`',
            '2. Switch back to your PR branch: `git checkout your-branch-name`',
            '3. Merge main into your branch: `git merge main`',
            '4. Open conflicting files and look for <<<<<<, ======, and >>>>>>> markers',
            '5. Edit each conflict block — keep the code you want and delete the markers',
            '6. Stage resolved files: `git add <file>`',
            '7. Complete the merge: `git commit`',
            '8. Force-push to update your PR: `git push origin your-branch-name`',
        ],
    };
};

const generateContributorPRStatus = (pr) => {
    const days = daysAgo(pr.created_at || new Date());
    const hasConflict = pr.mergeable === false || pr.mergeable_state === 'dirty';

    let state = 'In Review';
    let explanation = '';
    let nextAction = '';

    if (hasConflict) {
        state = 'Blocked — Merge Conflict';
        explanation = `Your PR has a merge conflict that must be resolved before it can be reviewed or merged.`;
        nextAction = 'Resolve the merge conflict by rebasing or merging the base branch into your PR branch.';
    } else if (days > 21) {
        state = 'Awaiting Maintainer Attention';
        explanation = `Your PR has been open for ${days} days. This is likely due to maintainer workload rather than quality issues.`;
        nextAction = 'Politely ping the maintainer with a comment. Check if any CI tests are failing.';
    } else if (days > 7) {
        state = 'Under Review';
        explanation = `Your PR has been open for ${days} days. The maintainer may be reviewing it or waiting on other PRs first.`;
        nextAction = 'Ensure all CI checks pass. Respond promptly to any review comments.';
    } else {
        state = 'Recently Submitted';
        explanation = `Your PR was submitted ${days} day(s) ago. Maintainers typically respond within a few days to a week.`;
        nextAction = "Wait for CI results and the first review comment. Don't ping yet — give the team time.";
    }

    return { state, explanation, nextAction, conflictInfo: explainConflict(pr) };
};

const reviewCodePreSubmission = (code) => {
    if (!code || code.trim().length === 0) {
        return {
            improvements: ['No code provided for review.'],
            commitMessage: 'chore: update codebase',
            score: 0,
        };
    }

    const improvements = [];
    if (code.includes('console.log')) improvements.push('Remove console.log debug statements before submitting.');
    if (code.includes('TODO') || code.includes('FIXME')) improvements.push('Address or create issues for TODO/FIXME comments.');
    if (code.includes('var ')) improvements.push("Replace 'var' with 'const' or 'let' for modern JS compatibility.");
    if (code.includes(' == ') || code.includes(' != ')) improvements.push("Use strict equality (===) to avoid type coercion bugs.");
    if (code.includes('eval(')) improvements.push('Remove eval() — it is a critical security vulnerability.');
    if (code.includes('catch') && !code.includes('throw') && !code.includes('console'))
        improvements.push('Avoid silent catch blocks — at minimum, log the error or re-throw it.');
    if (improvements.length === 0) improvements.push('Code looks good! No major issues detected by static analysis.');

    const lines = code.split('\n').filter((l) => l.trim());
    const hasFunctions = code.includes('function') || code.includes('=>');
    const hasClass = code.includes('class ');

    let commitMsg = 'feat: update implementation';
    if (code.includes('fix') || code.includes('bug')) commitMsg = 'fix: resolve identified bug';
    if (hasClass) commitMsg = 'refactor: update class structure';
    if (code.includes('test') || code.includes('spec')) commitMsg = 'test: add/update tests';

    const score = Math.max(0, 100 - improvements.length * 15);
    return { improvements, commitMessage: commitMsg, score, lines: lines.length };
};

module.exports = {
    analyzePRs,
    generateRoadmap,
    analyzeIssues,
    identifyGoodFirstIssues,
    calculateHealthScore,
    analyzePingNoise,
    generateContributorPRStatus,
    reviewCodePreSubmission,
    explainConflict,
};
