require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { getRepoData } = require('./services/github');
const {
  analyzePRs,
  generateRoadmap,
  analyzeIssues,
  identifyGoodFirstIssues,
  calculateHealthScore,
  analyzePingNoise,
  generateContributorPRStatus,
  reviewCodePreSubmission,
} = require('./services/ai');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────────────────────────
// MAIN ANALYSIS ENDPOINT  GET /api/analyze/:owner/:repo
// Returns the full maintainer + contributor data package
// ─────────────────────────────────────────────────────────────
app.get('/api/analyze/:owner/:repo', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const repoData = await getRepoData(owner, repo);

    if (!repoData) {
      return res.status(404).json({ error: 'Repository not found or access denied.' });
    }

    // ── AI Processing ──────────────────────────────────────────
    const prReviews = analyzePRs(repoData.pullRequests);
    const roadmap = generateRoadmap(repoData.issues);
    const issueMetrics = analyzeIssues(repoData.issues);
    const goodFirstIssues = identifyGoodFirstIssues(repoData.issues);
    const healthScore = calculateHealthScore(repoData);
    const pingMonitor = analyzePingNoise(repoData.pullRequests, repoData.issues);

    // Contributor Panel — first PR as "my PR" simulation
    const firstPR = repoData.pullRequests[0] || null;
    const myPrStatus = firstPR ? generateContributorPRStatus(firstPR) : null;

    res.json({
      overview: {
        name: `${owner}/${repo}`,
        stars: repoData.overview.stargazers_count || 0,
        forks: repoData.overview.forks_count || 0,
        openPrs: repoData.trueCounts?.openPrs ?? repoData.pullRequests.length,
        openIssues: repoData.trueCounts?.openIssues ?? repoData.issues.length,
        description: repoData.overview.description || null,
        language: repoData.overview.language || null,
      },
      healthScore,
      prReviews,
      roadmap,
      issueMetrics,
      goodFirstIssues,
      pingMonitor,
      myPrStatus,
      contributors: (repoData.contributors || []).map((c) => ({
        login: c.login,
        contributions: c.contributions,
        avatar: c.avatar_url,
        url: c.html_url,
      })),
      isMock: repoData.isMock || false,
      rateLimited: repoData.rateLimited || false,
    });

  } catch (error) {
    console.error('Error analyzing repository:', error.message);
    res.status(500).json({ error: 'An error occurred while analyzing the repository.' });
  }
});

// ─────────────────────────────────────────────────────────────
// PRE-SUBMISSION CODE REVIEW  POST /api/review-code
// Body: { code: "..." }
// ─────────────────────────────────────────────────────────────
app.post('/api/review-code', (req, res) => {
  const { code } = req.body;
  if (typeof code !== 'string') {
    return res.status(400).json({ error: 'Field "code" (string) is required.' });
  }
  res.json(reviewCodePreSubmission(code));
});

app.listen(PORT, () => {
  console.log(`✅ RepoPilot AI backend running on http://localhost:${PORT}`);
});
