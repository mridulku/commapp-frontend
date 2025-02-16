// frontend/src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// NEW: Landing Page (public)
import LandingPage from "./components/PreLogin/LandingPage";

import BooksOverview from "./components/BooksOverview/BooksOverview";
import ReadingPlan from "./components/BooksOverview/ReadingPlan";


import GptQuestionGenerator from "./components/Quiz/GptQuestionGenerator";


// Existing components (unchanged)
import AuthLogin from "./components/PreLogin/AuthLogin";
import PrivateRoute from "./components/PreLogin/PrivateRoute";
import Login from "./components/CommAppArchive/Login"; // The old "protected" page (rename if you'd like)
import ChatInterface from "./components/CommAppArchive/ChatInterface";
import Onboarding from "./components/Archive/Onboarding";
import PdfUploader from "./components/AdminDashboard/PdfUploader";
import SubChaptersUploader from "./components/AdminDashboard/SubChaptersUploader";
import ChaptersUploader from "./components/AdminDashboard/ChaptersUploader";
import BookTextViewer from "./components/AdminDashboard/BookTextViewer";
import AdminDashboard from "./components/AdminDashboard/AdminDashboard";
import SubchapterNameUploader from "./components/AdminDashboard/SubchapterNameUploader";
import PlatformIntro from "./components/Onboarding/PlatformIntro";
import PersonalizationProgress from "./components/Onboarding/PersonalizationProgress";

import BrowserPage from "./components/HomePage/BrowserPage";
import AcademicHomePage from "./components/HomePage/AcademicHomePage";
import VocationalHomePage from "./components/HomePage/VocationalHomePage";
import CasualHomePage from "./components/HomePage/CasualHomePage";
import CompetitiveHomePage from "./components/HomePage/CompetitiveHomePage";


import LearnerPersonaForm from "./components/Onboarding/LearnerPersonaForm";
import OnboardingAssessment from "./components/Onboarding/OnboardingAssessment";




import TestView from "./components/Testing/TestView";
import GamificationDashboard from "./components/Gamification/GamificationDashboard";
import MaterialUploadWizard from "./components/AddedFunctions/MaterialUploadWizard";
import CoursesMaterialManager from "./components/AddedFunctions/CoursesMaterialManager";
import UserProfileAnalytics from "./components/AddedFunctions/UserProfileAnalytics";








// NEW: Import your BooksViewer component
import BooksViewer from "./components/DetailedBookViewer/BooksViewer"; 
import BooksViewer2 from "./components/DetailedBookViewer/BooksViewerNew"; 








/*
import AcademicForm from "./components/Onboarding/AcademicForm";
import CasualForm from "./components/Onboarding/CasualForm";
import VocationalForm from "./components/Onboarding/VocationalForm";
import CompetitiveForm from "./components/Onboarding/CompetitiveForm";
*/

function App() {
  return (
    <Router>
      <Routes>
        {/* 1. Public landing page at "/" */}
        <Route path="/" element={<LandingPage />} />

        {/* 2. Auth login page (public) */}
        <Route path="/authlogin" element={<AuthLogin />} />

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

        {/* 7. Chapters uploader */}
        <Route
          path="/booktextviewer"
          element={
            <PrivateRoute>
              <BookTextViewer />
            </PrivateRoute>
          }
        />

        {/* 8. Button Page */}
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


        {/* 9. BrowserPage */}
        <Route
          path="/main"
          element={
            <PrivateRoute>
              <BrowserPage />
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


        {/* 12. Gamify */}
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


        {/* 14. NEW Protected BooksViewer Route */}
        <Route
          path="/books2"
          element={
            <PrivateRoute>
              <BooksViewer2 />
            </PrivateRoute>
          }
        />

        {/* 15. Academic Home Page */}
        <Route
          path="/academichomepage"
          element={
            <PrivateRoute>
              <AcademicHomePage />
            </PrivateRoute>
          }
        />


        {/* 15. Casual Home Page */}
                <Route
          path="/casualhomepage"
          element={
            <PrivateRoute>
              <CasualHomePage />
            </PrivateRoute>
          }
        />

        {/* 15. COmpetitive Home Page */}
        <Route
          path="/competitivehomepage"
          element={
            <PrivateRoute>
              <CompetitiveHomePage />
            </PrivateRoute>
          }
        />

        {/* 15. Vocational Home Page */}
        <Route
          path="/vocationalhomepage"
          element={
            <PrivateRoute>
              <VocationalHomePage />
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

        {/* 15. Academic Home Page */}
        <Route
          path="/userprofileanalytics"
          element={
            <PrivateRoute>
              <UserProfileAnalytics />
            </PrivateRoute>
          }
        />


        {/* 15. Academic Home Page */}
        <Route
          path="/onboardingassessment"
          element={
            <PrivateRoute>
              <OnboardingAssessment />
            </PrivateRoute>
          }
        />

        {/* 15. Academic Home Page */}
        <Route
          path="/booksoverview"
          element={
            <PrivateRoute>
              <BooksOverview />
            </PrivateRoute>
          }
        />

        {/* 15. Academic Home Page */}
        <Route
          path="/readingplan"
          element={
            <PrivateRoute>
              <ReadingPlan />
            </PrivateRoute>
          }
        />


        {/* 15. Academic Home Page */}
        <Route
          path="/gptquestiongenerator"
          element={
            <PrivateRoute>
              <GptQuestionGenerator />
            </PrivateRoute>
          }
        />





        

       












      </Routes>
    </Router>
  );
}

export default App;