// src/studentSide/StudentQuizResult.jsx
import React from 'react';
import { useLocation, useNavigate, Link, useParams } from 'react-router-dom';
import GaugeChart from 'react-gauge-chart'; // Import the gauge chart
import { FiAward, FiCheckCircle, FiList, FiHome } from 'react-icons/fi';
import { motion } from 'framer-motion';

function StudentQuizResult() {
    const location = useLocation();
    const navigate = useNavigate();
    const { attemptId } = useParams(); // Get attempt ID if needed later for fetching full details

    // Get results passed via navigation state from StudentTakeQuiz
    const results = location.state;

    // Fallback if state is missing (e.g., page refresh) - ideally fetch results using attemptId
    if (!results) {
        // TODO: Implement fetching results based on attemptId if state is lost
        return (
            <div className="p-6 text-center">
                <p className="text-red-600">Result data not found. Please go back to the quiz list.</p>
                <Link to="/student/quizzes" className="text-indigo-600 hover:underline mt-4 inline-block">
                    Back to Quizzes
                </Link>
            </div>
        );
    }

    const { score, totalQuestions, percentage, quizTitle } = results;
    const scoreColor = percentage >= 80 ? "#22c55e" : percentage >= 50 ? "#f59e0b" : "#ef4444"; // Green, Amber, Red

    return (
        <div className="p-4 md:p-6 lg:p-8 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-gradient-to-br from-green-50 via-teal-50 to-cyan-100">
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, type: "spring", stiffness: 150 }}
                className="bg-white p-6 md:p-10 rounded-2xl shadow-2xl border border-gray-200 text-center w-full max-w-lg"
            >
                <FiAward className="text-yellow-500 text-6xl mx-auto mb-5" />
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Quiz Completed!</h1>
                <p className="text-sm text-gray-500 mb-6">Results for: <span className="font-medium text-gray-700">{quizTitle || 'Quiz'}</span></p>

                {/* --- Gauge Chart for Score --- */}
                <div className="w-[250px] sm:w-[300px] mx-auto mb-6">
                    <GaugeChart
                        id="score-gauge"
                        nrOfLevels={20} // More levels for smoother gradient
                        arcsLength={[0.5, 0.3, 0.2]} // Adjust arc lengths (Red, Yellow, Green)
                        colors={[ "#ef4444", "#f59e0b", "#22c55e"]} // Red, Yellow, Green
                        percent={percentage / 100} // Value between 0 and 1
                        arcPadding={0.02}
                        cornerRadius={3}
                        needleColor="#6366F1" // Indigo needle
                        needleBaseColor="#6366F1"
                        textColor="#374151" // Dark gray text
                        animate={true}
                        animDelay={500} // Start animation after 500ms
                        animateDuration={2000} // Animation duration
                        formatTextValue={value => `${Math.round(value)}%`} // Show percentage inside
                    />
                </div>
                {/* ---------------------------- */}

                <p className="text-xl font-semibold text-gray-700 mb-1">
                    Your Score: <span style={{ color: scoreColor }} className="font-bold">{score}</span> / {totalQuestions}
                </p>
                <p className="text-3xl font-bold mb-8" style={{ color: scoreColor }}>
                    {percentage}%
                </p>

                {/* Add more feedback if needed - e.g., view detailed answers */}
                {/* <button className="text-sm text-indigo-600 hover:underline mb-6">View Detailed Answers (NI)</button> */}

                <div className="flex justify-center gap-4">
                    <Link to="/student/quizzes" className="inline-flex items-center gap-1.5 px-5 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition">
                        <FiList size={16}/> Back to Quizzes
                    </Link>
                     <Link to="/student/studentDashboard" className="inline-flex items-center gap-1.5 px-5 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition">
                         <FiHome size={16}/> Go to Dashboard
                     </Link>
                </div>
            </motion.div>
        </div>
    );
}

export default StudentQuizResult;