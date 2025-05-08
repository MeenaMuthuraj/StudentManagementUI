// src/teacherSide/TeacherNavbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FiUser, FiLogOut, FiSettings } from 'react-icons/fi'; // Use consistent icons
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTeacherProfile } from '../context/TeacherProfileContext'; // Use TEACHER Context
import defaultAvatar from '../assets/user.jpg';

const TeacherNavbar = () => { // Removed props it doesn't need
    const navigate = useNavigate();
    const teacherContext = useTeacherProfile();

    // Safe destructuring
    const {
        teacherProfile = null,
        getFullTeacherProfileImageUrl = () => defaultAvatar,
        // Get setters if needed for logout context update
    } = teacherContext || {};

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        // Update context if needed
        setIsDropdownOpen(false);
        navigate("/");
    };

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        if (isDropdownOpen) { document.addEventListener("mousedown", handleClickOutside); }
        return () => { document.removeEventListener("mousedown", handleClickOutside); };
    }, [isDropdownOpen]);

    // Get dynamic values from context
    const userName = teacherProfile?.profile?.fullName || teacherProfile?.username || "Teacher";
    const profileImageUrl = getFullTeacherProfileImageUrl();

    return (
        // Uses w-full and h-16 provided by the Layout's container div
        <nav className="w-full h-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between px-4 sm:px-6 shadow-sm">
            {/* Left Side - Placeholder (Maybe for breadcrumbs or title later?) */}
            <div className="flex items-center">
                {/* <span className="font-semibold text-lg">Dashboard</span> */}
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-4 md:gap-6">
                {/* Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-2 focus:outline-none rounded-full p-0.5 hover:ring-2 hover:ring-offset-2 hover:ring-offset-indigo-700 hover:ring-white/80 transition"
                        aria-haspopup="true" aria-expanded={isDropdownOpen}
                    >
                        <img src={profileImageUrl} alt="Profile" className="w-8 h-8 md:w-9 md:h-9 rounded-full border-2 border-white/70 object-cover bg-gray-300"/>
                        <span className="hidden sm:inline text-sm font-medium text-white mr-1">{userName}</span>
                    </button>

                    {/* Dropdown Menu */}
                    <AnimatePresence>
                        {isDropdownOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -5, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{duration: 0.15}}
                                className="absolute right-0 mt-2 w-56 origin-top-right bg-white rounded-md shadow-xl overflow-hidden border border-gray-200 z-50" role="menu">
                                {/* Header */}
                                <div className="px-4 py-3 border-b border-gray-100">
                                    <p className="text-sm font-semibold text-gray-800 truncate">{userName}</p>
                                    <p className="text-xs text-gray-500 truncate">{teacherProfile?.email || 'Loading...'}</p>
                                </div>
                                {/* Links */}
                                <div className="py-1" role="none">
                                    <Link to="/teacher/TeacherMainProfile" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left" onClick={() => setIsDropdownOpen(false)} role="menuitem">
                                        <FiUser size={14} className="text-gray-500"/> My Profile
                                    </Link>
                                    <Link to="/teacher/TeacherEditProfile" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left" onClick={() => setIsDropdownOpen(false)} role="menuitem">
                                        <FiSettings size={14} className="text-gray-500"/> Edit Profile
                                    </Link>
                                </div>
                                {/* Logout */}
                                <div className="border-t border-gray-100" role="none">
                                    <button onClick={handleLogout} className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50" role="menuitem" >
                                        <FiLogOut size={14}/> Logout
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </nav>
    );
};

export default TeacherNavbar;