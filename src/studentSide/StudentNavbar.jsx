// src/studentSide/StudentNavbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FiBell, FiUser, FiLogOut, FiSettings } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfile } from '../context/ProfileContext'; // <--- VERIFY THIS IMPORT PATH

const StudentNavbar = () => {
    const navigate = useNavigate();
    // --- Use the context hook ---
    const contextValue = useProfile(); // Get the whole context value first for safety

    // --- Destructure AFTER checking if contextValue is defined ---
    // Provide default values during destructuring to prevent errors if context is somehow unavailable initially
    const {
        userProfile = null,
        getFullProfileImageUrl = () => defaultAvatar, // Use a default function if needed
        setIsAuthenticated = () => {},
        setUserProfile: setContextUserProfile = () => {}
    } = contextValue || {}; // Use empty object as fallback if contextValue is null/undefined

    // Log the context value for debugging (optional)
    useEffect(() => {
        console.log("StudentNavbar received context value:", contextValue);
        if (!contextValue) {
             console.error("CRITICAL: ProfileContext value is unavailable in StudentNavbar. Check Provider in App.jsx.");
        }
    }, [contextValue]);


    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Logout handler
    const handleLogout = () => {
        localStorage.removeItem('authToken');
        setIsAuthenticated(false); // Update context state
        setContextUserProfile(null); // Clear profile in context
        setIsDropdownOpen(false); // Close dropdown
        navigate("/"); // Redirect
    };

    // Effect to close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        if (isDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isDropdownOpen]);

    // Get dynamic values safely from destructured context or defaults
    const studentName = userProfile?.profile?.fullName || userProfile?.username || "Student";
    const profileImageUrl = getFullProfileImageUrl(); // Use helper from context

    return (
        <nav className="bg-gradient-to-r from-cyan-600 to-blue-700 text-white h-16 flex items-center justify-between px-4 sm:px-6 shadow-md sticky top-0 z-30">
            {/* Left side - Placeholder */}
            <div className="flex items-center">
                {/* <span className="text-lg font-semibold">Student Portal</span> */}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4 md:gap-6">
                {/* Optional Bell Icon */}
                {/* <button className='p-2 rounded-full hover:bg-blue-700 transition-colors' title="Notifications"><FiBell size={18}/></button> */}

                {/* Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-2 focus:outline-none rounded-full p-0.5 hover:ring-2 hover:ring-offset-2 hover:ring-offset-blue-700 hover:ring-white/80 transition"
                        aria-haspopup="true"
                        aria-expanded={isDropdownOpen}
                    >
                        <img
                            src={profileImageUrl}
                            alt="Profile"
                            className="w-8 h-8 md:w-9 md:h-9 rounded-full border-2 border-white/80 object-cover bg-gray-300"
                        />
                        <span className="hidden sm:inline text-sm font-medium text-white mr-1">
                            {studentName}
                        </span>
                    </button>

                    {/* Dropdown Menu */}
                    <AnimatePresence>
                        {isDropdownOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -5, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.1 } }}
                                transition={{ duration: 0.15 }}
                                className="absolute right-0 mt-2 w-56 origin-top-right bg-white rounded-md shadow-xl overflow-hidden border border-gray-200 z-50"
                                role="menu"
                            >
                                {/* Optional Header */}
                                <div className="px-4 py-3 border-b border-gray-100">
                                    <p className="text-sm font-medium text-gray-800 truncate">{studentName}</p>
                                    <p className="text-xs text-gray-500 truncate">{userProfile?.email || 'Loading...'}</p>
                                </div>
                                {/* Links */}
                                <div className="py-1" role="none">
                                    <Link to="/student/StudentProfile" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left" onClick={() => setIsDropdownOpen(false)} role="menuitem">
                                        <FiUser size={14} className="text-gray-500"/> My Profile
                                    </Link>
                                    <Link to="/student/StudentEditProfile" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left" onClick={() => setIsDropdownOpen(false)} role="menuitem">
                                        <FiSettings size={14} className="text-gray-500"/> Edit Profile
                                    </Link>
                                </div>
                                {/* Logout */}
                                <div className="border-t border-gray-100" role="none">
                                    <button onClick={handleLogout} className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50" role="menuitem">
                                        <FiLogOut size={14}/> Logout
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div> {/* End Relative container */}
            </div> {/* End Right Side */}
        </nav>
    );
};

export default StudentNavbar;