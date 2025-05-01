// src/studentSide/StudentSidebar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    FiGrid, FiUser, FiBook, FiTrendingUp, FiCheckSquare, FiMenu
} from 'react-icons/fi';

// Logo and Title Component
const LogoAndTitle = ({ isOpen }) => (
     <div className={`flex items-center flex-grow min-w-0 ${isOpen ? 'gap-2' : 'justify-center'} h-16 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}> {/* Fade title/logo out */}
          <svg className="w-7 h-7 md:w-8 md:h-8 flex-shrink-0 text-gray-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.627 48.627 0 0 1 12 20.904a48.627 48.627 0 0 1 8.232-4.41a60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.57 50.57 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.906 59.906 0 0 1 10.39 5.84a50.57 50.57 0 0 0-2.658.814m-15.482 0A50.697 50.697 0 0 1 12 13.489a50.697 50.697 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" /> </svg>
          {/* Ensure whitespace-nowrap prevents wrapping */}
         <span className={`font-bold text-lg text-white whitespace-nowrap`}>Student Portal</span>
     </div>
 );

 // Accept toggleButtonRef prop
 const StudentSidebar = ({ isOpen, toggleSidebar, toggleButtonRef }) => {
     const location = useLocation();
     const menuItems = [
          { name: "Dashboard", icon: FiGrid, path: "/student/studentDashboard" },
          { name: "My Profile", icon: FiUser, path: "/student/StudentProfile" },
          { name: "My Subjects", icon: FiBook, path: "/student/StudentSubjects" },
          { name: "My Grades", icon: FiTrendingUp, path: "/student/StudentGrades" },
          { name: "My Attendance", icon: FiCheckSquare, path: "/student/StudentAttendance" },
     ];
     const isActive = (path) => location.pathname === path || (path !== '/student/studentDashboard' && location.pathname.startsWith(path));

     return (
         // Gray background
         <div className={`flex flex-col h-full bg-[#34a3f8] shadow-lg overflow-hidden`}> {/* Added overflow-hidden */}

              {/* Top Header Section */}
              {/* Ensure this section doesn't shrink */}
              <div className={`flex items-center h-16 border-b border-gray-600 flex-shrink-0 px-3 ${isOpen ? 'justify-between' : 'justify-center'}`}>
                   {/* Only render LogoAndTitle if open, otherwise button is centered */}
                    {isOpen && <LogoAndTitle isOpen={isOpen} /> }
                   {/* Toggle Button */}
                  <button
                      ref={toggleButtonRef} // Assign ref
                      onClick={toggleSidebar}
                      // Use consistent padding regardless of state
                      className={`p-2 rounded-md text-white hover:bg-blue-300 hover:text-white transition-colors  ${isOpen ? 'ml-2' : ''}`} // Add ml-2 only if open maybe
                      aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
                    >
                      <FiMenu size={20} />
                  </button>
               </div>


              {/* Menu Items */}
              <nav className="flex-grow mt-4 px-2 space-y-1 overflow-y-auto custom-scrollbar">
                   {menuItems.map((item) => (
                       <Link key={item.name} to={item.path} className={`flex items-center px-3 py-2.5 rounded-md transition-all duration-150 ease-in-out group ${ isActive(item.path) ? 'bg-blue-300 text-white font-semibold' : 'text-gray-200 hover:bg-blue-300 hover:text-white' } ${isOpen ? '' : 'justify-center'}` } title={!isOpen ? item.name : ''}>
                            <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive(item.path) ? 'text-white' : 'text-white group-hover:text-gray-100'}`}/>
                             {/* Slightly faster fade in */}
                             <span className={`ml-3 text-sm font-medium whitespace-nowrap transition-opacity duration-200 ${ isOpen ? 'opacity-100 delay-75' : 'opacity-0 absolute pointer-events-none -left-96'}`}>{item.name}</span>
                         </Link>
                   ))}
               </nav>
           </div>
      );
  };

  export default StudentSidebar;