// frontend/src/App.jsx
import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// 1) Import Usetiful methods
import { loadUsetifulScript, setUsetifulTags } from "usetiful-sdk";

// NEW: Landing Page (public)
import LandingPage from "./components/Main/0.PreLogin/0.LandingPage";

import PromptManager from "./components/yBrainstorming/diagrams/PromptManager";
import PromptInput from "./components/yBrainstorming/diagrams/PromptInput";


import BrainstormingList from "./components/yBrainstorming/BrainstormingList";


import BooksOverview from "./components/zArchive/Archive 4/BooksOverview";
import ReadingPlan from "./components/zArchive/Archive 4/ReadingPlan";

import AdaptiveStatsDashboard from "./components/zArchive/Archive 11/AdaptiveStatsDashboard";
import GptQuestionGenerator from "./components/zArchive/Archive 10/GptQuestionGenerator";
import BooksViewer3 from "./components/zArchive/Archive 9/BooksViewer3";

import AuthLogin from "./components/zArchive/AuthLogin";
import AuthSignGoogle from "./components/zArchive/AuthSignGoogle";
import AuthSignIn from "./components/Main/0.PreLogin/1.AuthSignIn";


import PrivateRoute from "./components/Main/0.BaseFiles/PrivateRoute";
import Login from "./components/zArchive/Archive 5/Login";
import ChatInterface from "./components/zArchive/Archive 5/ChatInterface";
import Onboarding from "./components/zArchive/Archive 1/Onboarding";
import PdfUploader from "./components/zArchive/Archive 2/PdfUploader";
import SubChaptersUploader from "./components/zArchive/Archive 2/SubChaptersUploader";
import ChaptersUploader from "./components/zArchive/Archive 2/ChaptersUploader";
import BookTextViewer from "./components/zArchive/Archive 2/BookTextViewer";
import AdminDashboard from "./components/zArchive/Archive 2/AdminDashboard";
import SubchapterNameUploader from "./components/zArchive/Archive 2/SubchapterNameUploader";
import PlatformIntro from "./components/zArchive/Archive 8/PlatformIntro";
import PersonalizationProgress from "./components/zArchive/Archive 8/PersonalizationProgress";

import Home from "./components/zArchive/Archive 7/Home";

import LearnerPersonaForm from "./components/zArchive/Archive 8/LearnerPersonaForm";
import OnboardingAssessment from "./components/zArchive/Archive 8/OnboardingAssessment";

import TestView from "./components/zArchive/Archive 11/TestView";
import GamificationDashboard from "./components/zArchive/Archive 6/GamificationDashboard";
import MaterialUploadWizard from "./components/zArchive/Archive 3/MaterialUploadWizard";
import CoursesMaterialManager from "./components/zArchive/Archive 3/CoursesMaterialManager";

import BooksViewer from "./components/zArchive/Archive 1/BooksViewer";
import BooksViewer2 from "./components/Main/0.BaseFiles/Dashboard";

import StageTimeline from "./components/Main/5.StudyModal/0.components/Secondary/StageTimeline";


import PlanFetcher from "./components/Main/5.StudyModal/StudyModal";


import PlanBrowser from "./components/zArchive/0.test/PlanBrowser";


function App() {
  /**
   * Load Usetiful script on startup.
   * Replace "YOUR_TOKEN_HERE" with your real Usetiful token from their dashboard.
   */
//  useEffect(() => {
    // 1) Load the script
//    loadUsetifulScript("b3760e26d861afa7fd68ec7a1fb6294f");

    // 2) (Optional) Identify a user
    // If you have user info available (from context/auth), you could pass it here
//    setUsetifulTags({
  //    userId: "SOME_USER_ID", // Must be unique if you want to track user progress
    //  firstName: "John",
      // lastName: "Doe",
 //   });
 // }, []);

  return (
    <Router>
      <Routes>
        {/* 1. Public landing page at "/" */}
        <Route path="/" element={<LandingPage />} />

        {/* 2. Auth login page (public) */}
        <Route path="/authlogin" element={<AuthLogin />} />

        {/* 2. Auth login page (public) */}
        <Route path="/authsigngoogle" element={<AuthSignGoogle />} />

        {/* 2. Auth login page (public) */}
        <Route path="/authsignin" element={<AuthSignIn />} />


       


        {/* 3. Protected Onboarding page */}
        <Route
          path="/onboarding"
          element={
            <PrivateRoute>
              <Onboarding />
            </PrivateRoute>
          }
        />

        {/* 4. Protected "Main" page (formerly at "/") */}
        <Route
          path="/login"
          element={
            <PrivateRoute>
              <Login />
            </PrivateRoute>
          }
        />

        {/* 5. Protected Chat */}
        <Route
          path="/chat/:id"
          element={
            <PrivateRoute>
              <ChatInterface />
            </PrivateRoute>
          }
        />

        {/* 6. NEW Protected BooksViewer Route */}
        <Route
          path="/books"
          element={
            <PrivateRoute>
              <BooksViewer />
            </PrivateRoute>
          }
        />

        {/* 7. Uploader Route */}
        <Route
          path="/upload-pdf"
          element={
            <PrivateRoute>
              <PdfUploader />
            </PrivateRoute>
          }
        />

        {/* 7. Subchapters uploader */}
        <Route
          path="/subchapters-uploader"
          element={
            <PrivateRoute>
              <SubChaptersUploader />
            </PrivateRoute>
          }
        />

        {/* 7. Chapters uploader */}
        <Route
          path="/chapters-uploader"
          element={
            <PrivateRoute>
              <ChaptersUploader />
            </PrivateRoute>
          }
        />

        {/* 7. Book text viewer */}
        <Route
          path="/booktextviewer"
          element={
            <PrivateRoute>
              <BookTextViewer />
            </PrivateRoute>
          }
        />

        {/* 8. Admin Dashboard */}
        <Route
          path="/admindashboard"
          element={
            <PrivateRoute>
              <AdminDashboard />
            </PrivateRoute>
          }
        />

        {/* 8. Subchapter Names */}
        <Route
          path="/subchapternames"
          element={
            <PrivateRoute>
              <SubchapterNameUploader />
            </PrivateRoute>
          }
        />

        {/* 9. Platform Intro */}
        <Route
          path="/platformintro"
          element={
            <PrivateRoute>
              <PlatformIntro />
            </PrivateRoute>
          }
        />

        {/* 9. PersonalizationProgress */}
        <Route
          path="/personalizationprogress"
          element={
            <PrivateRoute>
              <PersonalizationProgress />
            </PrivateRoute>
          }
        />

        {/* 10. Learner Persona */}
        <Route
          path="/learnerpersona"
          element={
            <PrivateRoute>
              <LearnerPersonaForm />
            </PrivateRoute>
          }
        />

        {/* 11. Test View */}
        <Route
          path="/testview"
          element={
            <PrivateRoute>
              <TestView />
            </PrivateRoute>
          }
        />

        {/* 12. Gamification */}
        <Route
          path="/gamificationdashboard"
          element={
            <PrivateRoute>
              <GamificationDashboard />
            </PrivateRoute>
          }
        />

        {/* 13. Material Upload Wizard */}
        <Route
          path="/material"
          element={
            <PrivateRoute>
              <MaterialUploadWizard />
            </PrivateRoute>
          }
        />

        {/* 14. BooksViewer2 (Dashboard) */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <BooksViewer2 />
            </PrivateRoute>
          }
        />

        {/* 15. Home */}
        <Route
          path="/home"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />

        {/* 15. Vocational Home Page */}
        <Route
          path="/coursesmaterialmanager"
          element={
            <PrivateRoute>
              <CoursesMaterialManager />
            </PrivateRoute>
          }
        />

        {/* 15. OnboardingAssessment */}
        <Route
          path="/onboardingassessment"
          element={
            <PrivateRoute>
              <OnboardingAssessment />
            </PrivateRoute>
          }
        />

        {/* 15. BooksOverview */}
        <Route
          path="/booksoverview"
          element={
            <PrivateRoute>
              <BooksOverview />
            </PrivateRoute>
          }
        />

        {/* 15. ReadingPlan */}
        <Route
          path="/readingplan"
          element={
            <PrivateRoute>
              <ReadingPlan />
            </PrivateRoute>
          }
        />

        {/* 15. GptQuestionGenerator */}
        <Route
          path="/gptquestiongenerator"
          element={
            <PrivateRoute>
              <GptQuestionGenerator />
            </PrivateRoute>
          }
        />

        {/* 15. BooksViewer3 */}
        <Route
          path="/books3"
          element={
            <PrivateRoute>
              <BooksViewer3 />
            </PrivateRoute>
          }
        />

        {/* 15. AdaptiveStatsDashboard */}
        <Route
          path="/adaptivestatsdashboard"
          element={
            <PrivateRoute>
              <AdaptiveStatsDashboard />
            </PrivateRoute>
          }
        />
        {/* 15. AdaptiveStatsDashboard */}
        <Route
          path="/planbrowser"
          element={
            <PrivateRoute>
              <PlanBrowser />
            </PrivateRoute>
          }
        />
        {/* 15. AdaptiveStatsDashboard */}
        <Route
          path="/planfetcher"
          element={
            <PrivateRoute>
              <PlanFetcher />
            </PrivateRoute>
          }
        />
        {/* 15. AdaptiveStatsDashboard */}
        <Route
          path="/stagetimeline"
          element={
            <PrivateRoute>
              <StageTimeline />
            </PrivateRoute>
          }
        />




        


        <Route
          path="/promptmanager"
          element={
            <PrivateRoute>
              <PromptManager />
            </PrivateRoute>
          }
        />

        <Route
          path="/promptinput"
          element={
            <PrivateRoute>
              <PromptInput />
            </PrivateRoute>
          }
        />

        <Route
          path="/brainstorming"
          element={
            <PrivateRoute>
              <BrainstormingList />
            </PrivateRoute>
          }
        />
        
      </Routes>
      
      


    </Router>
  );
}

export default App;