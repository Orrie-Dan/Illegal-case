import React, { useEffect } from 'react';

function App() {
  const handleReset = () => {
    if (window.APP && typeof window.APP.resetDashboard === 'function') {
      window.APP.resetDashboard();
    }
  };

  const handleFiltersChange = () => {
    if (window.APP && typeof window.APP.applyFilters === 'function') {
      window.APP.applyFilters();
    }
  };

  const handleSetTimeMode = (mode, e) => {
    if (window.APP && typeof window.APP.setTimeMode === 'function') {
      window.APP.setTimeMode(mode, e.currentTarget);
    }
  };

  const handleCloseModal = (id) => {
    if (window.APP && typeof window.APP.closeModal === 'function') {
      window.APP.closeModal(id);
    }
  };

  const handlePickDec = (code) => {
    if (window.APP && typeof window.APP.pickDec === 'function') {
      window.APP.pickDec(code);
    }
  };

  const handleToggleAct = (key, el) => {
    if (window.APP && typeof window.APP.toggleAct === 'function') {
      window.APP.toggleAct(key, el);
    }
  };

  const handleSaveDecision = () => {
    if (window.APP && typeof window.APP.saveDecision === 'function') {
      window.APP.saveDecision();
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && window.APP && typeof window.APP.applyFilters === 'function') {
      window.APP.applyFilters();
    }
  };

  useEffect(() => {
    // React renders static structure; data wiring is handled by APP in Case_Management_Dashboard_v2.js
  }, []);

  return (
    <div className="container">
      {/* HEADER */}
      <header className="header fade-in">
        <div className="header-left">
          <div className="brand-icon">
            <span className="icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 8v14h20V8L12 2z" />
                <path d="M8 12v6h3v-6M13 12v6h3v-6" />
                <path d="M8 10.5a1.5 1.5 0 0 1 3 0V12H8v-1.5z" />
                <path d="M13 10.5a1.5 1.5 0 0 1 3 0V12h-3v-1.5z" />
              </svg>
            </span>
          </div>
          <div className="brand-text">
            <h1 className="page-title">Illegal Case Management</h1>
            <p className="brand-subtitle">Bugesera District — Inspection Hub</p>
          </div>
        </div>
        <div className="header-right">
          <div className="live-indicator">
            <div className="live-dot"></div>
            <span className="live-text">Live</span>
          </div>
          <div className="search-box">
            <span className="icon icon-sm" style={{ color: 'var(--text-muted)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </span>
            <input
              type="search"
              id="global-search"
              placeholder="Search Case ID, UPI, sector…"
              onKeyDown={handleSearchKeyDown}
            />
          </div>
          <button className="btn btn-ghost" onClick={handleReset}>
            <span className="icon icon-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </span>
            Reset
          </button>
        </div>
      </header>

      {/* FILTER BAR */}
      <div className="filter-bar fade-in d1">
        <span className="filter-bar-label">
          <span className="icon icon-sm" style={{ color: 'var(--text-muted)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="14" y2="12" />
              <line x1="4" y1="18" x2="9" y2="18" />
              <polygon points="22 4 16 8 16 16 22 20 22 4" />
            </svg>
          </span>
          <span className="filter-label">FILTERS</span>
        </span>
        <select className="filter-select filter-select-primary" id="filter-source" onChange={handleFiltersChange}>
          <option value="">All case sources</option>
        </select>
        <select className="filter-select" id="filter-verification" onChange={handleFiltersChange}>
          <option value="">All verification statuses</option>
          <option value="verified">Verified</option>
          <option value="not_verified">Not Verified</option>
          <option value="under_review">Under Review</option>
        </select>
        <select className="filter-select" id="filter-action" onChange={handleFiltersChange}>
          <option value="">All committee actions</option>
        </select>
        <select className="filter-select" id="filter-sector" onChange={handleFiltersChange}>
          <option value="">All sectors</option>
        </select>
        <select className="filter-select" id="filter-cell" onChange={handleFiltersChange}>
          <option value="">All cells</option>
        </select>
        <select className="filter-select" id="filter-visitstatus" onChange={handleFiltersChange}>
          <option value="">All visit statuses</option>
        </select>
        <input type="date" id="filter-from" className="filter-date" onChange={handleFiltersChange} />
        <span className="filter-to-sep">to</span>
        <input type="date" id="filter-to" className="filter-date" onChange={handleFiltersChange} />
        <div className="filter-sep"></div>
        <div className="active-chips" id="active-chips"></div>
      </div>

      {/* KPI ROW */}
      <div className="kpi-row fade-in d2">
        <div className="kpi kpi-total">
          <div className="kpi-top">
            <div className="kpi-icon-wrap" style={{ background: '#EEF2FF', color: '#4F46E5' }}>
              <span className="icon icon-sm">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M7 10h5M7 14h10M7 18h7" />
                </svg>
              </span>
            </div>
            <span className="kpi-label">Total Cases</span>
          </div>
          <div className="kpi-val" id="kpi-total-cases">--</div>
          <div className="kpi-sub">Cases recorded</div>
          <div className="kpi-bar" style={{ background: '#0F7173' }}></div>
        </div>
        <div className="kpi kpi-verified">
          <div className="kpi-top">
            <div className="kpi-icon-wrap" style={{ background: '#ECFDF3', color: '#16A34A' }}>
              <span className="icon icon-sm">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 12l2.5 2.5L16 9" />
                </svg>
              </span>
            </div>
            <span className="kpi-label">Verified</span>
          </div>
          <div className="kpi-val" id="kpi-verified">--</div>
          <div className="kpi-sub">Cases verified by committee</div>
          <div className="kpi-bar" style={{ background: '#15803d' }}></div>
        </div>
        <div className="kpi kpi-unverified">
          <div className="kpi-top">
            <div className="kpi-icon-wrap" style={{ background: '#FEF2F2', color: '#B91C1C' }}>
              <span className="icon icon-sm">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </span>
            </div>
            <span className="kpi-label">Not Verified</span>
          </div>
          <div className="kpi-val" id="kpi-unverified">--</div>
          <div className="kpi-sub">Cases awaiting verification</div>
          <div className="kpi-bar" style={{ background: '#b91c1c' }}></div>
        </div>
        <div className="kpi kpi-underreview">
          <div className="kpi-top">
            <div className="kpi-icon-wrap" style={{ background: '#FEF3C7', color: '#B45309' }}>
              <span className="icon icon-sm">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 7v5l3 3" />
                </svg>
              </span>
            </div>
            <span className="kpi-label">Under Review</span>
          </div>
          <div className="kpi-val" id="kpi-under-review">--</div>
          <div className="kpi-sub">Cases pending committee decision</div>
          <div className="kpi-bar"></div>
        </div>
      </div>

      {/* SECONDARY KPI ROW */}
      <div className="kpi-row kpi-row-sub fade-in d2">
        <div className="kpi">
          <div className="kpi-top">
            <div className="kpi-icon-wrap" style={{ background: '#EFF6FF', color: '#3B82F6' }}>
              <span className="rwf-badge">RWF</span>
            </div>
            <span className="kpi-label">Fine</span>
          </div>
          <div className="kpi-val" id="kpi-fine">--</div>
          <div className="kpi-sub">Cases with monetary penalty</div>
        </div>
        <div className="kpi">
          <div className="kpi-top">
            <div className="kpi-icon-wrap" style={{ background: '#FEE2E2', color: '#DC2626' }}>
              <span className="icon icon-sm">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                </svg>
              </span>
            </div>
            <span className="kpi-label">Demolished</span>
          </div>
          <div className="kpi-val" id="kpi-demolished">--</div>
          <div className="kpi-sub">Cases required to be demolished</div>
        </div>
        <div className="kpi">
          <div className="kpi-top">
            <div className="kpi-icon-wrap" style={{ background: '#FEF3C7', color: '#F59E0B' }}>
              <span className="icon icon-sm">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                </svg>
              </span>
            </div>
            <span className="kpi-label">New permit</span>
          </div>
          <div className="kpi-val" id="kpi-newpermit">--</div>
          <div className="kpi-sub">Cases requiring new permit</div>
        </div>
        <div className="kpi">
          <div className="kpi-top">
            <div className="kpi-icon-wrap" style={{ background: '#DCFCE7', color: '#16A34A' }}>
              <span className="icon icon-sm">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
              </span>
            </div>
            <span className="kpi-label">Renew permit</span>
          </div>
          <div className="kpi-val" id="kpi-renewed">--</div>
          <div className="kpi-sub">Cases requiring permit renewal</div>
        </div>
      </div>

      {/* MIDDLE SECTION: MAP + CASES TABLE */}
      <div className="middle-section fade-in d3">
        <div className="middle-grid">
          {/* LEFT: MAP */}
          <div className="panel map-panel">
            <div className="panel-head">
              <div className="panel-title">
                <span className="icon icon-sm" style={{ color: '#b91c1c' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                    <line x1="8" y1="2" x2="8" y2="18" />
                    <line x1="16" y1="6" x2="16" y2="22" />
                  </svg>
                </span>
                Spatial Distribution — Non-Compliance
              </div>
              <span className="panel-badge" id="map-count" style={{ display: 'none' }}></span>
            </div>
            <div id="mapView" className="map-wrap">
              <div className="map-legend" id="map-legend">
                <div className="legend-title">Legend</div>
                <div className="legend-row">
                  <div className="legend-dot" style={{ background: '#b91c1c' }}></div>
                  <span>Non-compliant case</span>
                </div>
                <div className="legend-row" id="legend-sel" style={{ display: 'none' }}>
                  <div className="legend-dot" style={{ background: '#0F7173' }}></div>
                  <span>Selected</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: CASES TABLE */}
          <div className="panel">
            <div className="panel-head">
              <div className="panel-title">
                <span className="icon icon-sm" style={{ color: 'var(--accent)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="16" rx="2" />
                    <path d="M9 8h10M9 12h10M9 16h6M5 8h.01M5 12h.01M5 16h.01" />
                  </svg>
                </span>
                Cases Register — Non-Compliant
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <label htmlFor="table-sort-by" className="filter-label" style={{ marginRight: 4 }}>
                  Sort by
                </label>
                <select
                  id="table-sort-by"
                  className="filter-select"
                  style={{ minWidth: 180 }}
                  onChange={() => window.APP && window.APP.applyFilters()}
                >
                  <option value="date_asc">Date (oldest first)</option>
                  <option value="date_desc">Date (newest first)</option>
                  <option value="state">Verification status</option>
                  <option value="id_asc">Case ID (A–Z)</option>
                  <option value="id_desc">Case ID (Z–A)</option>
                  <option value="sector">Sector (A–Z)</option>
                  <option value="upi">UPI (A–Z)</option>
                  <option value="visitstatus">Visit status</option>
                </select>
                <span className="panel-badge" id="table-count">
                  0
                </span>
              </div>
            </div>
            <div className="cases-table-wrap">
              <table className="cases-table">
                <thead>
                  <tr>
                    <th>Case ID</th>
                    <th>UPI</th>
                    <th>Visit Status</th>
                    <th>Verification</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody id="cases-tbody">
                  <tr>
                    <td
                      colSpan="5"
                      style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}
                    >
                      Loading data…
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* CHARTS ROW */}
      <div className="charts-row fade-in d4">
        {/* Pie: Committee Action */}
        <div className="chart-panel">
          <div className="chart-head">
            <div className="chart-head-center">
              <div className="chart-title">
                <span className="icon icon-sm" style={{ color: 'var(--accent)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
                    <path d="M22 12A10 10 0 0 0 12 2v10z" />
                  </svg>
                </span>
                Committee Action Breakdown
              </div>
            </div>
          </div>
          <div className="chart-wrap">
            <canvas id="pieChart"></canvas>
          </div>
        </div>

        {/* Sector Verification Chart */}
        <div className="chart-panel">
          <div className="chart-head">
            <div className="chart-head-center">
              <div className="chart-title">
                <span className="icon icon-sm" style={{ color: '#f59e0b' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <path d="M3 9h18M3 15h18M9 3v18" />
                  </svg>
                </span>
                Verification Status per Sector
              </div>
            </div>
            <div className="chart-head-controls-row">
              <div className="chart-controls">
                <select id="chart-loc-mode" className="chart-select">
                  <option value="sector">By sector</option>
                  <option value="cell">By cell</option>
                </select>
                <select id="chart-loc-ver" className="chart-select">
                  <option value="">All verification</option>
                  <option value="verified">Verified</option>
                  <option value="not_verified">Unverified</option>
                  <option value="under_review">Under Review</option>
                </select>
                <select id="chart-loc-act" className="chart-select">
                  <option value="">All actions</option>
                  <option value="Fine">Fine</option>
                  <option value="Demolish">Demolish</option>
                  <option value="New Permit">New permit</option>
                  <option value="Renew Permit">Renew permit</option>
                  <option value="__none">No action</option>
                </select>
              </div>
            </div>
          </div>
          <div className="chart-wrap">
            <canvas id="sectorChart"></canvas>
          </div>
        </div>

        {/* Line/Bar: Verified per Week/Month */}
        <div className="chart-panel">
          <div className="chart-head">
            <div className="chart-head-center">
              <div className="chart-title">
                <span className="icon icon-sm" style={{ color: '#22c55e' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </span>
                Verified Cases Over Time
              </div>
            </div>
            <div className="chart-head-controls-row">
              <div className="chart-controls">
                <div className="tab-group">
                  <button className="ctab active" onClick={(e) => handleSetTimeMode('week', e)}>
                    Week
                  </button>
                  <button className="ctab" onClick={(e) => handleSetTimeMode('month', e)}>
                    Month
                  </button>
                </div>
                <select id="chart-time-ver" className="chart-select">
                  <option value="verified">Verified only</option>
                  <option value="">All statuses</option>
                </select>
                <select id="chart-time-act" className="chart-select">
                  <option value="">All actions</option>
                  <option value="Fine">Fine</option>
                  <option value="Demolish">Demolish</option>
                  <option value="New Permit">New permit</option>
                  <option value="Renew Permit">Renew permit</option>
                  <option value="__none">No action</option>
                </select>
              </div>
            </div>
          </div>
          <div className="chart-wrap">
            <canvas id="lineChart"></canvas>
          </div>
        </div>
      </div>

      {/* VIEW MODAL */}
      <div className="modal-overlay" id="view-modal">
        <div className="modal">
          <div className="modal-head">
            <div className="modal-title">
              <span className="icon" style={{ color: 'var(--accent)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </span>{' '}
              Case Details
            </div>
            <button className="modal-close" onClick={() => handleCloseModal('view-modal')}>
              ✕
            </button>
          </div>
          <div className="modal-body" id="view-body"></div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={() => handleCloseModal('view-modal')}>
              Close
            </button>
            <button className="btn btn-committee" id="view-cmt-btn">
              <span className="icon icon-sm">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
              </span>{' '}
              Committee Action
            </button>
          </div>
        </div>
      </div>

      {/* COMMITTEE MODAL */}
      <div className="modal-overlay" id="cmt-modal">
        <div className="modal modal-sm">
          <div className="modal-head">
            <div className="modal-title">
              <span className="icon" style={{ color: 'var(--accent)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </span>{' '}
              Committee Decision
            </div>
            <button className="modal-close" onClick={() => handleCloseModal('cmt-modal')}>
              ✕
            </button>
          </div>
          <div className="modal-body">
            <div className="case-info-card" id="cmt-case-info"></div>
            <div className="auto-note" id="auto-note" style={{ display: 'none' }}>
              <span className="icon icon-sm">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </span>
              Verification will be automatically set to <strong>Verified</strong>.
            </div>

            {/* DECISION RADIOS */}
            <div className="dec-radios">
              <div className="dec-label" id="dlbl-c" onClick={() => handlePickDec('c')}>
                <div className="dec-icon">
                  <span className="icon icon-sm" style={{ color: '#22c55e' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </span>
                </div>
                <span>Complaint — Case Closed</span>
                <div className="dec-radio" id="dradio-c"></div>
              </div>
              <div className="dec-label" id="dlbl-nc" onClick={() => handlePickDec('nc')}>
                <div className="dec-icon">
                  <span className="icon icon-sm" style={{ color: '#ef4444' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                  </span>
                </div>
                <span>Not Complaint — Action Required</span>
                <div className="dec-radio" id="dradio-nc"></div>
              </div>
              <div className="dec-label" id="dlbl-rv" onClick={() => handlePickDec('rv')}>
                <div className="dec-icon">
                  <span className="icon icon-sm" style={{ color: '#f59e0b' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="23 4 23 10 17 10" />
                      <polyline points="1 20 1 14 7 14" />
                      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                    </svg>
                  </span>
                </div>
                <span>Review — Send Back to Inspector</span>
                <div className="dec-radio" id="dradio-rv"></div>
              </div>
            </div>

            {/* Action panel (for not complaint) */}
            <div id="action-panel" style={{ display: 'none' }}>
              <div className="ag">
                <label>
                  Enforcement Actions{' '}
                  <span
                    style={{
                      fontWeight: 400,
                      textTransform: 'none',
                      fontSize: '10px',
                      color: 'var(--text-muted)'
                    }}
                  >
                    (select all that apply)
                  </span>
                </label>
                <div className="action-checks">
                  <div className="ach" id="ach-fine" onClick={(e) => handleToggleAct('fine', e.currentTarget)}>
                    <input type="checkbox" id="chk-fine" onChange={(e) => e.stopPropagation()} />
                    <span className="icon icon-sm" style={{ color: '#3b82f6' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="2" x2="12" y2="22" />
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                    </span>
                    Fine
                  </div>
                  <div className="ach" id="ach-demo" onClick={(e) => handleToggleAct('demo', e.currentTarget)}>
                    <input type="checkbox" id="chk-demo" onChange={(e) => e.stopPropagation()} />
                    <span className="icon icon-sm" style={{ color: '#ef4444' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      </svg>
                    </span>
                    Demolish
                  </div>
                  <div className="ach" id="ach-new" onClick={(e) => handleToggleAct('new', e.currentTarget)}>
                    <input type="checkbox" id="chk-new" onChange={(e) => e.stopPropagation()} />
                    <span className="icon icon-sm" style={{ color: '#f59e0b' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="12" y1="18" x2="12" y2="12" />
                      </svg>
                    </span>
                    New Permit
                  </div>
                  <div className="ach" id="ach-renew" onClick={(e) => handleToggleAct('renew', e.currentTarget)}>
                    <input type="checkbox" id="chk-renew" onChange={(e) => e.stopPropagation()} />
                    <span className="icon icon-sm" style={{ color: '#22c55e' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
                      </svg>
                    </span>
                    Renew Permit
                  </div>
                </div>
              </div>
              <div id="fine-amount-wrap" className="ag" style={{ display: 'none' }}>
                <label>
                  Fine Amount <span className="rwf-badge">RWF</span>
                  <span
                    style={{
                      marginLeft: 6,
                      fontSize: 10,
                      textTransform: 'uppercase',
                      color: 'var(--text-muted)',
                      letterSpacing: 0.6
                    }}
                  >
                    Auto
                  </span>
                </label>
                <input
                  type="text"
                  id="fine-amount"
                  readOnly
                  disabled
                  placeholder="Auto-filled from backend"
                  style={{ backgroundColor: 'var(--bg-surface-alt)', cursor: 'not-allowed' }}
                />
              </div>
            </div>

            <div className="ag" id="ver-group">
              <label>Verification Status</label>
              <select id="cmt-ver">
                <option value="">— Select Status —</option>
                <option value="verified">Verified</option>
                <option value="not_verified">Not Verified</option>
                <option value="under_review">Under Review</option>
              </select>
            </div>
            <div className="ag">
              <label>Notes</label>
              <input type="text" id="cmt-notes" placeholder="Optional committee notes…" />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={() => handleCloseModal('cmt-modal')}>
              Cancel
            </button>
            <button id="save-committee-btn" type="button" className="btn btn-primary" onClick={handleSaveDecision}>
              <span className="icon icon-sm">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>{' '}
              Submit Committee Decision
            </button>
          </div>
        </div>
      </div>

      <div className="toast-stack" id="toast-stack"></div>
    </div>
  );
}

export default App;

