import { Outlet } from "react-router-dom";
import TeacherSidebar from "./TeacherSidebar";
import TeacherNavbar from "./TeacherNavbar";
import TeacherChatbotWidget from '../chatbot/teacher/TeacherChatbotWidget';
import { useState } from "react";
import { FiMessageSquare, FiX } from 'react-icons/fi'; // Icons for chat toggle
import { motion, AnimatePresence } from 'framer-motion'; // For animation
function TeacherLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false); // <-- State for chatbot visibility
  // --- ADD THIS FUNCTION DEFINITION ---
const toggleChatbot = () => {
  setShowChatbot(prevShow => !prevShow); // Toggle the state value
};

{/* Chatbot Toggle Button */}
<motion.button
onClick={toggleChatbot} // <-- Ensure this uses the function name correctly
// ... other props ...
>
{showChatbot ? <FiX size={20} /> : <FiMessageSquare size={20} />}
</motion.button>

  const sidebarWidth = isSidebarOpen ? "250px" : "60px";
  const navbarHeight = "60px";

  // It's often helpful to ensure the body doesn't have default margins/padding
  // and takes full height. You might want this in your main CSS file (e.g., index.css):
  /*
  body {
    margin: 0;
    padding: 0;
    height: 100vh;
    overflow: hidden; // Prevent body scrollbar if layout fits viewport
  }
  */

  return (
    // Root element doesn't need much styling now
    <>
      {/* 👆 Navbar (Fixed on Top) */}
      <div style={{
        height: navbarHeight,
        backgroundColor: "#2563EB",
        color: "white",
        width: "100%", // Full width
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        boxSizing: 'border-box' // Include padding in height
      }}>
        <TeacherNavbar />
      </div>

      {/* 👈 Sidebar (Fixed on Left, Below Navbar) */}
      <div style={{
        width: sidebarWidth,
        backgroundColor: "#1E3A8A",
        color: "white",
        position: "fixed",
        left: 0,
        top: navbarHeight, // Positioned below the navbar
        bottom: 0, // Stretch to the bottom of the viewport
        transition: "width 0.3s ease",
        zIndex: 40,
        overflow: 'hidden' // Prevent sidebar itself from scrolling internally unless designed to
      }}>
        <TeacherSidebar isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      </div>

      {/* 📌 Dark Overlay (Visible only when sidebar is open) */}
      {isSidebarOpen && (
        <div
          style={{
            position: "fixed",
            top: 0, // Cover entire viewport
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 30,
          }}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 📌 Main Content Area (Fixed Position, provides background and scroll container) */}
      <div style={{
        position: "fixed",      // Position fixed relative to viewport
        top: navbarHeight,      // Below the navbar
        left: sidebarWidth,     // To the right of the sidebar (dynamic)
        right: 0,               // Stretch to the right edge
        bottom: 0,              // Stretch to the bottom edge
        zIndex: 10,
        backgroundColor: "#e9f3f6", // The FIXED background color
        transition: "left 0.3s ease", // Smooth transition for margin change
        overflow: "hidden"      // CRITICAL: This container itself should NOT scroll
      }}>
        {/* Inner Scrollable Div */}
        <div style={{
            height: "100%",         // Fill the fixed parent
            overflowY: "auto",      // Make ONLY this div scrollable
            padding: "20px",        // Padding applied inside the scrollable area
            boxSizing: "border-box" // Ensure padding doesn't add to height/width
        }}>
           <Outlet /> {/* Page content scrolls within this inner div */}
        </div>
         {/* --- Chatbot Integration --- */}
         <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
                 {/* Chatbot Window */}
                 <AnimatePresence>
                      {showChatbot && (
                          <motion.div
                               key="chatbot"
                               initial={{ opacity: 0, y: 30, scale: 0.9 }}
                               animate={{ opacity: 1, y: 0, scale: 1 }}
                               exit={{ opacity: 0, y: 20, scale: 0.9 }}
                               transition={{ duration: 0.2 }}
                               className="w-[340px] h-[450px] max-h-[80vh] bg-white rounded-lg shadow-2xl border border-gray-300 overflow-hidden flex flex-col" // Fixed size, example
                            >
                                <TeacherChatbotWidget />
                            </motion.div>
                      )}
                 </AnimatePresence>

                  {/* Chatbot Toggle Button */}
                  <motion.button
                       onClick={toggleChatbot}
                       whileHover={{ scale: 1.1 }}
                       whileTap={{ scale: 0.9 }}
                       className={`p-3 rounded-full text-white shadow-lg transition-colors ${showChatbot ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    >
                      {showChatbot ? <FiX size={20} /> : <FiMessageSquare size={20} />}
                  </motion.button>
             </div>
             {/* --- End Chatbot --- */}
      </div>
    </>
  );
}

export default TeacherLayout;