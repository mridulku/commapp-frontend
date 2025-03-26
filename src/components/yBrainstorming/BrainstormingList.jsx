// src/components/BrainstormingList.jsx
import React, { useState, useEffect } from 'react';
import UserOutreachPitch from './diagrams/Business/USER/UserOutreachPitch';
import UserOutreachTree from './diagrams/Business/USER/UserOutreachTree';
import GeneralTodoDashboard from './diagrams/Business/PersonalProd/GeneralTodoDashboard';
import ProductFlowDiagram from './diagrams/Business/PRODUCT/ProductFlowDiagram';
import PitchingDashboard from './diagrams/Business/PITCH/PitchingDashboard';
import UserInterviewFeedback from './diagrams/Business/USER/UserInterviewFeedback';
import Notes from './diagrams/Business/PersonalProd/Notes';
import MonetizationBrainstorming from './diagrams/Business/PITCH/MonetizationBrainstorming';
import UserGrowthStrategy from './diagrams/Business/USER/UserGrowthStrategy';
import AnalyticsDashboard from './diagrams/Business/PRODUCT/AnalyticsDashboard';
import UserPersonas from './diagrams/Business/USER/UserPersonas';
import TimeLogger from './diagrams/Business/PersonalProd/TimeLogger';
import FlowGeneratePlan from './diagrams/TechFlowCharts/FlowGeneratePlan';
import FlowChild2 from './diagrams/TechFlowCharts/FlowChild2';
import FlowReduxPlan from './diagrams/TechFlowCharts/FlowReduxPlan';
import FlowDashboard from './diagrams/TechFlowCharts/FlowDashboard';
import HomeComponentsNodes from './diagrams/TechFlowCharts/FlowHomeComponentsNodes';
import FlowMaterialDashboard from './diagrams/TechFlowCharts/FlowMaterialDashboard';
import FlowPreLogin from './diagrams/TechFlowCharts/FlowPreLogin';
import FlowUpload from './diagrams/TechFlowCharts/FlowUpload';
import FlowProfile from './diagrams/TechFlowCharts/FlowProfile';
import FlowContentPipeline from './diagrams/TechFlowCharts/FlowContentPipeline';
import FlowAPIRoutes from './diagrams/TechFlowCharts/FlowAPIRoutes';
import ExamConfigCreator from './diagrams/Pilot|AddToDB|Coding/AddToDatabase/ExamConfigCreator';
import HospitalERDiagram from './diagrams/Business/Junk/HospitalERDiagram';
import FlowQuizRevisePipeline from './diagrams/TechFlowCharts/FlowQuizRevisePipeline';
import PromptInput from './diagrams/Pilot|AddToDB|Coding/PilotComponents/PromptMgmtDeprecated/PromptInput';
import PromptManager from './diagrams/Pilot|AddToDB|Coding/PilotComponents/PromptMgmtDeprecated/PromptManager';
import ManualBookCreator from './diagrams/Pilot|AddToDB|Coding/AddToDatabase/ManualBookCreator';
import QuestionTypesCreator from './diagrams/Pilot|AddToDB|Coding/AddToDatabase/QuestionTypesCreator';
import QuestionTypePlayground from './diagrams/Pilot|AddToDB|Coding/PilotComponents/QuizDeprecated/QuestionTypePlayground';
import FlowQuizLatest from './diagrams/TechFlowCharts/FlowQuizLatest';
import FlowQuizReact from './diagrams/TechFlowCharts/FlowQuizReact';
import QuizConfigCreator from './diagrams/Pilot|AddToDB|Coding/AddToDatabase/QuizConfigCreator';
import CSVBookUploader from './diagrams/Pilot|AddToDB|Coding/AddToDatabase/CSVBookUploader';
import FlowHolyGrailDataFlow from './diagrams/TechFlowCharts/FlowHolyGrailDataFlow';
import FileExplorer from './diagrams/Pilot|AddToDB|Coding/CodingHelp/FileExplorer';
import FirebaseCollectionsViewer from './diagrams/Pilot|AddToDB|Coding/CodingHelp/FirebaseCollectionsViewer';
import AdaptivePlanLoader from './diagrams/Pilot|AddToDB|Coding/PilotComponents/AdaptivePlanViewersMar23/AdaptivePlanLoader';
import AdaptivePlanConceptLoader from './diagrams/Pilot|AddToDB|Coding/PilotComponents/AdaptivePlanViewersMar23/AdaptivePlanConceptLoader';
import UploadQuestionPaper from './diagrams/Pilot|AddToDB|Coding/PilotComponents/ExamQPUpload23Mar/UploadQuestionPaper';
import UploadExamGuidelines from './diagrams/Pilot|AddToDB|Coding/PilotComponents/ExamQPUpload23Mar/UploadExamGuidelines';


import Parent from './Parent';


import QuickDeleteUserData from './diagrams/Pilot|AddToDB|Coding/AddToDatabase/QuickDeleteUserData';

import TOEFLOnboardingTest from './diagrams/Pilot|AddToDB|Coding/PilotComponents/TOEFLOnboardingTest';
import TOEFLOnboardingProcessing from './diagrams/Pilot|AddToDB|Coding/PilotComponents/TOEFLOnboardingProcessing';




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
  FlowQuizReact,
  QuizConfigCreator,
  CSVBookUploader,
  FlowHolyGrailDataFlow,
  FileExplorer,
  FirebaseCollectionsViewer,
  AdaptivePlanLoader,
  AdaptivePlanConceptLoader,
  UploadQuestionPaper,
  UploadExamGuidelines,
  Parent,
  QuickDeleteUserData,
  TOEFLOnboardingTest,
  TOEFLOnboardingProcessing,
  
};

// Sample static data representing past brainstorming sessions.
// Added "isImportant" for each. Feel free to change which ones are true/false.
const sampleBrainstormings = [
  {
    id: 1,
    title: 'USER: Outreach Pitch',
    timestamp: new Date('2025-03-20T10:00:00Z'),
    diagramComponent: 'UserOutreachPitch',
    isImportant: false
  },
  {
    id: 2,
    title: 'USER: Channels',
    timestamp: new Date('2025-03-18T15:30:00Z'),
    diagramComponent: 'UserOutreachTree',
    isImportant: false
  },
  {
    id: 3,
    title: 'PersonalProd: GeneralTodoDashboard',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'GeneralTodoDashboard',
    isImportant: true
  },
  {
    id: 4,
    title: 'PRODUCT: Flow',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'ProductFlowDiagram',
    isImportant: false
  },
  {
    id: 5,
    title: 'PITCH: Dashboard',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'PitchingDashboard',
    isImportant: false
  },
  {
    id: 6,
    title: 'USER: Interview',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'UserInterviewFeedback',
    isImportant: false
  },
  {
    id: 7,
    title: 'PersonalProd: Notes',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'Notes',
    isImportant: false
  },
  {
    id: 8,
    title: 'PITCH: Monetization',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'MonetizationBrainstorming',
    isImportant: true
  },
  {
    id: 9,
    title: 'USER: Growth Loops',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'UserGrowthStrategy',
    isImportant: false
  },
  {
    id: 10,
    title: 'PRODUCT: AnalyticsDashboard',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'AnalyticsDashboard',
    isImportant: false
  },
  {
    id: 11,
    title: 'USER: Personas',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'UserPersonas',
    isImportant: false
  },
  {
    id: 12,
    title: 'PersonalProd: TimeLogger',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'TimeLogger',
    isImportant: false
  },
  {
    id: 13,
    title: 'TECH: AdaptivePlanFlow',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'FlowGeneratePlan',
    isImportant: false
  },
  {
    id: 14,
    title: 'TECH: FlowChild2',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'FlowChild2',
    isImportant: false
  },
  {
    id: 15,
    title: 'TECH: FlowReduxPlan',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'FlowReduxPlan',
    isImportant: false
  },
  {
    id: 16,
    title: 'TECH: FlowDashboard',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'FlowDashboard',
    isImportant: false
  },
  {
    id: 17,
    title: 'FlowSwimLanes: FlowHomeComponentsNodes',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'HomeComponentsNodes',
    isImportant: false
  },
  {
    id: 18,
    title: 'FlowSwimLanes: FlowMaterialDashboard',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'FlowMaterialDashboard',
    isImportant: false
  },
  {
    id: 19,
    title: 'FlowSwimLanes: FlowPreLogin',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'FlowPreLogin',
    isImportant: false
  },
  {
    id: 20,
    title: 'FlowSwimLanes: FlowUpload',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'FlowUpload',
    isImportant: false
  },
  {
    id: 21,
    title: 'TECH: FlowProfile',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'FlowProfile',
    isImportant: false
  },
  {
    id: 22,
    title: 'FlowSwimLanes: FlowContentPipeline',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'FlowContentPipeline',
    isImportant: false
  },
  {
    id: 23,
    title: 'FlowSwimLanes: FlowAPIRoutes',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'FlowAPIRoutes',
    isImportant: false
  },
  {
    id: 24,
    title: 'AdminPanel: ExamConfigCreator',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'ExamConfigCreator',
    isImportant: false
  },
  {
    id: 25,
    title: 'Junk: HospitalERDiagram',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'HospitalERDiagram',
    isImportant: false
  },
  {
    id: 26,
    title: 'FlowSwimLanes: FlowQuizRevisePipeline',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'FlowQuizRevisePipeline',
    isImportant: false
  },
  {
    id: 27,
    title: 'PilotComponents: PromptManager',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'PromptManager',
    isImportant: false
  },
  {
    id: 28,
    title: 'PilotComponents: PromptInput',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'PromptInput',
    isImportant: false
  },
  {
    id: 29,
    title: 'AdminPanel: ManualBookCreator',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'ManualBookCreator',
    isImportant: false
  },
  {
    id: 30,
    title: 'AdminPanel: QuestionTypesCreator',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'QuestionTypesCreator',
    isImportant: false
  },
  {
    id: 31,
    title: 'PilotComponents: QuestionTypePlayground',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'QuestionTypePlayground',
    isImportant: false
  },
  {
    id: 32,
    title: 'FlowSwimLanes: FlowQuizLatest',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'FlowQuizLatest',
    isImportant: true
  },
  {
    id: 33,
    title: 'FlowSwimLanes: FlowQuizReact',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'FlowQuizReact',
    isImportant: false
  },
  {
    id: 34,
    title: 'AdminPanel: QuizConfigCreator',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'QuizConfigCreator',
    isImportant: false
  },
  {
    id: 35,
    title: 'AdminPanel: CSVBookUploader',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'CSVBookUploader',
    isImportant: false
  },
  {
    id: 36,
    title: 'FlowSwimLanes: FlowHolyGrailDataFlow',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'FlowHolyGrailDataFlow',
    isImportant: false
  },
  {
    id: 37,
    title: 'AdminPanel: FileExplorer',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'FileExplorer',
    isImportant: false
  },
  {
    id: 38,
    title: 'AdminPanel: FirebaseCollectionsViewer',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'FirebaseCollectionsViewer',
    isImportant: false
  },
  {
    id: 39,
    title: 'PilotComponents: AdaptivePlanLoader',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'AdaptivePlanLoader',
    isImportant: false
  },
  {
    id: 40,
    title: 'PilotComponents: AdaptivePlanConceptLoader',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'AdaptivePlanConceptLoader',
    isImportant: false
  },
  {
    id: 41,
    title: 'PilotComponents: UploadQuestionPaper',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'UploadQuestionPaper',
    isImportant: false
  },
  {
    id: 42,
    title: 'PilotComponents: UploadExamGuidelines',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'UploadExamGuidelines',
    isImportant: false
  },
  {
    id: 43,
    title: 'PilotComponents: Parent',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'Parent',
    isImportant: false
  },
  {
    id: 44,
    title: 'AdminPanel: QuickDeleteUserData',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'QuickDeleteUserData',
    isImportant: false
  },
  {
    id: 44,
    title: 'PilotComponents: TOEFLOnboardingTest',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'TOEFLOnboardingTest',
    isImportant: false
  },
  {
    id: 45,
    title: 'PilotComponents: TOEFLOnboardingProcessing',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'TOEFLOnboardingProcessing',
    isImportant: false
  },





  


  



  


  





  


  




  



  



  




  


  
];

function BrainstormingList() {
  const [brainstormings, setBrainstormings] = useState(sampleBrainstormings);
  const [selectedSession, setSelectedSession] = useState(null);

  // Sorting criteria: "alphabetical-desc" (A->Z), "alphabetical-asc" (Z->A), "date" (newest first)
  const [sortCriteria, setSortCriteria] = useState("alphabetical-desc");

  // Filter by importance: "all" or "important"
  const [importanceFilter, setImportanceFilter] = useState("all");

  // Track collapsible state for categories. Key: category name, Value: bool (true = collapsed)
  // Default is collapsed: so `true` for all categories.
  const [collapsedCategories, setCollapsedCategories] = useState({});

  // Toggles the collapsed state of a given category
  const toggleCategoryCollapse = (category) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Toggles "isImportant" for a single session
  const toggleImportant = (id) => {
    setBrainstormings((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, isImportant: !b.isImportant } : b
      )
    );
  };

  useEffect(() => {
    // On first render, initialize all categories as collapsed = true
    const allCategories = new Set();
    sampleBrainstormings.forEach((s) => {
      const cat = parseCategory(s.title);
      allCategories.add(cat);
    });

    const collapseMap = {};
    allCategories.forEach((cat) => {
      collapseMap[cat] = true; // default collapsed
    });
    setCollapsedCategories(collapseMap);
  }, []);

  // Helper: extracts category from a title (the part before ":")
  const parseCategory = (fullTitle) => {
    const parts = fullTitle.split(":");
    if (parts.length > 1) {
      return parts[0].trim();
    }
    // If somehow no colon, just treat entire title as category
    return fullTitle.trim();
  };

  // Returns the items filtered by importance, grouped by category, and sorted.
  // 1) Filter by importance
  // 2) Group by category
  // 3) Sort categories A->Z
  // 4) Sort items by the selected sort criteria
  const getGroupedAndSortedBrainstormings = () => {
    // 1) Filter by importance
    let filtered = brainstormings;
    if (importanceFilter === "important") {
      filtered = filtered.filter((item) => item.isImportant);
    }

    // 2) Group by category
    const grouped = {};
    filtered.forEach((item) => {
      const category = parseCategory(item.title);
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(item);
    });

    // 3) Sort categories A->Z
    const sortedCategories = Object.keys(grouped).sort((a, b) =>
      a.localeCompare(b)
    );

    // 4) Sort items within each category by sortCriteria
    sortedCategories.forEach((cat) => {
      grouped[cat].sort((a, b) => {
        if (sortCriteria === "alphabetical-desc") {
          // A -> Z
          return a.title.localeCompare(b.title);
        } else if (sortCriteria === "alphabetical-asc") {
          // Z -> A
          return b.title.localeCompare(a.title);
        } else if (sortCriteria === "date") {
          // Newest first
          return b.timestamp - a.timestamp;
        }
        return 0;
      });
    });

    return { grouped, sortedCategories };
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
          <div style={styles.diagramContainer}>
            <DiagramComponent brainstorming={selectedSession} />
          </div>
        ) : (
          <div>Diagram component not implemented.</div>
        )}
      </div>
    );
  }

  // Otherwise, show the grouped list of sessions
  const { grouped, sortedCategories } = getGroupedAndSortedBrainstormings();

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Brainstorming Sessions</h1>

      {/* Sorting + Importance Filter */}
      <div style={styles.controlsRow}>
        <div style={styles.controlGroup}>
          <label style={styles.sortLabel}>Sort by: </label>
          <select
            value={sortCriteria}
            onChange={(e) => setSortCriteria(e.target.value)}
            style={styles.sortSelect}
          >
            <option value="alphabetical-desc">Alphabetical (A → Z)</option>
            <option value="alphabetical-asc">Alphabetical (Z → A)</option>
            <option value="date">Date (Newest First)</option>
          </select>
        </div>

        <div style={styles.controlGroup}>
          <label style={styles.sortLabel}>Filter:</label>
          <select
            value={importanceFilter}
            onChange={(e) => setImportanceFilter(e.target.value)}
            style={styles.sortSelect}
          >
            <option value="all">All</option>
            <option value="important">Important</option>
          </select>
        </div>
      </div>

      {/* Render each category as collapsible */}
      {sortedCategories.map((category) => {
        const sessions = grouped[category];
        // If a category has 0 sessions (after filtering), skip
        if (!sessions || sessions.length === 0) return null;

        const isCollapsed = collapsedCategories[category] ?? true;

        return (
          <div key={category} style={styles.categoryContainer}>
            {/* Category Header */}
            <div
              style={styles.categoryHeader}
              onClick={() => toggleCategoryCollapse(category)}
            >
              <span style={styles.categoryTitle}>{category}</span>
              <span style={styles.collapseIndicator}>
                {isCollapsed ? "[+]" : "[-]"}
              </span>
            </div>

            {/* Sessions inside category */}
            {!isCollapsed && (
              <div style={styles.sessionList}>
                {sessions.map((session) => (
                  <div key={session.id} style={styles.sessionRow}>
                    <button
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
                    {/* Toggle important icon/button */}
                    <button
                      style={styles.importantButton}
                      onClick={() => toggleImportant(session.id)}
                    >
                      {session.isImportant ? "★" : "☆"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
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
  controlsRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '2rem',
    marginBottom: '1rem',
  },
  controlGroup: {
    display: 'flex',
    alignItems: 'center'
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
  categoryContainer: {
    marginBottom: '1rem',
    border: '1px solid #444',
    borderRadius: '4px',
  },
  categoryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.75rem 1rem',
    backgroundColor: '#222',
    cursor: 'pointer',
  },
  categoryTitle: {
    fontSize: '1.1rem',
    fontWeight: 'bold'
  },
  collapseIndicator: {
    marginLeft: '1rem'
  },
  sessionList: {
    padding: '0.5rem 1rem'
  },
  sessionRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '0.5rem'
  },
  sessionButton: {
    flex: 1,
    backgroundColor: '#1F1F1F',
    border: '1px solid #444',
    borderRadius: '4px',
    padding: '0.5rem',
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
  importantButton: {
    marginLeft: '0.5rem',
    backgroundColor: '#444',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    padding: '0.4rem 0.6rem',
    cursor: 'pointer',
    fontSize: '1rem',
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
  diagramContainer: {
    width: '100%',
    height: '80vh',
    backgroundColor: '#000',
    border: '1px solid #444',
    borderRadius: '4px',
    overflow: 'hidden'
  }
};

export default BrainstormingList;