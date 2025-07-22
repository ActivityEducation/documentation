
import type {ReactNode} from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
// In a real React project, you would import a CSS Module like this:
import styles from './issues.module.css'; // Importing styles from the new module file


// Main App component
function Issues() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const repoOwner = 'ActivityEducation'; // Hardcoded repository owner
  const [repoName, setRepoName] = useState('backend');    // Default repository, now a select option
  const [filterState, setFilterState] = useState('open'); // Default state: open issues

  // Function to fetch issues from GitHub API
  const fetchIssues = async () => {
    setLoading(true); // Set loading state to true before fetching
    setError(null);   // Clear any previous errors

    try {
      // Construct the GitHub API URL for issues
      const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/issues`;
      
      // Make the GET request to the GitHub API using Axios
      const response = await axios.get(apiUrl, {
        params: {
          state: filterState,   // Filter issues by 'open', 'closed', or 'all'
          per_page: 10,         // Limit to 10 issues per page
          sort: 'created',      // Sort by creation date
          direction: 'desc'     // Sort in descending order (newest first)
        },
        // Optional: Add a Personal Access Token for higher rate limits or private repos.
        // Replace 'YOUR_GITHUB_PERSONAL_ACCESS_TOKEN' with an actual token if needed.
        // For public repositories, a token is generally not required but can help with rate limits.
        // headers: {
        //   Authorization: `Bearer YOUR_GITHUB_PERSONAL_ACCESS_TOKEN`,
        // },
      });
      setIssues(response.data); // Update issues state with fetched data
    } catch (err) {
      console.error("Error fetching issues:", err);
      // Set error message for user display
      setError('Failed to fetch issues. Please check the repository owner, name, or your network connection. You might also be hitting GitHub API rate limits.');
      setIssues([]); // Clear issues on error to prevent displaying old data
    } finally {
      setLoading(false); // Set loading state to false after fetching (success or error)
    }
  };

  // useEffect hook to trigger fetchIssues when relevant state variables change
  useEffect(() => {
    // Only fetch if both repository owner and name are provided
    // repoOwner is now hardcoded, so we only need to check repoName
    if (repoName) {
      fetchIssues();
    }
  }, [repoName, filterState]); // Dependencies: re-run effect if these change

  // Event handler for repository name select change
  const handleRepoChange = (event) => {
    setRepoName(event.target.value);
  };

  // Event handler for issue state filter change
  const handleFilterChange = (event) => {
    setFilterState(event.target.value);
  };

  // Event handler for form submission
  const handleSubmit = (event) => {
    event.preventDefault(); // Prevent default browser form submission behavior
    fetchIssues(); // Manually trigger issue fetching
  };

  return (
    // Main container for the application with responsive padding and background
    <div className={styles.appContainer}>
      {/* Header section with title and input form */}
      <header className={styles.appHeader}>
        <h1 className={styles.appTitle}>Known Issues</h1>
        
        {/* Form for repository input and issue state filter */}
        <form onSubmit={handleSubmit} className={styles.repoForm}>
          {/* Removed repository owner input */}
          <label className={styles.formLabel}>
            {/* <span className={styles.labelText}>Repository Name:</span> */}
            <select
              value={repoName}
              onChange={handleRepoChange}
              className={styles.selectField}
            >
              <option value="backend">backend</option>
              <option value="documentation">documentation</option>
            </select>
          </label>
          <label className={styles.formLabel}>
            {/* <span className={styles.labelText}>Issue State:</span> */}
            <select
              value={filterState}
              onChange={handleFilterChange}
              className={styles.selectField}
            >
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="all">All</option>
            </select>
          </label>
          <button
            type="submit"
            className={styles.submitButton}
          >
            Load Issues
          </button>
        </form>
      </header>

      {/* Main content area for displaying issues */}
      <main className={styles.mainContent}>
        {/* Loading indicator */}
        {loading && <p className={styles.loadingMessage}>Loading issues...</p>}
        
        {/* Error message display */}
        {error && (
          <div className={styles.errorMessageContainer} role="alert">
            <strong className={styles.errorMessageBold}>Error!</strong>
            <span className={styles.errorMessageText}>{error}</span>
          </div>
        )}

        {/* Message for no issues found */}
        {!loading && !error && issues.length === 0 && (
          <p className={styles.noIssuesMessage}>No issues found for this project with the selected filter.</p>
        )}

        {/* List of issues */}
        {!loading && !error && issues.length > 0 && (
          <ul className={styles.issuesList}>
            {issues.map((issue) => (
              <li key={issue.id} className={styles.issueItem}>
                <div>
                  <h2 className={styles.issueTitle}>
                    <a
                      href={issue.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.issueLink}
                    >
                      #{issue.number}: {issue.title}
                    </a>
                  </h2>
                  <p className={styles.issueStateText}>
                    State: <span className={`${styles.issueStateBadge} ${issue.state === 'open' ? styles.issueStateOpen : styles.issueStateClosed}`}>
                      {issue.state}
                    </span>
                  </p>
                  <p className={styles.issueCreated}>
                    Created: {new Date(issue.created_at).toLocaleDateString()}
                  </p>
                  {issue.assignee && (
                    <p className={styles.issueAssignee}>
                      Assignee: <span className={styles.issueAssigneeName}>{issue.assignee.login}</span>
                    </p>
                  )}
                </div>
                {issue.labels && issue.labels.length > 0 && (
                  <div className={styles.issueLabelsContainer}>
                    {issue.labels.map((label) => (
                      <span
                        key={label.id}
                        className={styles.issueLabel}
                        // Dynamically set background color based on label color from API
                        style={{ backgroundColor: `#${label.color}`, color: '#333' }} 
                      >
                        {label.name}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

export default function IssuesPage(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`Hello from ${siteConfig.title}`}
      description="Description will go into a meta tag in <head />">
      <main>
        <Issues />
      </main>
    </Layout>
  );
}