//src\pages\AuthForm.jsx
import { useState } from "react";
import { FaGoogle } from "react-icons/fa";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import LoginImage from "../assets/LoginImage.jpg";

export default function AuthForm() {
  const location = useLocation();
  const [wasSignUp, setWasSignUp] = useState(location.state?.isSignUp || false);
  const [isSignUp, setIsSignUp] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [userType, setUserType] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { password, confirmPassword, email, username } = formData;
    let newErrors = {};
  
    if (isSignUp && !username) newErrors.username = "Username is required";
    if (!email) newErrors.email = "Email is required";
    if (!password) newErrors.password = "Password is required";
    if (!userType.trim()) newErrors.userType = "Please select a role";
  
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/;
    if (password && !passwordRegex.test(password)) {
      newErrors.password =
        "Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.";
    }
    if (isSignUp && password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
  
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
  
    console.log("🔄 Sending Signup Request...", { username, email, password, userType });
  
    fetch("http://localhost:5000/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password, userType }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("✅ Signup Response:", data);
        if (data.success) {
          setShowModal(true);
        } else {
          alert(data.message);
        }
      })
      .catch((error) => console.error("❌ Signup Error:", error));
  };
  
  const handleLogin = (e) => {
    e.preventDefault();
    const { email, password } = formData;
  
    console.log("🔄 Sending Login Request...", { email, password, userType });
  
    fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, userType }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("✅ Login Response:", data);
        if (data.success) {
          console.log("Token received from backend:", data.token);
          localStorage.setItem("authToken", data.token); // 🔐 Store JWT
          navigate(`/${data.userType}/${data.userType}Dashboard`);
        } else {
          alert("Invalid credentials");
        }
      })
      .catch((error) => console.error("❌ Login Error:", error));
  };
  

  const handleModalClose = () => {
    setShowModal(false);
    setIsSignUp(false);
    setFormData({ username: "", email: "", password: "", confirmPassword: "" });
    setUserType("");
  };

  return (
    <>
    <div className="flex h-screen text-white items-center justify-center bg-gray-200">
      <div className="relative w-[800px] h-[500px] rounded-lg shadow-lg overflow-hidden flex">
        <motion.div
          initial={false}
          animate={{ x: isSignUp ? "0%" : "100%" }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className={`absolute top-0 left-0 w-1/2 h-full bg-cover bg-center`}
          style={{ backgroundImage: `url(${LoginImage})` }}
        ></motion.div>

        <motion.div
          initial={false}
          animate={{ x: isSignUp ? "100%" : "0%" }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="absolute top-0 left-0 w-1/2 h-full flex items-center justify-center p-6 bg-white"
        >
          <form className="w-full" onSubmit={isSignUp ? handleSubmit : handleLogin}>
            <h2 className="text-2xl font-bold text-center text-gray-600">{isSignUp ? "Sign Up" : "Sign In"}</h2>

            {isSignUp && (
              <>
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  className="mt-4 p-3 w-full bg-white border rounded-lg focus:outline-none focus:border-blue-500 text-black"
                  onChange={handleChange}
                />
                {errors.username && <p className="text-red-500 text-sm">{errors.username}</p>}
              </>
            )}

            <input
              type="email"
              name="email"
              placeholder="Email"
              className="mt-4 p-3 w-full bg-white border rounded-lg focus:outline-none focus:border-blue-500 text-black"
              onChange={handleChange}
            />
            {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}

            <input
              type="password"
              name="password"
              placeholder="Password"
              className="mt-4 p-3 w-full bg-white border rounded-lg focus:outline-none focus:border-blue-500 text-black"
              onChange={handleChange}
            />
            {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}

            {isSignUp && (
              <>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  className="mt-4 p-3 w-full bg-white border rounded-lg focus:outline-none focus:border-blue-500 text-black"
                  onChange={handleChange}
                />
                {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword}</p>}
              </>
            )}

<div className="mt-4">
  <span className="text-gray-400">User Type:</span>
  <div className="flex gap-4 mt-2">
    <label className="flex items-center text-gray-500">
      <input
        type="radio"
        name="userType"
        value="admin"
        className="mr-1"
        onChange={(e) => {
            setUserType(e.target.value);
            setErrors((prevErrors) => ({ ...prevErrors, userType: "" })); // ✅ Clear role error on selection
          }}
          // ✅ FIXED
      />
      Admin
    </label>
    <label className="flex items-center text-gray-500">
      <input
        type="radio"
        name="userType"
        value="teacher"
        className="mr-1"
        onChange={(e) => {
            setUserType(e.target.value);
            setErrors((prevErrors) => ({ ...prevErrors, userType: "" })); // ✅ Clear role error on selection
          }}
          // ✅ FIXED
      />
      Teacher
    </label>
    <label className="flex items-center text-gray-500">
      <input
        type="radio"
        name="userType"
        value="student"
        className="mr-1"
        onChange={(e) => {
            setUserType(e.target.value);
            setErrors((prevErrors) => ({ ...prevErrors, userType: "" })); // ✅ Clear role error on selection
          }}
           // ✅ FIXED
      />
      Student
    </label>
  </div>
  {errors.userType && <p className="text-red-500 text-sm mt-1">{errors.userType}</p>}
</div>


            {errors.userType && <p className="text-red-500 text-sm">{errors.userType}</p>}

            <button type="submit" className="mt-4 w-full bg-blue-500 hover:bg-blue-600 p-3 rounded text-white">
              {isSignUp ? "Register" : "Login"}
            </button>

            <p className="text-sm mt-4 text-gray-700 cursor-pointer" onClick={() => setIsSignUp(!isSignUp)}>
              {isSignUp ? "Already have an account? " : "Don't have an account? "}
              <span className="text-blue-500">{isSignUp ? "Login" : "Sign Up"}</span>
            </p>
          </form>
        </motion.div>
      </div>
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <h2 className="text-xl font-bold text-gray-700">Registration Successful!</h2>
            <p className="text-gray-600 mt-2">You can now log in with your credentials.</p>
            <button className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded" onClick={handleModalClose}>OK</button>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
