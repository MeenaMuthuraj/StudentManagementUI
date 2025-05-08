// src/teacherSide/TeacherLayout.jsx
import React, { useState, useEffect, useRef } from 'react'; // Added useEffect, useRef
import { Outlet } from "react-router-dom";
import TeacherSidebar from "./TeacherSidebar";
import TeacherNavbar from "./TeacherNavbar";
import { TeacherChatbotWidget } from '../chatbot/teacher/TeacherChatbotWidget'; // Adjust path if needed
import { FiMessageSquare, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

// Define sidebar width classes for Tailwind
const sidebarOpenWidthClass = 'w-64'; // lg:w-64 etc. if needed
const sidebarClosedWidthClass = 'w-20'; // lg:w-20 etc. if needed

// Define corresponding padding classes for the main content area
const mainContentPaddingOpen = 'pl-64'; // Must match open width
const mainContentPaddingClosed = 'pl-20'; // Must match closed width

function TeacherLayout() {
    // State for controlling sidebar visibility
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Default to open or closed
    // State for chatbot visibility
    const [showChatbot, setShowChatbot] = useState(false);
    // Ref for the sidebar DOM element for click-outside detection
    const sidebarRef = useRef(null);

    // Function to toggle the sidebar state
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    // Function to toggle the chatbot state
    const toggleChatbot = () => {
        setShowChatbot(prevShow => !prevShow);
    };

    // Effect to handle clicking outside the sidebar to close it
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Check if sidebar is open, ref exists, and click is outside the sidebar element
            if (isSidebarOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                 // We don't need to check for the toggle button click specifically,
                 // as the toggle button is *inside* the sidebarRef element.
                 console.log("Clicked outside sidebar, closing."); // Debug log
                setIsSidebarOpen(false);
            }
        };

        // Add listener only when sidebar is open
        if (isSidebarOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            console.log("Click outside listener added."); // Debug log
        } else {
             document.removeEventListener('mousedown', handleClickOutside); // Clean up listener when closed
             console.log("Click outside listener removed."); // Debug log
        }

        // Cleanup function to remove listener when component unmounts or sidebar closes
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
             console.log("Click outside listener removed on cleanup."); // Debug log
        };
    }, [isSidebarOpen]); // Re-run this effect whenever isSidebarOpen changes


    // Dynamically set the padding class for the main content area
    const mainContentPaddingClass = isSidebarOpen ? mainContentPaddingOpen : mainContentPaddingClosed;

    return (
        <div className="min-h-screen bg-gray-100"> {/* Ensure background covers screen */}

            {/* --- Sidebar --- */}
            {/* Fixed position, takes full height, dynamic width via Tailwind classes */}
            {/* Assign the ref here */}
            <div ref={sidebarRef} className={`fixed top-0 left-0 h-full ${isSidebarOpen ? sidebarOpenWidthClass : sidebarClosedWidthClass} transition-all duration-300 ease-in-out z-40`}>
                <TeacherSidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
            </div>

            {/* --- Main Content Wrapper (Navbar + Outlet) --- */}
            {/* Dynamic left padding based on sidebar state, flex column layout */}
             {/* Apply transition-all for smooth padding change */}
            <div className={`flex flex-col h-screen ${mainContentPaddingClass} transition-all duration-300 ease-in-out`}>

                {/* --- Navbar --- */}
                {/* Fixed height, no shrinking */}
                <div className="flex-shrink-0 h-16 shadow-sm z-30"> {/* Ensure z-index allows dropdown over content */}
                    <TeacherNavbar /* No props needed unless Navbar controls sidebar */ />
                </div>

                {/* --- Scrollable Content Area --- */}
                <main className="flex-1 overflow-y-auto bg-gray-100 relative"> {/* Content scrolls */}
                    {/* Padding inside the scrollable area */}
                    <div className="px-4 py-4 sm:px-6 sm:py-6">
                        <Outlet /> {/* Renders the matched child route */}
                    </div>

                    {/* --- Chatbot --- */}
                    {/* Fixed position at bottom right */}
                    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
                        <AnimatePresence>
                            {showChatbot && (
                                <motion.div
                                    key="chatbot-window"
                                    initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.2 }}
                                    className="w-[340px] sm:w-[350px] h-[500px] max-h-[calc(100vh-80px)] bg-white rounded-xl shadow-2xl border border-gray-300 overflow-hidden flex flex-col"
                                >
                                    <TeacherChatbotWidget />
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <motion.button
                            onClick={toggleChatbot} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                            className={`p-3 rounded-full text-white shadow-lg transition-colors duration-200 ${showChatbot ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                            aria-label={showChatbot ? "Close Chatbot" : "Open Chatbot"}
                        >
                            {showChatbot ? <FiX size={20} /> : <FiMessageSquare size={20} />}
                        </motion.button>
                    </div>
                    {/* --- End Chatbot --- */}
                </main>
            </div>
        </div>
    );
}

export default TeacherLayout;