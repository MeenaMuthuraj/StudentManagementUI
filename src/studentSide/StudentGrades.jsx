// src/studentSide/StudentGrades.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import {
    FiAward, FiBarChart2, FiCalendar, FiPercent, FiFileText, FiEye, FiAlertCircle, FiLoader, FiInbox
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

// Helper to format date
const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    } catch (e) { return "Invalid Date"; }
};

// --- Main Component ---
function StudentGrades() {
    const navigate = useNavigate();
    const [quizAttempts, setQuizAttempts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Fetch student's quiz attempts
    const fetchQuizAttempts = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await api.get('/student/my-quiz-attempts');
            console.log("[StudentGrades] Fetched quiz attempts:", response.data);
            setQuizAttempts(response.data || []);
        } catch (err) {
            console.error("[StudentGrades] Error fetching quiz attempts:", err);
            setError(err.response?.data?.message || "Could not load your grades.");
            setQuizAttempts([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchQuizAttempts();
    }, [fetchQuizAttempts]);

    const handleViewDetails = (attemptId, quizId) => {
        // TODO: Navigate to a detailed result page if needed
        // For now, we can just log or alert
        alert(`View details for Attempt ID: ${attemptId} of Quiz ID: ${quizId} (Feature to be implemented)`);
        // navigate(`/student/quiz-result/${attemptId}`);
    };

    // --- Render Logic ---
    return (
        <div className="p-4 md:p-6 space-y-6 bg-gradient-to-br from-purple-50 via-pink-50 to-red-100 min-h-screen font-sans">
            {/* Header */}
            <div className="pb-4 mb-4 border-b border-gray-300">
                <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-700">
                    My Quiz Grades
                </h1>
                <p className="text-sm text-gray-600 mt-1">A summary of your performance in completed quizzes.</p>
            </div>

            {/* Error Display */}
            <AnimatePresence>
                {error && (
                    <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="p-3 mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 text-sm rounded flex items-center justify-between shadow-sm">
                        <span className='flex items-center'><FiAlertCircle className="mr-2 flex-shrink-0"/>{error}</span>
                        <button onClick={() => setError('')} className='font-bold text-xl opacity-70 hover:opacity-100 ml-2'>×</button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content Area */}
            <div className="mt-4">
                {/* Loading State */}
                {isLoading && (
                    <div className="text-center py-20">
                        <FiLoader className="animate-spin text-4xl text-purple-500 mx-auto" />
                        <p className="mt-3 text-sm text-gray-500">Loading your grades...</p>
                    </div>
                )}

                {/* Content Display */}
                {!isLoading && (
                    <>
                        {quizAttempts.length === 0 ? (
                            // Empty State
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20 px-6 bg-white rounded-xl border-2 border-dashed border-gray-300 shadow-sm mt-6">
                                <FiInbox size={56} className="mx-auto text-purple-300 mb-5" />
                                <h3 className="text-xl font-semibold text-gray-800">No Grades Found Yet!</h3>
                                <p className="mt-2 text-md text-gray-500 mb-6 max-w-md mx-auto">
                                    Once you complete quizzes, your grades will appear here.
                                </p>
                                <Link to="/student/quizzes" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold rounded-lg shadow-lg hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition transform hover:scale-105">
                                    View Available Quizzes
                                </Link>
                            </motion.div>
                        ) : (
                             // Grades Table
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="bg-white rounded-xl shadow-xl border border-gray-200/80 overflow-hidden"
                            >
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50/80">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Quiz Title</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Subject</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date Submitted</th>
                                                <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Score</th>
                                                <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Percentage</th>
                                                {/* <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th> */}
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            <AnimatePresence>
                                                {quizAttempts.map((attempt) => (
                                                    <motion.tr
                                                        key={attempt._id}
                                                        layout
                                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                                        className="hover:bg-purple-50/30 transition-colors duration-100"
                                                    >
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-gray-900 truncate max-w-xs" title={attempt.quizTitle}>{attempt.quizTitle || 'N/A'}</div>
                                                            <div className="text-xs text-gray-500 sm:hidden">{attempt.subjectName || 'N/A'}</div> {/* Show subject on mobile below title */}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden sm:table-cell">{attempt.subjectName || 'N/A'}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(attempt.dateSubmitted)}</td>
                                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 text-center font-medium">
                                                            {attempt.score ?? 'N/A'} / {attempt.totalQuestions ?? 'N/A'}
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                                                            <span className={`font-semibold px-2 py-1 rounded-full text-xs
                                                                ${attempt.percentage >= 80 ? 'bg-green-100 text-green-700' :
                                                                attempt.percentage >= 60 ? 'bg-blue-100 text-blue-700' :
                                                                attempt.percentage >= 40 ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-red-100 text-red-700'}`}>
                                                                {attempt.percentage ?? 'N/A'}%
                                                            </span>
                                                        </td>
                                                        {/* <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                            <button
                                                                onClick={() => handleViewDetails(attempt._id, attempt.quizId)}
                                                                className="text-indigo-600 hover:text-indigo-800 hover:underline transition text-xs p-1"
                                                                title="View Detailed Results"
                                                            >
                                                                <FiEye size={16} className="inline -mt-px"/> Details
                                                            </button>
                                                        </td> */}
                                                    </motion.tr>
                                                ))}
                                            </AnimatePresence>
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default StudentGrades;