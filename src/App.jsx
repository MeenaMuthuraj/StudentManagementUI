// src/App.jsx

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// --- Import Page/Layout Components ---
import Home from "./pages/Home";
import AuthForm from "./pages/AuthForm";
import Dashboard from "./pages/Dashboard"; // Assuming this is a generic or public page?
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./teacherSide/ProtectedRoute"; // <-- Ensure this path is correct

// --- Import Admin Components (Assuming Admin uses its own layout/protection) ---
import AdminDashboard from "./adminSide/AdminDashboard"; 
// import AdminLayout from "./adminSide/AdminLayout"; // Example if you have one


// --- Student Imports --- *NEW*
import StudentLayout from "./studentSide/StudentLayout";
import StudentDashboard from "./studentSide/StudentDashboard";
import StudentProfile from "./studentSide/StudentProfile";
import StudentEditProfile from "./studentSide/StudentEditProfile";
import StudentSubjects from "./studentSide/StudentSubjects";
import StudentGrades from "./studentSide/StudentGrades";
import StudentAttendance from "./studentSide/StudentAttendance";
// --- Import Teacher Components ---
import TeacherLayout from "./teacherSide/TeacherLayout"; // Layout with Sidebar/Navbar
import TeacherDashboard from "./teacherSide/TeacherDashboard";
import TeacherMainProfile from "./teacherSide/TeacherMainProfile";
import TeacherEditProfile from "./teacherSide/TeacherEditProfile";
import TeacherViewAssignedClasses from "./teacherSide/TeacherViewAssignedClasses";
import TeacherViewSubjects from "./teacherSide/TeacherViewSubjects";
import TeacherUploadSyllabus from "./teacherSide/TeacherUploadSyllabus";
import TeacherUploadMaterials from "./teacherSide/TeacherUploadMaterials";
import TeacherMarkAttendance from "./teacherSide/TeacherMarkAttendance";
import TeacherViewAttendanceReports from "./teacherSide/TeacherViewAttendanceReports";
import TeacherCreateAssignments from "./teacherSide/TeacherCreateAssignments";
import TeacherEvaluateAssignments from "./teacherSide/TeacherEvaluateAssignments";
import TeacherUploadStudyMaterials from "./teacherSide/TeacherUploadStudyMaterials"; // Assuming you have this
import TeacherConductExams from "./teacherSide/TeacherConductExams";
import TeacherUploadMarks from "./teacherSide/TeacherUploadMarks";
import TeacherGiveFeedback from "./teacherSide/TeacherGiveFeedback";
import TeacherViewStudentProgress from "./teacherSide/TeacherViewStudentProgress";
import TeacherCommunicateWithParents from "./teacherSide/TeacherCommunicateWithParents"; // Assuming you have this
import TeacherClasses from "./teacherSide/TeacherClasses"; // Assuming you have this


// --- App Component ---
function App() {
  return (
    <Router>
      <Routes>
        {/* ======================================== */}
        {/*          🌍 PUBLIC ROUTES                */}
        {/* ======================================== */}
        <Route path="/" element={<Home />} />
        <Route path="/AuthForm" element={<AuthForm />} /> 
        {/* Consider if '/Dashboard' needs protection or is public */}
        <Route path="/Dashboard" element={<Dashboard />} /> 

        {/* ======================================== */}
        {/*          🔒 ADMIN ROUTES                 */}
        {/* ======================================== */}
        {/* Example: Wrap Admin routes with protection */}
        {/* 
        <Route element={<ProtectedRoute allowedUserType="admin" />}>
          <Route path="/admin" element={<AdminLayout />}> 
             <Route path="dashboard" element={<AdminDashboard />} />
             // Add other nested admin routes here
          </Route>
        </Route> 
        */}
        {/* Or if AdminDashboard handles everything including layout/protection */}
         <Route path="/adminDashboard" element={<AdminDashboard />} /> 


        {/* ======================================== */}
        {/*          🔒 STUDENT ROUTES               */}
        {/* ======================================== */}
        {/* Example: Wrap Student routes with protection */}
        {/* 
        <Route element={<ProtectedRoute allowedUserType="student" />}>
          <Route path="/student" element={<StudentLayout />}> 
             <Route path="dashboard" element={<StudentDashboard />} />
             // Add other nested student routes here
          </Route>
        </Route> 
        */}
        {/* Or if StudentDashboard handles everything including layout/protection */}
         <Route path="/studentDashboard" element={<StudentDashboard />} />
         <Route path="StudentProfile" element={<StudentProfile />} /> {/* VIEW */}
         <Route path="StudentEditProfile" element={<StudentEditProfile />} /> {/* EDIT */}

        {/* ======================================== */}
        {/*          🔒 TEACHER ROUTES               */}
        {/* ======================================== */}
        {/* Apply ProtectedRoute wrapper for the entire teacher section */}
        <Route element={<ProtectedRoute allowedUserType="teacher" />}> 
          {/* The TeacherLayout provides the common UI (sidebar, navbar) */}
          {/* All routes nested inside will only be accessible if the user is an authenticated teacher */}
          <Route path="/teacher" element={<TeacherLayout />}> 
            
            {/* Index route for "/teacher" - defaults to dashboard */}
            {/* Use 'index' for the default child route */}
            <Route index element={<TeacherDashboard />} /> 
            
            {/* Specific Teacher Routes (relative to "/teacher") */}
            <Route path="teacherDashboard" element={<TeacherDashboard />} /> 
            <Route path="TeacherMainProfile" element={<TeacherMainProfile />} />
            <Route path="TeacherEditProfile" element={<TeacherEditProfile />} />
            <Route path="TeacherViewAssignedClasses" element={<TeacherViewAssignedClasses />} />
            <Route path="TeacherViewSubjects" element={<TeacherViewSubjects />} />
            <Route path="TeacherUploadSyllabus" element={<TeacherUploadSyllabus />} />
            <Route path="TeacherUploadMaterials" element={<TeacherUploadMaterials />} />
            <Route path="TeacherMarkAttendance" element={<TeacherMarkAttendance />} />
            <Route path="TeacherViewAttendanceReports" element={<TeacherViewAttendanceReports />} />
            <Route path="TeacherCreateAssignments" element={<TeacherCreateAssignments />} />
            <Route path="TeacherEvaluateAssignments" element={<TeacherEvaluateAssignments />} />
            <Route path="TeacherUploadStudyMaterials" element={<TeacherUploadStudyMaterials />} />
            <Route path="TeacherConductExams" element={<TeacherConductExams />} />
            <Route path="TeacherUploadMarks" element={<TeacherUploadMarks />} />
            <Route path="TeacherGiveFeedback" element={<TeacherGiveFeedback />} />
            <Route path="TeacherViewStudentProgress" element={<TeacherViewStudentProgress />} />
            <Route path="TeacherCommunicateWithParents" element={<TeacherCommunicateWithParents />} />
            <Route path="TeacherClasses" element={<TeacherClasses />} />


            {/* Optional: Catch-all for any invalid paths starting with /teacher/ */}
            <Route path="*" element={<NotFound message="Teacher resource not found" />} /> 
          </Route>
        </Route>
        
    {/* ======================================== */}
    {/*          🔒 STUDENT ROUTES - *NEW*        */}
    {/* ======================================== */}
    <Route element={<ProtectedRoute allowedUserType="student" />}> {/* Use correct userType */}
         <Route path="/student" element={<StudentLayout />}>

             {/* Default page for /student */}
            <Route index element={<StudentDashboard />} />

            {/* Specific Student pages */}
             <Route path="studentDashboard" element={<StudentDashboard />} />
             <Route path="StudentProfile" element={<StudentProfile />} />
             <Route path="StudentEditProfile" element={<StudentEditProfile />} /> {/* The student's form */}
             <Route path="StudentSubjects" element={<StudentSubjects />} />
             <Route path="StudentGrades" element={<StudentGrades />} />
             <Route path="StudentAttendance" element={<StudentAttendance />} />

             {/* Optional: Catch-all for invalid paths starting with /student/ */}
            <Route path="*" element={<NotFound message="Student resource not found" />} />
         </Route>
    </Route>

        {/* ======================================== */}
        {/*          🚨 404 NOT FOUND ROUTE          */}
        {/* ======================================== */}
        {/* This catches any top-level route that doesn't match the above */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
    
  );
}

export default App;