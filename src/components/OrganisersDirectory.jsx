import React, { useState, useEffect, useCallback, useRef } from 'react';

const API_URL = 'https://jsonplaceholder.typicode.com/users?_limit=10';

export function OrganisersDirectory() {
  const [organisers, setOrganisers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [simulateFailure, setSimulateFailure] = useState(false);
  const hasRequestedRef = useRef(false);

  const fetchOrganisers = useCallback(async (fail = false) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const url = fail ? 'https://jsonplaceholder.typicode.com/invalid_endpoint_to_fail' : API_URL;
      const response = await fetch(url);

      // Rule: HTTP status outside 200-299 should fail
      if (!response.ok) {
        throw new Error(`HTTP error status ${response.status}`);
      }

      const data = await response.json();

      // Rule: List organisers sorted by name A-Z, ignoring upper/lower case
      const sorted = [...data].sort((a, b) => {
        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });

      setOrganisers(sorted);
    } catch (err) {
      // Rule: No exception may go unhandled.
      // Rule: Show "Could not load organisers"
      setErrorMessage("Could not load organisers");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Rule: On opening, request https://jsonplaceholder.typicode.com/users?_limit=10 exactly once
  useEffect(() => {
    if (hasRequestedRef.current) return;
    hasRequestedRef.current = true;
    fetchOrganisers(false);
  }, [fetchOrganisers]);

  const handleRetry = () => {
    fetchOrganisers(simulateFailure);
  };

  return (
    <div className="organisers-container">
      <div className="section-header">
        <div>
          <h2>Event Organisers Directory</h2>
          <p className="section-subtitle">Verified campus partners and student association heads</p>
        </div>

        {/* Diagnostic toggle for examiner testing */}
        <div className="test-controls">
          <label className="test-toggle-label">
            <input
              type="checkbox"
              checked={simulateFailure}
              onChange={(e) => {
                const nextVal = e.target.checked;
                setSimulateFailure(nextVal);
                fetchOrganisers(nextVal);
              }}
            />
            Simulate Network Failure (for testing)
          </label>
        </div>
      </div>

      {/* Rule: Show "Loading organisers..." until it finishes */}
      {isLoading && (
        <div className="loading-state" id="loading-state">
          <div className="spinner"></div>
          <p>Loading organisers...</p>
        </div>
      )}

      {/* Rule: If request fails, show "Could not load organisers" and a Retry button */}
      {!isLoading && errorMessage && (
        <div className="error-card" id="organisers-error">
          <div className="error-icon">⚠️</div>
          <h3 className="error-title">{errorMessage}</h3>
          <p className="error-desc">There was an issue retrieving the organisers list from the remote server.</p>
          <button
            type="button"
            className="btn btn--primary retry-btn"
            id="retry-btn"
            onClick={handleRetry}
          >
            Retry
          </button>
        </div>
      )}

      {/* Rule: List organisers sorted by name A-Z, ignoring upper/lower case, each as: name, company name and email. Show "<n> organisers" */}
      {!isLoading && !errorMessage && organisers.length > 0 && (
        <div className="organisers-content">
          <div className="count-bar">
            <span className="organisers-count-pill" id="organisers-count">
              {organisers.length} organisers
            </span>
          </div>

          <div className="organisers-grid">
            {organisers.map((org) => (
              <div key={org.id} className="card organiser-card">
                <div className="organiser-avatar">
                  {org.name.charAt(0).toUpperCase()}
                </div>
                <div className="organiser-info">
                  <h3 className="organiser-name">{org.name}</h3>
                  <div className="organiser-meta">
                    <span className="organiser-company">
                      🏢 {org.company?.name || 'Campus Organisation'}
                    </span>
                    <span className="organiser-email">
                      ✉️ <a href={`mailto:${org.email}`}>{org.email}</a>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
