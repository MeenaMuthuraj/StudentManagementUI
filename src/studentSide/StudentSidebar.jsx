import React from 'react'; // Import React
import { Link, useLocation } from 'react-router-dom';
import {
    FiGrid, FiUser, FiBookOpen, FiTrendingUp, FiCheckSquare, FiMenu,FiFileText
} from 'react-icons/fi'; // Ensure all icons are imported

// Logo and Title Component (No changes needed here)
const LogoAndTitle = ({ isOpen }) => (
     <div className={`flex items-center flex-grow min-w-0 ${isOpen ? 'gap-2' : 'justify-center'} h-16 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
          {/* SVG Logo */}
          <svg className="w-7 h-7 md:w-8 md:h-8 flex-shrink-0 text-gray-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.627 48.627 0 0 1 12 20.904a48.627 48.627 0 0 1 8.232-4.41a60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.57 50.57 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.906 59.906 0 0 1 10.39 5.84a50.57 50.57 0 0 0-2.658.814m-15.482 0A50.697 50.697 0 0 1 12 13.489a50.697 50.697 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" /> </svg>
          {/* Title - visible only when open */}
         <span className={`font-bold text-lg text-white whitespace-nowrap ${isOpen ? 'block' : 'hidden'}`}>
             Student Portal
         </span>
     </div>
 );

// Sidebar component accepting only isOpen and toggleSidebar props
const StudentSidebar = ({ isOpen, toggleSidebar }) => {
     const location = useLocation(); // Hook to get current path

     // Menu items definition
     const menuItems = [
          { name: "Dashboard", icon: FiGrid, path: "/student/studentDashboard" },
          { name: "My Profile", icon: FiUser, path: "/student/StudentProfile" },
          { name: "My Subjects", icon: FiBookOpen, path: "/student/StudentSubjects" },
          { name: "Available Quizzes", icon: FiFileText, path: "/student/quizzes" },
          { name: "My Grades", icon: FiTrendingUp, path: "/student/StudentGrades" },
          { name: "My Attendance", icon: FiCheckSquare, path: "/student/StudentAttendance" },
     ];

     // Function to determine if a link is active
     const isActive = (path) => {
         // Normalize current path by removing trailing slash
         const currentPath = location.pathname.endsWith('/') ? location.pathname.slice(0, -1) : location.pathname;
         // Normalize item path
         const itemPath = path.endsWith('/') ? path.slice(0, -1) : path;

         // Handle exact match for index/dashboard routes
         if (itemPath === '/student' || itemPath === '/student/studentDashboard') {
            // Match '/student' or '/student/studentDashboard' exactly
            return currentPath === '/student' || currentPath === '/student/studentDashboard';
         }

          // For other routes, check if the current path starts with the item path
         return currentPath.startsWith(itemPath);
     };

     return (
         // Main sidebar container - Flex column, full height, background, shadow, overflow
         <div className={`flex flex-col h-full bg-gradient-to-b from-cyan-600 to-blue-800 shadow-lg overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'w-60' : 'w-20'}`}> {/* Dynamic width */}

              {/* Top Header Section - Fixed height, border, padding */}
              <div className={`flex items-center h-16 border-b border-blue-900/30 flex-shrink-0 px-3 ${isOpen ? 'justify-between' : 'justify-center'}`}>
                  {/* Render Logo/Title only when sidebar is open */}
                  {isOpen && <LogoAndTitle isOpen={isOpen} /> }
                  {/* Toggle Button */}
                  <button
                      onClick={toggleSidebar} // Use the prop function to toggle state in parent
                      className={`p-2 rounded-md text-white/80 hover:bg-blue-700/50 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 transition-colors ${isOpen ? 'ml-2' : ''}`} // Conditional margin if needed
                      aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
                  >
                      <FiMenu size={20} />
                  </button>
              </div>

              {/* Menu Items List - Scrollable */}
              <nav className="flex-grow mt-4 px-2 space-y-1.5 overflow-y-auto custom-scrollbar pb-4"> {/* Added padding-bottom */}
                   {menuItems.map((item) => (
                       <Link
                           key={item.name}
                           to={item.path}
                           className={`flex items-center px-3 py-2.5 rounded-lg transition-all duration-150 ease-in-out group ${
                                isActive(item.path) // Check if active
                                    ? 'bg-white/10 text-white font-semibold shadow-inner' // Active styles
                                    : 'text-blue-100 hover:bg-white/5 hover:text-white' // Default & Hover styles
                            } ${isOpen ? '' : 'justify-center'}` // Center icon when closed
                           }
                           title={!isOpen ? item.name : undefined} // Tooltip only when closed
                       >
                            {/* Icon */}
                            <item.icon
                                className={`w-5 h-5 flex-shrink-0 transition-colors duration-150 ease-in-out ${
                                    isActive(item.path) ? 'text-white' : 'text-blue-200 group-hover:text-white' // Icon color logic
                                }`}
                            />
                            {/* Text Label - Animated fade/hide */}
                             <span className={`ml-3 text-sm font-medium whitespace-nowrap transition-all duration-200 ease-in-out ${
                                 isOpen ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0 pointer-events-none' // Smooth hide/show
                                }`}
                            >
                                {item.name}
                            </span>
                        </Link>
                   ))}
               </nav>
               {/* Optional: Footer section if needed */}
               {/* <div className="p-4 border-t border-blue-900/30 flex-shrink-0"> ... </div> */}
         </div>
     );
 };

 export default StudentSidebar;