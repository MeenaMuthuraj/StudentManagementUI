import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, Users, Book, FileText, Clipboard, ChevronDown, LayoutDashboard, FilePen } from "lucide-react";

const TeacherSidebar = ({ isOpen, toggleSidebar }) => {
  const [openMenus, setOpenMenus] = useState({});
  const location = useLocation();

  // --- Define Menu Structure ---
  // SubItems now include a 'path' property for navigation
  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/teacher/teacherDashboard", subItems: [] },
    { name: "Profile", icon: Users, path: "/teacher/TeacherMainProfile", subItems: [] },
    {
      name: "Classes",
      icon: Book,
      // Parent item has no path, only subItems
      subItems: [
        // Ensure these paths match your App.jsx routes exactly
        { name: "Classes", path: "/teacher/TeacherClasses" },
        { name: "Subjects", path: "/teacher/TeacherViewSubjects" }, // Verify/update path
        { name: "Syllabus", path: "/teacher/TeacherUploadSyllabus" }, // Verify/update path
        { name: "Materials", path: "/teacher/TeacherUploadMaterials" } // Verify/update path
      ]
    },
    {
      name: "Attendance",
      icon: Clipboard,
      subItems: [
        { name: "Mark", path: "/teacher/TeacherMarkAttendance" }, // Verify/update path
        { name: "Report", path: "/teacher/TeacherViewAttendanceReports" } // Verify/update path
      ]
    },
    {
      name: "Tasks",
      icon: FileText,
      subItems: [
        { name: "New Task", path: "/teacher/TeacherCreateAssignments" }, // Verify/update path
        { name: "Evaluate", path: "/teacher/TeacherEvaluateAssignments" }, // Verify/update path
        { name: "Notes", path: "/teacher/TeacherUploadStudyMaterials" } // Verify/update path
      ]
    },
    {
      name: "Exams",
      icon: FilePen,
      subItems: [
        { name: "Conduct", path: "/teacher/TeacherConductExams" }, // Verify/update path
        { name: "Marks", path: "/teacher/TeacherUploadMarks" }, // Verify/update path
        { name: "Feedback", path: "/teacher/TeacherGiveFeedback" } // Verify/update path
      ]
    },
  ];

  // --- Effect for Closing Sidebar on Outside Click ---
  useEffect(() => {
    if (!isOpen) {
      setOpenMenus({}); // Close all submenus when sidebar collapses
    }
    const handleClickOutside = (event) => {
      // Check if sidebar is open and click is outside sidebar and navbar toggle button
      if (isOpen && !event.target.closest(".sidebar") && !event.target.closest(".navbar-menu-button")) {
        toggleSidebar(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, toggleSidebar]);

  // --- Toggle Submenu Handler ---
  const toggleSubMenu = (index) => {
    if (!isOpen) {
      toggleSidebar(true); // Open sidebar first if closed
      // Optionally auto-open the submenu after a short delay
      setTimeout(() => setOpenMenus({ [index]: true }), 300);
    } else {
      // Toggle the clicked submenu (using accordion style)
      setOpenMenus((prev) => ({
        ...Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: false }), {}), // Close all others
        [index]: !prev[index] // Toggle the clicked one
      }));
    }
  };

  // --- Render Sidebar ---
  return (
    <div
      // Apply Tailwind classes for styling, positioning, transition, and conditional width/shadow
      className={`fixed top-0 left-0 h-screen bg-gray-50 border-r border-gray-200 transition-all duration-300 ease-in-out sidebar z-40
        ${isOpen ? "w-64 shadow-lg" : "w-16 overflow-hidden"}`}
    >
      {/* Sidebar Toggle/Header */}
      <div className={`flex ${isOpen ? 'justify-end' : 'justify-center'} p-3 h-16 items-center border-b border-gray-200 flex-shrink-0`}> {/* Fixed height like navbar */}
        <button
          onClick={() => toggleSidebar(!isOpen)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors navbar-menu-button" // Class for outside click logic
          aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
        >
          <Menu className="text-gray-600 w-5 h-5" />
        </button>
      </div>

      {/* Menu List */}
      <ul className="flex-1 h-[calc(100vh-4rem)] overflow-y-auto overflow-x-hidden pt-2.5 pb-4"> {/* Use calc for height */}
        {menuItems.map((item, index) => {
          // --- Determine Active States ---
          const isSubMenuActive = !item.path && item.subItems.some(subItem => location.pathname === subItem.path);
          const isMainActive = item.path && location.pathname === item.path;
          // Highlight parent if submenu is open OR a sub-item is the active page
          const shouldHighlightParent = !!openMenus[index] || isSubMenuActive;

          return (
            <li key={item.name || index} className="px-1.5 py-1"> {/* Adjusted list item padding */}

              {/* --- Main Menu Item --- */}
              {item.path ? (
                  // Item is a direct link
                 <Link
                    to={item.path}
                    // Apply active styles based on isMainActive
                    className={`flex items-center justify-between p-2.5 rounded-lg transition-colors duration-200 group ${
                        isMainActive
                        ? 'bg-blue-50 text-blue-600 font-medium' // Active style for direct links
                        : 'hover:bg-gray-100 text-gray-700'     // Default hover for direct links
                    }`}
                    onClick={() => {if(isOpen) toggleSidebar(false)}} // Close on mobile click
                >
                    <div className="flex items-center gap-3.5">
                        {/* Icon color based on active state */}
                        <item.icon className={`w-5 h-5 flex-shrink-0 ${isMainActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'}`} />
                        {/* Show text only if sidebar is open */}
                        {isOpen && <span className="text-sm whitespace-nowrap">{item.name}</span>}
                    </div>
                 </Link>
              ) : (
                  // Item has subItems, render as a button to toggle submenu
                 <button
                    type="button" // Important for accessibility
                    // Apply active styles based on shouldHighlightParent
                    // *** USE THE SAME ACTIVE STYLE AS DIRECT LINKS ***
                    className={`w-full flex items-center justify-between cursor-pointer p-2.5 rounded-lg transition-colors duration-200 group ${
                        shouldHighlightParent
                        ? 'bg-blue-50 text-blue-600 font-medium' // Active style for parent (matches direct link)
                        : 'hover:bg-gray-100 text-gray-700'     // Default hover style
                    }`}
                    onClick={() => toggleSubMenu(index)} // Call toggle function
                    aria-expanded={!!openMenus[index]} // Accessibility attribute
                    aria-controls={`submenu-${index}`} // Links button to the submenu ul
                >
                    <div className="flex items-center gap-3.5">
                        {/* Icon color based on highlight state */}
                        <item.icon className={`w-5 h-5 flex-shrink-0 ${
                            shouldHighlightParent
                            ? 'text-blue-600' // Active icon color
                            : 'text-gray-500 group-hover:text-gray-700' // Default icon color
                        }`} />
                        {/* Show text only if sidebar is open */}
                        {/* Text color is inherited from button, font-medium added conditionally */}
                        {isOpen && <span className={`text-sm whitespace-nowrap ${shouldHighlightParent ? 'font-medium' : ''}`}>{item.name}</span>}
                    </div>
                    {/* Chevron icon for indicating submenu, shown only if sidebar is open */}
                    {isOpen && item.subItems.length > 0 && (
                        <ChevronDown
                          // Chevron color and rotation based on state
                          className={`w-4 h-4 transition-transform duration-200 flex-shrink-0 ${openMenus[index] ? "rotate-180" : ""} ${
                              shouldHighlightParent
                              ? 'text-blue-600' // Active chevron color
                              : 'text-gray-400 group-hover:text-gray-600' // Default chevron color
                          }`}
                        />
                    )}
                 </button>
              )}

              {/* Render Submenu Items if Open */}
              {isOpen && item.subItems.length > 0 && openMenus[index] && (
                <ul id={`submenu-${index}`} className="ml-6 pl-3 border-l border-gray-200 mt-1 space-y-1 py-1">
                  {item.subItems.map((subItem) => {
                    // Check if this specific sub-item link is the active page
                    const isActive = location.pathname === subItem.path;
                    return (
                      <li key={subItem.name}>
                        <Link
                          to={subItem.path} // Use the path defined in the subItem object
                          // Apply active styles if this sub-item's path matches current location
                          className={`block px-3 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap ${isActive ? 'bg-blue-100 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
                          onClick={() => isOpen && toggleSidebar(false)} // Close sidebar on link click if open
                        >
                          {subItem.name} {/* Display sub-item name */}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default TeacherSidebar;