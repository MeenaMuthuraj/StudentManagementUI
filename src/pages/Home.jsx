import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";


const Home = () => {
  const navigate = useNavigate(); // ✅ Move outside
  return (
    <>
    <Navbar/>
    <div className="relative w-full h-screen bg-cover bg-center" style={{ backgroundImage: "url('/src/assets/Poster.jpg')" }}>
      <div className="absolute inset-0 bg-blue-900 bg-opacity-60 flex flex-col justify-center items-center text-white px-5">
        {/* Hero Section */}
        <div className="text-center max-w-2xl flex flex-col items-center md:items-start md:-ms-16 lg:-ms-64 lg:me-32">
          <h3 className="text-sm md:text-lg uppercase border-x-4 border-y-0 border-s-red-500 border-transparent ps-2 ms-2">WELCOME TO OUR SCHOOL</h3>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight mt-2">
            <span>A Perfect School </span><br/><span className="md:-ms-3">For Your Future.</span>
          </h1>
          <p className="mt-4 text-gray-300 text-sm md:text-base px-2 md:px-0 text-center md:text-left">
          Explore our top-class education and career-building subjects with expert faculty members.
          </p>
          <div className="mt-6 flex flex-col md:flex-row justify-center md:justify-start space-y-3 md:space-y-0 md:space-x-4">
            <button onClick={() => navigate("/AuthForm")} className="bg-red-500 px-6 py-2 rounded-full text-white w-full md:w-auto">Enroll Now</button>
            <button className="border-2 border-white px-6 py-2 rounded-full w-full md:w-auto">Learn More</button>
          </div>
        </div>
      </div>
    </div>
    </>
  );

};


export default Home;
