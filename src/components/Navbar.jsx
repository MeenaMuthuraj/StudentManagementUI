//src\components\Navbar.jsx
import { useState } from "react";
import { FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <nav className=" text-white w-full fixed top-0 left-0 z-50 ">
      <div className="container mx-auto px-5 lg:px-20 py-4 flex justify-between items-center">
        
        {/* 🍔 Mobile Menu Button */}
        <button 
          className="lg:hidden text-2xl" 
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>

        {/* 🔗 Navbar Links */}
        <ul className={`lg:flex space-x-8 hidden ms-48`}>
          {["Home", "Courses", "Services", "Contact", "Blog"].map((item, index) => (
            <li key={index} className="relative group cursor-pointer">
              <a href="#" className="text-lg font-medium">{item}</a>
              <span className="absolute left-0 bottom-0 w-0 h-[2px] bg-red-500 group-hover:w-full transition-all duration-300 ease-in-out"></span>
            </li>
          ))}
        </ul>

        {/* 👤 Login & Sign Up */}
        <div className="flex items-center space-x-4 -me-32">
          <button
            className="hidden lg:flex items-center space-x-2 bg-red-500 px-4 py-2 rounded-full text-white"
            onClick={() => navigate("/AuthForm", { state: { wasSignUp: false } })}
          >
            <FaUserCircle className="text-xl" />
            <span>Log In</span>
          </button>
          <button
            className="px-4 py-2 border border-white text-white rounded-full transition-all duration-300 hover:bg-red-500 hover:border-red-500"
            onClick={() => navigate("/AuthForm", { state: { wasSignUp: true } })}
          >
            Sign Up
          </button>
        </div>
      </div>

      {/* 📱 Mobile Menu */}
      {menuOpen && (
        <div className="lg:hidden absolute w-full bg-black bg-opacity-90 top-16 left-0 ">
          <ul className="flex flex-col items-center space-y-4 py-4">
            {["Home", "Courses", "Services", "Contact", "Blog"].map((item, index) => (
              <li key={index} className="relative group cursor-pointer">
                <a href="#" className="text-lg font-medium">{item}</a>
                <span className="absolute left-0 bottom-0 w-0 h-[2px] bg-red-500 group-hover:w-full transition-all duration-300 ease-in-out"></span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
