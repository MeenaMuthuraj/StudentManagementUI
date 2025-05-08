//src\components\Sidebar.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Home, Users, BookOpen, Clipboard, FileText, BarChart, Wallet } from "lucide-react";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [role, setRole] = useState(""); // 🔹 Default to empty string to avoid null issues

  // ✅ Fetch user role properly from localStorage & Debug if not found
  useEffect(() => {
    const storedRole = localStorage.getItem("userType");
    console.log("📌 Fetched Role from LocalStorage:", storedRole); // 🛠 Debugging log

    if (storedRole) {
      const formattedRole = storedRole.trim().toLowerCase(); // 🔹 Remove spaces & lowercase
      setRole(formattedRole);
    } else {
      console.warn("⚠️ No userType found in localStorage!"); // 🛠 Debugging warning
    }
  }, []);

  // ✅ Role-based menus
  const menus = {
    admin: [
      { name: "Dashboard", icon: <Home />, path: "/AdminDashboard" },
      { name: "User Management", icon: <Users />, path: "/UserManagement" },
      { name: "Course Management", icon: <BookOpen />, path: "/CourseManagement" },
      { name: "Class Management", icon: <Clipboard />, path: "/ClassManagement" },
      { name: "Attendance", icon: <FileText />, path: "/Attendance" },
      { name: "Exams & Results", icon: <BarChart />, path: "/ExamsResults" },
    ],
    teacher: [
      { name: "Dashboard", icon: <Home />, path: "/TeacherDashboard" },
      { name: "Assigned Classes", icon: <Users />, path: "/AssignedClasses" },
      { name: "Attendance", icon: <Clipboard />, path: "/TeacherAttendance" },
      { name: "Assignments", icon: <FileText />, path: "/Assignments" },
      { name: "Exams & Marks", icon: <BarChart />, path: "/TeacherExamsMarks" },
    ],
    student: [
      { name: "Dashboard", icon: <Home />, path: "/StudentDashboard" },
      { name: "My Courses", icon: <BookOpen />, path: "/MyCourses" },
      { name: "Attendance", icon: <Clipboard />, path: "/StudentAttendance" },
      { name: "Assignments", icon: <FileText />, path: "/StudentAssignments" },
      { name: "Exams & Results", icon: <BarChart />, path: "/StudentExamsResults" },
      { name: "Fee Payment", icon: <Wallet />, path: "/FeePayment" },
    ],
  };

  // ✅ Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".sidebar")) {
        setIsOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className={`sidebar ${isOpen ? "w-60" : "w-16"} bg-gray-900 h-screen p-4 fixed top-0 left-0 transition-all `}>
      <button onClick={() => setIsOpen(!isOpen)} className="text-white mb-4">
        {isOpen ? "<<" : ">>"}
      </button>

      <ul>
        {role && menus[role] ? (
          menus[role].map((menu, index) => (
            <li key={index} className="text-white flex items-center gap-2 p-2 hover:bg-gray-800 rounded">
              {menu.icon}
              {isOpen && <Link to={menu.path}>{menu.name}</Link>}
            </li>
          ))
        ) : (
          <li className="text-white p-2">⚠️ No menu available for role: {role || "N/A"}</li>
        )}
      </ul>
    </div>
  );
};

export default Sidebar;
