// src/studentSide/StudentLayout.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import StudentSidebar from './StudentSidebar';
import StudentNavbar from './StudentNavbar';

// --- Define Tailwind classes for widths ---
const sidebarOpenWidthClass = 'w-60';
const sidebarClosedWidthClass = 'w-20';

// --- Helper to determine padding for main content ---
const getMainContentPaddingClass = (isOpen) => {
    return isOpen ? 'pl-60' : 'pl-20'; // Matches sidebar widths
};

function StudentLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Default to open
    const sidebarRef = useRef(null); // Ref for the sidebar div
    const toggleButtonRef = useRef(null); // Ref for the button INSIDE sidebar

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                isSidebarOpen &&
                sidebarRef.current && // Check if sidebar exists
                !sidebarRef.current.contains(event.target) // Check if click is outside sidebar
            ) {
                 // Since the button is inside the sidebar, clicking it won't trigger this condition.
                 setIsSidebarOpen(false);
            }
        };

        // Add listener only when sidebar is open
        if (isSidebarOpen) {
             document.addEventListener('mousedown', handleClickOutside);
        }
        // Cleanup listener
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isSidebarOpen]); // Re-run effect when isSidebarOpen changes

    return (
         // Use relative on the root only if necessary for absolute children inside Outlet maybe,
         // but h-screen and overflow-hidden usually handle viewport needs
         <div className="min-h-screen bg-gray-100">

             {/* --- Sidebar --- */}
             {/* Fixed position, covers full height, applies width/transition/z-index */}
             <div
                 ref={sidebarRef} // Assign ref for click outside detection
                 // Apply dynamic width, ensure high enough z-index (e.g., 40)
                  className={`fixed top-0 left-0 bottom-0 z-40 shadow-lg transition-all duration-300 ease-in-out ${isSidebarOpen ? sidebarOpenWidthClass : sidebarClosedWidthClass}`}
             >
                  {/* Pass props needed by sidebar, including the button ref */}
                  <StudentSidebar
                       isOpen={isSidebarOpen}
                       toggleSidebar={toggleSidebar}
                       toggleButtonRef={toggleButtonRef} // Pass ref down
                   />
             </div>

             {/* --- Main Content Wrapper (Navbar + Outlet) --- */}
              {/* Uses absolute positioning and dynamic padding-left based on sidebar state */}
              {/* Positioned relative to the viewport */}
              {/* Needs a z-index lower than sidebar (e.g., 30 or less) */}
              <div className={`absolute top-0 right-0 bottom-0 left-0 transition-all duration-300 ease-in-out ${getMainContentPaddingClass(isSidebarOpen)} flex flex-col z-30`}>

                  {/* Navbar - Standard height, flex-shrink-0 prevents shrinking */}
                   <div className="h-16 flex-shrink-0 shadow-sm z-10"> {/* Added z-10 to be above main content */}
                      {/* Pass state needed for potential Navbar adjustments (though likely none now) */}
                      <StudentNavbar sidebarOpen={isSidebarOpen} />
                   </div>

                   {/* Scrollable Content Area */}
                   <main className="flex-1 overflow-y-auto bg-gray-100"> {/* Handles scrolling */}
                       <div className="px-4 py-4 sm:px-6 sm:py-6"> {/* Content padding */}
                           <Outlet />
                        </div>
                    </main>
              </div>
          </div>
      );
  }

 export default StudentLayout;