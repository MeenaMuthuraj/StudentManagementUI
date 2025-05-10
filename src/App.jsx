// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// --- Import Context Providers ---
// Assuming StudentProfileProvider is correct and used for students
import { ProfileProvider } from "./context/ProfileContext";
import { TeacherProfileProvider } from "./context/TeacherProfileContext"; // <-- TEACHER Provider Import
/* In App.jsx or index.css */
import "react-datepicker/dist/react-datepicker.css";
// --- Import Page/Layout/Component Imports ---
import Home from "./pages/Home";
import AuthForm from "./pages/AuthForm";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute"; // Ensure correct path

// --- Admin Imports ---
import AdminDashboard from "./adminSide/AdminDashboard";

// --- Student Imports ---
import StudentLayout from "./studentSide/StudentLayout";
import StudentDashboard from "./studentSide/StudentDashboard";
import StudentProfile from "./studentSide/StudentProfile";
import StudentEditProfile from "./studentSide/StudentEditProfile";
import StudentSubjects from "./studentSide/StudentSubjects"; // <-- Import
import StudentViewQuizzes from "./studentSide/StudentViewQuizzes"; 
import StudentTakeQuiz from "./studentSide/StudentTakeQuiz"; // <-- NEW COMPONENT TO CREATE
import StudentQuizResult from "./studentSide/StudentQuizResult"; 
import StudentAttendance from "./studentSide/StudentAttendance"; // <-- IMPORT
import StudentGrades from "./studentSide/StudentGrades"; 
// ... other student imports ...

// --- Teacher Imports ---
import TeacherLayout from "./teacherSide/TeacherLayout";
import TeacherDashboard from "./teacherSide/TeacherDashboard";
import TeacherMainProfile from "./teacherSide/TeacherMainProfile";
import TeacherEditProfile from "./teacherSide/TeacherEditProfile";
import TeacherClasses from "./teacherSide/TeacherClasses";
import TeacherViewStudentDetails from "./teacherSide/TeacherViewStudentDetails";
import TeacherViewSubjects from "./teacherSide/TeacherViewSubjects";
import TeacherUploadSyllabus from "./teacherSide/TeacherUploadSyllabus";
import TeacherUploadMaterials from "./teacherSide/TeacherUploadMaterials";
import TeacherMarkAttendance from "./teacherSide/TeacherMarkAttendance";
import TeacherViewAttendanceReports from "./teacherSide/TeacherViewAttendanceReports";
import TeacherCreateQuiz from "./teacherSide/TeacherCreateQuiz"; // <--- IMPORT NEW COMPONENT
import TeacherViewQuizzes from "./teacherSide/TeacherViewQuizzes"; 
import TeacherViewQuizResults from "./teacherSide/TeacherViewQuizResults";
// ... other teacher imports ...

// --- App Component ---
function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/AuthForm" element={<AuthForm />} />
        <Route path="/Dashboard" element={<Dashboard />} />

        {/* Admin Routes */}
        <Route element={<ProtectedRoute allowedUserType="admin" />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          {/* Add other admin routes */}
        </Route>

        {/* Student Routes - WRAPPED IN StudentProfileProvider */}
        <Route
          path="/student/*" // Group student routes
          element={
            <ProfileProvider> {/* <<< STUDENT PROVIDER */}
              <Routes>
                <Route element={
                  <ProtectedRoute allowedUserType="student" />}>
                  <Route element={<StudentLayout />}>
                    <Route index element={<StudentDashboard />} />
                    <Route path="studentDashboard" element={<StudentDashboard />} />
                    <Route path="StudentProfile" element={<StudentProfile />} />
                    <Route path="StudentEditProfile" element={<StudentEditProfile />} />
                    <Route path="StudentSubjects" element={<StudentSubjects />} /> {/* <-- ADD ROUTE */}
                    <Route path="quizzes" element={<StudentViewQuizzes />} />
                    <Route path="take-quiz/:quizId" element={<StudentTakeQuiz />} /> {/* Taking Quiz */}
                    <Route path="quiz-result/:attemptId" element={<StudentQuizResult />} /> {/* View Result */}
                    <Route path="StudentAttendance" element={<StudentAttendance />} />
                    <Route path="StudentGrades" element={<StudentGrades />} />
                    {/* ... other student routes ... */}
                    <Route path="*" element={<NotFound message="Student resource not found" />} />
                  </Route>
                </Route>
              </Routes>
              </ProfileProvider>
          }
        />

        {/* Teacher Routes - WRAPPED IN TeacherProfileProvider */}
        <Route
          path="/teacher/*" // Group teacher routes
          element={
            <TeacherProfileProvider> {/* <<< TEACHER PROVIDER */}
              <Routes>
                <Route element={<ProtectedRoute allowedUserType="teacher" />}>
                  <Route element={<TeacherLayout />}>
                    <Route index element={<TeacherDashboard />} />
                    <Route path="teacherDashboard" element={<TeacherDashboard />} />
                    <Route path="TeacherMainProfile" element={<TeacherMainProfile />} />
                    <Route path="TeacherEditProfile" element={<TeacherEditProfile />} />
                    <Route path="TeacherClasses" element={<TeacherClasses />} />
                    <Route path="students/:studentId/profile" element={<TeacherViewStudentDetails />} />
                    <Route path="TeacherViewSubjects" element={<TeacherViewSubjects />} />
                    <Route path="TeacherUploadSyllabus" element={<TeacherUploadSyllabus />} />
                    <Route path="TeacherUploadMaterials" element={<TeacherUploadMaterials />} />
                    <Route path="TeacherMarkAttendance" element={<TeacherMarkAttendance />} />
                    <Route path="TeacherViewAttendanceReports" element={<TeacherViewAttendanceReports />} />
                    <Route path="create-quiz" element={<TeacherCreateQuiz />} />
                    <Route path="quizzes" element={<TeacherViewQuizzes />} />
                    <Route path="quizzes/:quizId/results" element={<TeacherViewQuizResults />} />
                     {/* ... other teacher routes ... */}
                    <Route path="*" element={<NotFound message="Teacher resource not found" />} />
                  </Route>
                </Route>
              </Routes>
            </TeacherProfileProvider>
          }
        />

        {/* General Not Found Route (Top Level) */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;