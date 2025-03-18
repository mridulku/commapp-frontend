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
import FlowGeneratePlan from './diagrams/FlowGeneratePlan';
import FlowChild2 from './diagrams/FlowChild2';
import FlowReduxPlan from './diagrams/FlowReduxPlan';
import FlowDashboard from './diagrams/FlowDashboard';
import HomeComponentsNodes from './diagrams/HomeComponentsNodes';
import FlowMaterialDashboard from './diagrams/FlowMaterialDashboard';
import FlowPreLogin from './diagrams/FlowPreLogin';
import FlowUpload from './diagrams/FlowUpload';
import FlowProfile from './diagrams/FlowProfile';
import FlowContentPipeline from './diagrams/FlowContentPipeline';
import FlowAPIRoutes from './diagrams/FlowAPIRoutes';
import ExamConfigCreator from './diagrams/ExamConfigCreator';
import HospitalERDiagram from './diagrams/HospitalERDiagram';
import FlowQuizRevisePipeline from './diagrams/FlowQuizRevisePipeline';
import PromptInput from './diagrams/PromptInput';
import PromptManager from './diagrams/PromptManager';
import ManualBookCreator from './diagrams/ManualBookCreator';
import QuestionTypesCreator from './diagrams/QuestionTypesCreator';
import QuestionTypePlayground from './diagrams/QuestionTypePlayground';
import FlowQuizLatest from './diagrams/FlowQuizLatest';
import FlowQuizReact from './diagrams/FlowQuizReact';








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
  TimeLogger,
  FlowGeneratePlan,
  FlowChild2,
  FlowReduxPlan,
  FlowDashboard,
  HomeComponentsNodes,
  FlowMaterialDashboard,
  FlowPreLogin,
  FlowUpload,
  FlowProfile,
  FlowContentPipeline,
  FlowAPIRoutes,
  ExamConfigCreator,
  HospitalERDiagram,
  FlowQuizRevisePipeline,
  PromptManager,
  PromptInput,
  ManualBookCreator,
  QuestionTypesCreator,
  QuestionTypePlayground,
  FlowQuizLatest,
  FlowQuizReact

};

// Sample static data representing past brainstorming sessions.
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
  },
  {
    id: 13,
    title: 'TECH: AdaptivePlanFlow',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'FlowGeneratePlan'
  },
  {
    id: 14,
    title: 'TECH: FlowChild2',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'FlowChild2'
  },
  {
    id: 15,
    title: 'TECH: FlowReduxPlan',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'FlowReduxPlan'
  },
  {
    id: 16,
    title: 'TECH: FlowDashboard',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'FlowDashboard'
  },
  {
    id: 17,
    title: 'TECH: HomeComponentsNodes',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'HomeComponentsNodes'
  },
  {
    id: 18,
    title: 'TECH: FlowMaterialDashboard',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'FlowMaterialDashboard'
  },
  {
    id: 19,
    title: 'TECH: FlowPreLogin',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'FlowPreLogin'
  },
  {
    id: 20,
    title: 'TECH: FlowUpload',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'FlowUpload'
  },
  {
    id: 21,
    title: 'TECH: FlowProfile',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'FlowProfile'
  },
  {
    id: 22,
    title: 'TECH: FlowContentPipeline',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'FlowContentPipeline'
  },
  {
    id: 23,
    title: 'TECH: FlowAPIRoutes',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'FlowAPIRoutes'
  },
  {
    id: 24,
    title: 'TECH: ExamConfigCreator',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'ExamConfigCreator'
  },
  {
    id: 25,
    title: 'TECH: HospitalERDiagram',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'HospitalERDiagram'
  },
  {
    id: 26,
    title: 'TECH: FlowQuizRevisePipeline',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'FlowQuizRevisePipeline'
  },
  {
    id: 27,
    title: 'TECH: PromptManager',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'PromptManager'
  },
  {
    id: 28,
    title: 'TECH: PromptInput',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'PromptInput'
  },
  {
    id: 29,
    title: 'TECH: ManualBookCreator',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'ManualBookCreator'
  },
  {
    id: 30,
    title: 'TECH: QuestionTypesCreator',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'QuestionTypesCreator'
  },
  {
    id: 31,
    title: 'TECH: QuestionTypePlayground',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'QuestionTypePlayground'
  },
  {
    id: 32,
    title: 'TECH: FlowQuizLatest',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'FlowQuizLatest'
  },
  {
    id: 33,
    title: 'TECH: FlowQuizReact',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'FlowQuizReact'
  },



  


  
  

  


  
  

  


  


  
];

function BrainstormingList() {
  const [brainstormings, setBrainstormings] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);

  // Sorting criteria: "alphabetical-desc", "alphabetical-asc", "date"
  // Default is "alphabetical-desc" (which means ascending alphabetical order).
  const [sortCriteria, setSortCriteria] = useState("alphabetical-desc");

  useEffect(() => {
    // On mount or criteria change, sort the sessions
    sortSessions(sortCriteria);
  }, [sortCriteria]);

  const sortSessions = (criteria) => {
    const sorted = sampleBrainstormings.slice().sort((a, b) => {
      if (criteria === "alphabetical-desc") {
        // A -> Z
        return a.title.localeCompare(b.title);
      } else if (criteria === "alphabetical-asc") {
        // Z -> A
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
    setSortCriteria(e.target.value);
  };

  // If a session is selected, show the corresponding diagram
  if (selectedSession) {
    const DiagramComponent = diagramComponents[selectedSession.diagramComponent];

    return (
      <div style={styles.container}>
        <button style={styles.backButton} onClick={() => setSelectedSession(null)}>
          ← Back to Sessions
        </button>

        {DiagramComponent ? (
          // Give the diagram a clear, large container to ensure it appears
          <div style={styles.diagramContainer}>
            <DiagramComponent brainstorming={selectedSession} />
          </div>
        ) : (
          <div>Diagram component not implemented.</div>
        )}
      </div>
    );
  }

  // Otherwise, show the list of brainstorming sessions
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
  },
  // This container ensures the diagram has a visible area
  diagramContainer: {
    width: '100%',
    height: '80vh',   // Adjust as you prefer
    backgroundColor: '#000', 
    border: '1px solid #444',
    borderRadius: '4px',
    overflow: 'hidden'
  }
};

export default BrainstormingList;