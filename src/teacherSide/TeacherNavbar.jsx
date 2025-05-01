import { useState, useEffect, useRef } from "react";
import { Menu, Search, Moon, Calendar } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import TeacherSidebar from "./TeacherSidebar";

const TeacherNavbar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [profileImage, setProfileImage] = useState(
    localStorage.getItem("profileImage") || "/profile.jpg"
  );
  const [userName, setUserName] = useState("Guest User"); // Default name
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);
  
  useEffect(() => {
    const savedProfile = JSON.parse(localStorage.getItem("teacherProfile"));
    if (savedProfile && savedProfile.profilePic) {
      setProfileImage(savedProfile.profilePic);
    }
  }, []);
  
  useEffect(() => {
    // Fetch user name from local storage
    const storedUser = localStorage.getItem("userName");
    if (storedUser) {
      setUserName(storedUser);
    }
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);
  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
  const handleLogout = () => {
    navigate("/");
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle Profile Image Change
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        localStorage.setItem("profileImage", reader.result);
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 w-full bg-[#2192ef] text-white  transition-all duration-300 ease-in-out
 p-4 flex justify-between items-center shadow-md z-50 navbar">
        {/* Left Side */}
        <div className="flex items-center gap-5">
          <button onClick={toggleSidebar}>
            <Menu className="text-white" />
          </button>
          <button>
            <Search className="text-white" />
          </button>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-6 relative">
          <button onClick={toggleDarkMode}>
            <Moon className="text-white" />
          </button>
          <button>
            <Calendar className="text-white" />
          </button>

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <img
              src={profileImage}
              alt="Profile"
              className="w-8 h-8 rounded-full cursor-pointer"
              onClick={toggleDropdown}
            />
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 bg-white text-black shadow-lg rounded-lg w-56 text-center overflow-hidden">
                {/* Background Image with Profile in Center */}
                <div
                  className="relative w-full h-20 bg-cover bg-center"
                  style={{
                    backgroundImage: "url('/src/assets/blue.jpg')",
                  }}
                >
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-16 h-16 rounded-full overflow-hidden border-2 border-white">
                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                </div>

                {/* Username from Local Storage */}
                <p className="mt-10 text-lg font-semibold">{userName}</p>

                {/* Options */}
                <div className="mt-3 border-t border-gray-300 pt-2">
                 
                  <Link to="/teacher/TeacherMainProfile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded-md">
                    My Profile
                  </Link>
                </div>

                {/* Logout Button Centered */}
                <button
                  onClick={handleLogout}
                  className="w-full mt-3 py-2 text-sm text-red-600 hover:bg-gray-200 rounded-md"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <TeacherSidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
    </div>
  );
};

export default TeacherNavbar;
