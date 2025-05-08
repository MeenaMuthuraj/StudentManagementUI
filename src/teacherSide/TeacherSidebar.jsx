// src/teacherSide/TeacherSidebar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    FiGrid, FiUser, FiBookOpen, FiTrendingUp, FiCheckSquare, FiMenu,
    FiChevronDown, FiEdit3, FiClipboard, FiBook // Ensure all icons are imported
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

// --- Logo and Title Component ---
const LogoAndTitle = ({ isOpen }) => (
    <div className={`flex items-center flex-grow min-w-0 ${isOpen ? 'gap-2' : 'justify-center'} h-16 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
         {/* SVG Logo */}
         <svg className="w-7 h-7 md:w-8 md:h-8 flex-shrink-0 text-gray-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
        <span className={`font-bold text-lg text-white whitespace-nowrap ${isOpen ? 'block' : 'hidden'}`}>
            Teacher Portal
        </span>
    </div>
);

// --- Sidebar Component ---
const TeacherSidebar = ({ isOpen, toggleSidebar }) => {
    const location = useLocation();
    const [openMenus, setOpenMenus] = useState({});

    // --- Menu Definition ---
    const menuItems = [
        { name: "Dashboard", icon: FiGrid, path: "/teacher/teacherDashboard" },
        { name: "Profile", icon: FiUser, path: "/teacher/TeacherMainProfile" },
        {
          name: "Classes", icon: FiBook,
          subItems: [
            { name: "Manage Classes", path: "/teacher/TeacherClasses" },
            { name: "Manage Subjects", path: "/teacher/TeacherViewSubjects" },
            { name: "Upload Syllabus", path: "/teacher/TeacherUploadSyllabus" },
            { name: "Upload Materials", path: "/teacher/TeacherUploadMaterials" }
          ]
        },
        {
          name: "Attendance", icon: FiClipboard,
          subItems: [
            { name: "Mark", path: "/teacher/TeacherMarkAttendance" },
            { name: "Reports", path: "/teacher/TeacherViewAttendanceReports" }
          ]
        },
        {
          name: "Quizzes / Exams", icon: FiEdit3,
          subItems: [
            { name: "Create Quiz", path: "/teacher/create-quiz" },
            { name: "View Quizzes", path: "/teacher/quizzes" },
          ]
        },
    ];

    // --- Function to check active state ---
    const isActive = (path) => {
        if (!path) return false; // Handle items without path (parents)
        const currentPath = location.pathname.endsWith('/') && location.pathname.length > 1 ? location.pathname.slice(0, -1) : location.pathname;
        const itemPath = path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;
        if (itemPath === '/teacher' || itemPath === '/teacher/teacherDashboard') {
           return currentPath === '/teacher' || currentPath === '/teacher/teacherDashboard';
        }
        return currentPath.startsWith(itemPath);
    };

    // --- Function to toggle submenus ---
    const toggleSubMenu = (index) => {
        if (!isOpen) {
            toggleSidebar();
            setTimeout(() => setOpenMenus({ [index]: true }), 150);
        } else {
            setOpenMenus(prev => ({ [index]: !prev[index] })); // Simple toggle, not accordion
        }
    };

    // --- Function to handle navigation click ---
    const handleNavClick = () => {
        if (isOpen) { toggleSidebar(); }
        setOpenMenus({}); // Close all submenus on navigation
    };

    // --- Effect to close submenus when sidebar closes ---
    useEffect(() => {
        if (!isOpen) { setOpenMenus({}); }
    }, [isOpen]);

    return (
        <div className={`flex flex-col h-full bg-gradient-to-b from-blue-600 to-indigo-700 shadow-lg overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'w-64' : 'w-20'}`}>
            {/* Header */}
            <div className={`flex items-center h-16 border-b border-indigo-800/50 flex-shrink-0 px-3 ${isOpen ? 'justify-between' : 'justify-center'}`}>
                {isOpen && <LogoAndTitle isOpen={isOpen} />}
                <button onClick={toggleSidebar} className={`p-2 rounded-md text-indigo-100 hover:bg-indigo-600/70 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors ${isOpen ? 'ml-2' : ''}`} aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}>
                    <FiMenu size={20} />
                </button>
            </div>

            {/* Menu Items List - Scrollable */}
            <nav className="flex-grow mt-4 px-2 space-y-1 overflow-y-auto custom-scrollbar pb-4">
                {/* *** CORRECTED MAPPING LOGIC STARTS HERE *** */}
                <ul className="list-none p-0 m-0"> {/* Ensure ul has no default browser styles */}
                    {menuItems.map((item, index) => {
                        const hasSubItems = item.subItems && item.subItems.length > 0;
                        const isSubMenuActive = hasSubItems && item.subItems.some(sub => isActive(sub.path));
                        const isTopLevelActive = !hasSubItems && item.path && isActive(item.path);
                        const isParentHighlighted = !!openMenus[index] || isSubMenuActive || isTopLevelActive;

                        return (
                            <li key={item.name || index} className="list-none mb-1"> {/* Each item is an li */}

                                {hasSubItems ? (
                                    // --- Render BUTTON for items WITH submenus ---
                                    <button
                                        type="button"
                                        onClick={() => toggleSubMenu(index)}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-150 ease-in-out group ${
                                            isParentHighlighted ? 'bg-white/10 text-white font-semibold' : 'text-indigo-100 hover:bg-white/5 hover:text-white'
                                        } ${isOpen ? '' : 'justify-center'}`}
                                        aria-expanded={!!openMenus[index]}
                                        title={!isOpen ? item.name : undefined}
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon className={`w-5 h-5 flex-shrink-0 transition-colors ${isParentHighlighted ? 'text-white' : 'text-indigo-300 group-hover:text-indigo-100'}`} />
                                            <span className={`text-sm font-medium whitespace-nowrap transition-all duration-200 ${isOpen ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0 pointer-events-none'}`}>{item.name}</span>
                                        </div>
                                        {isOpen && (
                                            <FiChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${openMenus[index] ? "rotate-180" : ""} ${isParentHighlighted ? 'text-indigo-100' : 'text-indigo-300 group-hover:text-indigo-100'}`} />
                                        )}
                                    </button>
                                ) : (
                                    // --- Render LINK for items WITHOUT submenus ---
                                    <Link
                                        to={item.path}
                                        onClick={handleNavClick}
                                        className={`flex items-center px-3 py-2.5 rounded-lg transition-all duration-150 ease-in-out group ${
                                            isParentHighlighted ? 'bg-white/10 text-white font-semibold' : 'text-indigo-100 hover:bg-white/5 hover:text-white'
                                        } ${isOpen ? '' : 'justify-center'}`}
                                        title={!isOpen ? item.name : undefined}
                                    >
                                        <item.icon className={`w-5 h-5 flex-shrink-0 transition-colors ${isParentHighlighted ? 'text-white' : 'text-indigo-300 group-hover:text-indigo-100'}`} />
                                        <span className={`ml-3 text-sm font-medium whitespace-nowrap transition-all duration-200 ${isOpen ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0 pointer-events-none'}`}>{item.name}</span>
                                    </Link>
                                )}

                                {/* Submenu List (Animated) - Render only if it has subitems and is open */}
                                {hasSubItems && (
                                    <AnimatePresence>
                                        {isOpen && openMenus[index] && (
                                            <motion.ul
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2, ease: "easeOut" }}
                                                className="list-none p-0 m-0 ml-5 pl-3 border-l border-indigo-600/50 mt-1 space-y-1 overflow-hidden" // Submenu styling
                                            >
                                                {item.subItems.map((subItem) => {
                                                    const isSubItemActive = isActive(subItem.path);
                                                    return (
                                                        <li key={subItem.name} className="list-none">
                                                            <Link
                                                                to={subItem.path}
                                                                onClick={handleNavClick} // Close sidebar on click
                                                                className={`block px-3 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap ${
                                                                    isSubItemActive ? 'text-white font-medium bg-white/15' : 'text-indigo-200 hover:text-white hover:bg-white/5'
                                                                }`}
                                                            >
                                                                {subItem.name}
                                                            </Link>
                                                        </li>
                                                    );
                                                })}
                                            </motion.ul> // Correctly closed ul
                                        )}
                                    </AnimatePresence>
                                )}
                            </li> // Correctly closed li
                        );
                    })}
                </ul> {/* Correctly closed main ul */}
                 {/* *** CORRECTED MAPPING LOGIC ENDS HERE *** */}
            </nav>
        </div>
    );
};

export default TeacherSidebar;