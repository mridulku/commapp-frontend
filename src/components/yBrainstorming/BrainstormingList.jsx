// src/components/BrainstormingList.jsx
import React, { useState, useEffect } from 'react';
import UserOutreachPitch from './diagrams/UserOutreachPitch';
import UserOutreachTree from './diagrams/UserOutreachTree';
import GeneralTodoDashboard from './diagrams/GeneralTodoDashboard';
import ProductFlowDiagram from './diagrams/ProductFlowDiagram';
import PitchingDashboard from './diagrams/PitchingDashboard';
import UserInterviewFeedback from './diagrams/UserInterviewFeedback';
import Notes from './diagrams/Notes';
import MonetizationBrainstorming from './diagrams/MonetizationBrainstorming';
import UserGrowthStrategy from './diagrams/UserGrowthStrategy';
import AnalyticsDashboard from './diagrams/AnalyticsDashboard';
import UserPersonas from './diagrams/UserPersonas';
import TimeLogger from './diagrams/TimeLogger';




// Mapping from diagram component name to the actual component
const diagramComponents = {
  UserOutreachPitch,
  UserOutreachTree,
  GeneralTodoDashboard,
  ProductFlowDiagram,
  PitchingDashboard,
  UserInterviewFeedback,
  Notes,
  MonetizationBrainstorming,
  UserGrowthStrategy,
  AnalyticsDashboard,
  UserPersonas,
  TimeLogger
  // When you create a new diagram component, simply add:
  // NewDiagramComponent: NewDiagramComponent
};

// Sample static data representing past brainstorming sessions.
// In a real app, you might fetch this from an API.
const sampleBrainstormings = [
  {
    id: 1,
    title: 'USER: Outreach Pitch',
    timestamp: new Date('2025-03-20T10:00:00Z'),
    diagramComponent: 'UserOutreachPitch'
  },
  {
    id: 2,
    title: 'USER: Channels',
    timestamp: new Date('2025-03-18T15:30:00Z'),
    diagramComponent: 'UserOutreachTree'
  },
  {
    id: 3,
    title: 'GENERAL: TodoDashboard',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'GeneralTodoDashboard'
  },
  {
    id: 4,
    title: 'PRODUCT: Flow',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'ProductFlowDiagram'
  },
  {
    id: 5,
    title: 'PITCH: Dashboard',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'PitchingDashboard'
  },
  {
    id: 6,
    title: 'USER: Interview',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'UserInterviewFeedback'
  },
  {
    id: 7,
    title: 'GENERAL: Notes',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'Notes'
  },
  {
    id: 8,
    title: 'PITCH: Monetization',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'MonetizationBrainstorming'
  },
  {
    id: 9,
    title: 'USER: Growth Loops',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'UserGrowthStrategy'
  },
  {
    id: 10,
    title: 'PRODUCT: AnalyticsDashboard',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'AnalyticsDashboard'
  },
  {
    id: 11,
    title: 'USER: Personas',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'UserPersonas'
  },
  {
    id: 12,
    title: 'GENERAL: TimeLogger',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'TimeLogger'
  }



  
  // Add more sessions as needed...
];

function BrainstormingList() {
  const [brainstormings, setBrainstormings] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  // Sorting criteria: "alphabetical-desc", "alphabetical-asc", "date"
  // Default is "alphabetical-desc" (which means A, B, C, D order)
  const [sortCriteria, setSortCriteria] = useState("alphabetical-desc");

  useEffect(() => {
    // On mount, sort the sessions according to default criteria
    sortSessions(sortCriteria);
  }, [sortCriteria]);

  const sortSessions = (criteria) => {
    const sorted = sampleBrainstormings.slice().sort((a, b) => {
      if (criteria === "alphabetical-desc") {
        // Default: A, B, C, D (i.e. ascending alphabetical order)
        return a.title.localeCompare(b.title);
      } else if (criteria === "alphabetical-asc") {
        // Reverse alphabetical order: Z, Y, X, ...
        return b.title.localeCompare(a.title);
      } else if (criteria === "date") {
        // Newest first
        return b.timestamp - a.timestamp;
      } else {
        return 0;
      }
    });
    setBrainstormings(sorted);
  };

  const handleSortChange = (e) => {
    const criteria = e.target.value;
    setSortCriteria(criteria);
  };

  if (selectedSession) {
    const DiagramComponent = diagramComponents[selectedSession.diagramComponent];
    return (
      <div style={styles.container}>
        <button style={styles.backButton} onClick={() => setSelectedSession(null)}>
          ← Back to Sessions
        </button>
        {DiagramComponent ? (
          <DiagramComponent brainstorming={selectedSession} />
        ) : (
          <div>Diagram component not implemented.</div>
        )}
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Brainstorming Sessions</h1>
      <div style={styles.sortContainer}>
        <label style={styles.sortLabel}>Sort by: </label>
        <select value={sortCriteria} onChange={handleSortChange} style={styles.sortSelect}>
          <option value="alphabetical-desc">Alphabetical (A, B, C, D)</option>
          <option value="alphabetical-asc">Alphabetical (Z, Y, X, ...)</option>
          <option value="date">Date (Newest First)</option>
        </select>
      </div>
      <div style={styles.list}>
        {brainstormings.map((session) => (
          <button
            key={session.id}
            style={styles.sessionButton}
            onClick={() => setSelectedSession(session)}
          >
            <div style={styles.buttonContent}>
              <span style={styles.title}>{session.title}</span>
              <span style={styles.timestamp}>
                {session.timestamp.toLocaleString()}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '1rem',
    backgroundColor: '#0F0F0F',
    color: '#fff',
    minHeight: '100vh'
  },
  header: {
    textAlign: 'center',
    marginBottom: '1rem'
  },
  sortContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1rem'
  },
  sortLabel: {
    marginRight: '0.5rem'
  },
  sortSelect: {
    padding: '0.5rem',
    borderRadius: '4px',
    border: '1px solid #444',
    backgroundColor: '#1F1F1F',
    color: '#fff'
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  sessionButton: {
    backgroundColor: '#1F1F1F',
    border: '1px solid #444',
    borderRadius: '4px',
    padding: '1rem',
    cursor: 'pointer',
    textAlign: 'left'
  },
  buttonContent: {
    display: 'flex',
    flexDirection: 'column'
  },
  title: {
    fontSize: '1.1rem',
    fontWeight: 'bold',
    color: '#aaa'
  },
  timestamp: {
    fontSize: '0.85rem',
    color: '#aaa'
  },
  backButton: {
    marginBottom: '1rem',
    padding: '0.5rem 1rem',
    backgroundColor: '#444',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  }
};

export default BrainstormingList;