// src/teacherSide/TeacherViewQuizResults.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import {
    FiUsers, FiClipboard, FiPercent, FiCheckCircle, FiXCircle, FiLoader,
    FiAlertCircle, FiArrowLeft, FiBarChart2, FiCalendar, FiAward, FiInfo, FiDownload // Added download
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

// Helper to format date/time more nicely
const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    try {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: 'numeric', minute: '2-digit', hour12: true
        });
    } catch (e) { return "Invalid Date"; }
};

// --- Main Component ---
function TeacherViewQuizResults() {
    const { quizId } = useParams();
    const navigate = useNavigate();

    const [quizDetails, setQuizDetails] = useState(null);
    const [attempts, setAttempts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Fetch quiz results data
    const fetchResults = useCallback(async () => {
        setIsLoading(true);
        setError('');
        console.log(`[QuizResults] Fetching results for Quiz ID: ${quizId}`);
        try {
            const response = await api.get(`/teacher/quizzes/${quizId}/results`);
            console.log("[QuizResults] API Response:", response.data);

            // Validate response structure
            if (!response.data || !response.data.quizDetails || !Array.isArray(response.data.attempts)) {
                 console.error("[QuizResults] Invalid data structure received from API.");
                 throw new Error("Invalid data structure received from server.");
            }

            setQuizDetails(response.data.quizDetails);
            setAttempts(response.data.attempts);

            if (!response.data.quizDetails) { setError("Quiz details not found or access denied."); } // Check if quiz details are missing

        } catch (err) {
            console.error("[QuizResults] Error fetching results:", err);
            setError(err.response?.data?.message || "Could not load quiz results.");
            setQuizDetails(null); setAttempts([]); // Clear data on error
        } finally {
            setIsLoading(false);
        }
    }, [quizId]);

    useEffect(() => {
        if (quizId) { fetchResults(); }
        else { setError("Quiz ID missing from URL."); setIsLoading(false); }
    }, [quizId, fetchResults]);

    // --- Calculate Stats (Example) ---
    const averageScore = useCallback(() => {
        if (!attempts || attempts.length === 0) return 0;
        const totalPercentage = attempts.reduce((sum, attempt) => sum + (attempt.percentage || 0), 0);
        return Math.round(totalPercentage / attempts.length);
    }, [attempts]);

    const passRate = useCallback(() => {
         if (!attempts || attempts.length === 0) return 0;
         const passingScore = 50; // Example passing percentage
         const passedCount = attempts.filter(attempt => (attempt.percentage || 0) >= passingScore).length;
         return Math.round((passedCount / attempts.length) * 100);
    }, [attempts]);

    // --- Render Logic ---
    if (isLoading) {
        return (
             <div className="p-10 flex flex-col justify-center items-center min-h-screen bg-gray-50">
                 <FiLoader className="animate-spin text-4xl text-indigo-500 mb-4"/>
                 <p className="text-gray-500">Loading Quiz Results...</p>
             </div>
        );
    }

    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 min-h-screen">
            {/* Back Button & Header */}
            <div className='mb-6 pb-4 border-b border-gray-300'>
                <button onClick={() => navigate('/teacher/quizzes')} className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium mb-3 hover:underline">
                    <FiArrowLeft size={16} /> Back to Quizzes List
                </button>
                {quizDetails ? (
                    <>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                            Results: <span className='text-indigo-700'>{quizDetails.title}</span>
                        </h1>
                        <p className='text-sm text-gray-500 mt-1'>
                            <span className='font-medium'>Class:</span> {quizDetails.classId?.name || 'N/A'} |
                            <span className='font-medium ml-2'>Subject:</span> {quizDetails.subjectName || 'N/A'} |
                            <span className='font-medium ml-2'>Total Marks:</span> {quizDetails.totalMarks ?? <span className='text-red-500 font-semibold'>N/A</span>}
                        </p>
                    </>
                ) : (
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Quiz Results</h1>
                )}
            </div>

            {/* Error Display */}
            <AnimatePresence>
                {error && (
                    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="p-4 bg-red-100 border-l-4 border-red-500 text-red-700 text-sm rounded flex items-center justify-between shadow-md">
                        <span className='flex items-center'><FiAlertCircle className="mr-2 flex-shrink-0"/>{error}</span>
                        <button onClick={() => setError('')} className='font-bold text-xl opacity-70 hover:opacity-100 ml-2'>×</button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Only render summary and table if quizDetails loaded successfully */}
            {quizDetails && !error && (
                <>
                    {/* --- Summary Stats Cards --- */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay:0.1}} className="bg-white p-4 rounded-lg shadow border border-gray-200 flex items-center gap-4">
                             <div className="p-3 rounded-full bg-blue-100 text-blue-600"><FiUsers size={20}/></div>
                             <div>
                                 <div className="text-2xl font-bold text-gray-800">{attempts.length}</div>
                                 <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Submissions</div>
                             </div>
                        </motion.div>
                         <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay:0.2}} className="bg-white p-4 rounded-lg shadow border border-gray-200 flex items-center gap-4">
                             <div className="p-3 rounded-full bg-purple-100 text-purple-600"><FiBarChart2 size={20}/></div>
                             <div>
                                 <div className="text-2xl font-bold text-gray-800">{averageScore()}%</div>
                                 <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Average Score</div>
                             </div>
                        </motion.div>
                         <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay:0.3}} className="bg-white p-4 rounded-lg shadow border border-gray-200 flex items-center gap-4">
                             <div className="p-3 rounded-full bg-green-100 text-green-600"><FiCheckCircle size={20}/></div>
                             <div>
                                 <div className="text-2xl font-bold text-gray-800">{passRate()}%</div>
                                 <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pass Rate</div>
                             </div>
                        </motion.div>
                    </div>

                    {/* --- Results Table --- */}
                    <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay:0.4}} className="bg-white rounded-xl shadow-xl border border-gray-200/80 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                    <tr>
                                        <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Student Name</th>
                                        <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                                        <th scope="col" className="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Score</th>
                                        <th scope="col" className="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Percentage</th>
                                        <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Submitted At</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {attempts.length === 0 && (
                                        <tr><td colSpan="5" className="text-center py-12 text-sm text-gray-400 italic">No submissions received yet.</td></tr>
                                    )}
                                    <AnimatePresence>
                                    {attempts.map((attempt) => {
                                        // Safely access nested properties
                                        const studentName = attempt.studentId?.profile?.fullName || attempt.studentId?.username || <span className='italic text-gray-400'>Student Deleted?</span>;
                                        const studentEmail = attempt.studentId?.email || 'N/A';
                                        // Use totalMarks from the parent quizDetails for consistency
                                        const attemptTotalMarks = quizDetails?.totalMarks ?? attempt.totalQuestions; // Fallback to attempt's count if quiz total missing
                                        const score = attempt.score ?? 0;
                                        const percentage = attempt.percentage ?? 0;
                                        const scoreColor = percentage >= 80 ? "text-green-600" : percentage >= 50 ? "text-yellow-600" : "text-red-600";

                                        return (
                                            <motion.tr
                                                key={attempt._id}
                                                layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                                className="hover:bg-indigo-50/40 transition-colors duration-100"
                                            >
                                                <td className="px-5 py-3.5 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{studentName}</div>
                                                </td>
                                                <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-500">{studentEmail}</td>
                                                <td className={`px-5 py-3.5 whitespace-nowrap text-sm font-semibold text-center ${scoreColor}`}>
                                                    {/* Display score out of quiz's total marks */}
                                                    {score} / {attemptTotalMarks}
                                                </td>
                                                <td className={`px-5 py-3.5 whitespace-nowrap text-sm font-bold text-center ${scoreColor}`}>
                                                    {percentage}%
                                                </td>
                                                <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-500">
                                                    {formatDateTime(attempt.submittedAt)}
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                        {/* Optional: Add pagination controls if many attempts */}
                    </motion.div>
                </>
             )}
        </div>
    );
}

export default TeacherViewQuizResults;