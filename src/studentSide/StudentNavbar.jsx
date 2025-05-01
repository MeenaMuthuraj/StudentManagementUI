// src/studentSide/StudentNavbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FiBell, FiUser, FiLogOut } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import defaultAvatar from '../assets/user.jpg';
import { motion, AnimatePresence } from 'framer-motion';

const StudentNavbar = ({ sidebarOpen }) => { // Doesn't need toggle info
    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [studentName, setStudentName] = useState("Student");
    const dropdownRef = useRef(null);

    const handleLogout = () => { localStorage.removeItem('authToken'); navigate("/"); };

    useEffect(() => {
        const handleClickOutside = (event) => { if (dropdownRef.current && !dropdownRef.current.contains(event.target)) { setIsDropdownOpen(false); } };
        document.addEventListener("mousedown", handleClickOutside);
        return () => { document.removeEventListener("mousedown", handleClickOutside); };
    }, []);

    return (
         // Gray background, h-16 to match sidebar header
          <nav className="bg-[#188ff7] text-white  h-16 flex items-center justify-between px-4 sm:px-6 shadow-sm"> {/* No border needed if overlapping sidebar border */}
             {/* Left side - Placeholder */}
             <div className="flex items-center">
                  {/* Nothing needed here now */}
              </div>

             {/* Right side - Profile Dropdown etc */}
              <div className="flex items-center gap-4">
                  {/* Maybe notification bell later */}
                  <div className="relative" ref={dropdownRef}>
                     <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-2 focus:outline-none rounded-full p-0.5 hover:ring-2 hover:ring-gray-400">
                          <img src={defaultAvatar} alt="Profile" className="w-8 h-8 rounded-full border-2 border-gray-500 object-cover"/>
                           <span className="hidden sm:inline text-sm font-medium text-gray-100 hover:text-white">{studentName}</span>
                      </button>
                      <AnimatePresence>
                          {isDropdownOpen && ( /* White dropdown */
                               <motion.div initial={{ opacity: 0, y: -5, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{duration: 0.1}} className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg overflow-hidden border border-gray-200 z-50">
                                 <div className="py-1">
                                     <Link to="/student/StudentProfile" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setIsDropdownOpen(false)}> <FiUser size={14}/> My Profile </Link>
                                      <hr className="border-gray-100"/>
                                      <button onClick={handleLogout} className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50" > <FiLogOut size={14}/> Logout </button>
                                 </div>
                              </motion.div>
                           )}
                      </AnimatePresence>
                  </div>
              </div>
         </nav>
     );
 };

 export default StudentNavbar;