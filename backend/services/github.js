const axios = require('axios');

// Fallback Mock Data
const mockRepoData = {
    overview: {
        stargazers_count: 1250,
        forks_count: 340,
    },
    pullRequests: [
        {
            number: 101,
            title: "Feat: Add user authentication via OAuth",
            user: "alice",
            diff: "++ const user = login();\n-- const user = null;",
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            number: 102,
            title: "Fix: Null pointer exception in checkout flow",
            user: "bob",
            diff: "++ if (cart !== null) { checkout(cart); }",
            created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        }
    ],
    issues: [
        {
            number: 42,
            title: "Button color is incorrect on hover",
            body: "The primary button should be blue on hover, but it remains grey.",
            labels: [{ name: "bug" }, { name: "good first issue" }],
            comments: 1,
            created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
        },
        {
            number: 45,
            title: "Implement Dark Mode",
            body: "We need dark mode support across the entire app.",
            labels: [{ name: "enhancement" }],
            comments: 5,
            created_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
        },
        {
            number: 50,
            title: "Migrate to new database schema",
            body: "The old schema does not support multi-tenant architecture. We need to plan a migration.",
            labels: [{ name: "architecture" }, { name: "epic" }],
            comments: 12,
            created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
        }
    ],
    commits: Array.from({ length: 45 }, (_, i) => ({ sha: `abc${i}`, date: new Date().toISOString() })),
    contributors: [{ login: "alice", contributions: 50 }, { login: "bob", contributions: 30 }]
};

async function getRepoData(owner, repo) {
    const headers = process.env.GITHUB_TOKEN ? { Authorization: `token ${process.env.GITHUB_TOKEN}` } : {};

    try {
        // Attempt to fetch real data
        console.log(`Fetching data for ${owner}/${repo}...`);
        const overviewRes = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, { headers });
        const prsRes = await axios.get(`https://api.github.com/repos/${owner}/${repo}/pulls?state=open&per_page=10`, { headers });

        // Fetch diffs for the top 5 PRs
        const prsWithDiffs = await Promise.all(
            prsRes.data.slice(0, 5).map(async (pr) => {
                try {
                    const diffRes = await axios.get(pr.url, {
                        headers: {
                            ...headers,
                            Accept: 'application/vnd.github.v3.diff'
                        }
                    });
                    return { ...pr, diff: diffRes.data };
                } catch (err) {
                    console.warn(`Could not fetch diff for PR #${pr.number}`);
                    return { ...pr, diff: null };
                }
            })
        );
        const fullPrs = [...prsWithDiffs, ...prsRes.data.slice(5)];

        // Using the Search API to fetch only actual issues (excluding PRs)
        const searchQuery = encodeURIComponent(`repo:${owner}/${repo} is:issue is:open`);
        const issuesRes = await axios.get(`https://api.github.com/search/issues?q=${searchQuery}&per_page=100`, { headers });
        const commitsRes = await axios.get(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=50`, { headers });
        const contributorsRes = await axios.get(`https://api.github.com/repos/${owner}/${repo}/contributors?per_page=10&anon=false`, { headers });

        // The Search API items are inside the 'items' property and don't include PRs
        const pureIssues = issuesRes.data.items || [];

        // Fetch true counts for open issues and PRs
        const prCountSearch = encodeURIComponent(`repo:${owner}/${repo} is:pr is:open`);
        const prCountRes = await axios.get(`https://api.github.com/search/issues?q=${prCountSearch}&per_page=1`, { headers });
        const issueCountSearch = encodeURIComponent(`repo:${owner}/${repo} is:issue is:open`);
        const issueCountRes = await axios.get(`https://api.github.com/search/issues?q=${issueCountSearch}&per_page=1`, { headers });

        return {
            overview: overviewRes.data,
            pullRequests: fullPrs,
            issues: pureIssues,
            commits: commitsRes.data,
            contributors: contributorsRes.data,
            trueCounts: {
                openPrs: prCountRes.data.total_count,
                openIssues: issueCountRes.data.total_count
            }
        };

    } catch (error) {
        if (error.response && error.response.status === 403) {
            console.warn("GitHub API rate limit exceeded. Falling back to mock data.");
            return { ...mockRepoData, isMock: true, rateLimited: true };
        }
        if (error.response && error.response.status === 404) {
            console.warn("Repository not found. Falling back to mock data for demo.");
            return { ...mockRepoData, isMock: true, rateLimited: false };
        }
        console.error("Error fetching from GitHub:", error.message);
        return { ...mockRepoData, isMock: true, rateLimited: false }; // Default to mock data for robust hackathon demo
    }
}

module.exports = { getRepoData };
