// frontend/src/App.jsx
import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// 1) Import Usetiful methods
import { loadUsetifulScript, setUsetifulTags } from "usetiful-sdk";

// NEW: Landing Page (public)
import LandingPage from "./components/PreLogin/LandingPage";

import OnboardingCarousel from "./components/OnboardingCarousel";


import BooksOverview from "./components/Archive/Archive 4/BooksOverview";
import ReadingPlan from "./components/Archive/Archive 4/ReadingPlan";

import AdaptiveStatsDashboard from "./components/Archive/Archive 11/AdaptiveStatsDashboard";
import GptQuestionGenerator from "./components/Archive/Archive 10/GptQuestionGenerator";
import BooksViewer3 from "./components/Archive/Archive 9/BooksViewer3";

import AuthLogin from "./components/Archive/AuthLogin";
import AuthSignGoogle from "./components/Archive/AuthSignGoogle";
import AuthSignIn from "./components/PreLogin/AuthSignIn";


import PrivateRoute from "./components/PreLogin/PrivateRoute";
import Login from "./components/Archive/Archive 5/Login";
import ChatInterface from "./components/Archive/Archive 5/ChatInterface";
import Onboarding from "./components/Archive/Archive 1/Onboarding";
import PdfUploader from "./components/Archive/Archive 2/PdfUploader";
import SubChaptersUploader from "./components/Archive/Archive 2/SubChaptersUploader";
import ChaptersUploader from "./components/Archive/Archive 2/ChaptersUploader";
import BookTextViewer from "./components/Archive/Archive 2/BookTextViewer";
import AdminDashboard from "./components/Archive/Archive 2/AdminDashboard";
import SubchapterNameUploader from "./components/Archive/Archive 2/SubchapterNameUploader";
import PlatformIntro from "./components/Archive/Archive 8/PlatformIntro";
import PersonalizationProgress from "./components/Archive/Archive 8/PersonalizationProgress";

import Home from "./components/Archive/Archive 7/Home";

import LearnerPersonaForm from "./components/Archive/Archive 8/LearnerPersonaForm";
import OnboardingAssessment from "./components/Archive/Archive 8/OnboardingAssessment";

import TestView from "./components/Archive/Archive 11/TestView";
import GamificationDashboard from "./components/Archive/Archive 6/GamificationDashboard";
import MaterialUploadWizard from "./components/Archive/Archive 3/MaterialUploadWizard";
import CoursesMaterialManager from "./components/Archive/Archive 3/CoursesMaterialManager";

import BooksViewer from "./components/Archive/Archive 1/BooksViewer";
import BooksViewer2 from "./components/DetailedBookViewer/0.BooksViewerNew";

import PlanFetcher from "./components/DetailedBookViewer/PlanFetcher";


import PlanBrowser from "./components/DetailedBookViewer/PlanBrowser";


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
        <Route
          path="/onboardingcarousel"
          element={
            <PrivateRoute>
              <OnboardingCarousel />
            </PrivateRoute>
          }
        />
        
      </Routes>
      
      


    </Router>
  );
}

export default App;