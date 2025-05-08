// src/studentSide/StudentViewQuizzes.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api'; // Your Axios instance
import {
    FiPlayCircle, FiLoader, FiAlertCircle, FiInbox, FiCalendar,
    FiTag, FiList, FiClock, FiCheckSquare // Added CheckSquare for completed
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

// Helper to format date concisely
const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try { return new Date(dateString).toLocaleDateString('en-CA'); } // YYYY-MM-DD
    catch (e) { return "Invalid Date"; }
};

// --- Reusable Quiz Card for Student View ---
const StudentQuizCard = ({ quiz, onTakeQuiz, hasAttempted }) => {
    if (!quiz) return null;

    // Get class/subject names safely
    const className = quiz.classId?.name ?? <span className='text-gray-400 italic'>N/A</span>;
    const subjectName = quiz.subjectName ?? <span className='text-gray-400 italic'>N/A</span>;
    const questionsCount = quiz.questions?.length ?? 0;
    const timeLimit = quiz.timeLimitMinutes ? `${quiz.timeLimitMinutes} min` : 'Unlimited Time';

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -10 }
    };

    // Card styling based on attempt status
    const cardBaseStyle = "rounded-xl shadow-lg hover:shadow-xl border flex flex-col transition-all duration-300 ease-in-out overflow-hidden group";
    const cardBorderStyle = hasAttempted ? "border-emerald-300/80" : "border-gray-200/70 hover:border-indigo-300";
    const cardBgStyle = hasAttempted ? "bg-gradient-to-br from-emerald-50 via-white to-white" : "bg-white";

    return (
        <motion.div
            layout variants={cardVariants} exit="exit"
            className={`${cardBaseStyle} ${cardBorderStyle} ${cardBgStyle}`}
        >
            {/* Card Header */}
            <div className={`p-4 border-b ${hasAttempted ? 'border-emerald-200/70' : 'border-gray-200/80'}`}>
                <h3 className="text-base font-bold text-gray-800 truncate group-hover:text-indigo-600 transition-colors" title={quiz.title}>
                    {quiz.title || 'Untitled Quiz'}
                </h3>
                <p className="text-xs font-medium text-indigo-600 mt-1">
                    {className} <span className='text-gray-400 mx-1'>/</span> {subjectName}
                </p>
            </div>

            {/* Card Body */}
            <div className="px-4 pt-4 pb-4 flex-grow space-y-3 text-sm">
                <div className="flex items-center justify-between text-gray-700">
                    <span className='flex items-center gap-1.5 text-gray-500'><FiList size={14}/> Questions</span>
                    <span className='font-semibold text-gray-800 bg-gray-100 px-2.5 py-0.5 rounded-md text-xs'>{questionsCount}</span>
                </div>
                <div className="flex items-center justify-between text-gray-700">
                    <span className='flex items-center gap-1.5 text-gray-500'><FiClock size={14}/> Time Limit</span>
                    <span className='font-semibold text-gray-800 text-xs'>{timeLimit}</span>
                </div>
                 {/* Optional: Show Due Date */}
                 {quiz.dueDate && (
                     <div className="flex items-center justify-between text-gray-700">
                         <span className='flex items-center gap-1.5 text-gray-500'><FiCalendar size={14}/> Due Date</span>
                         <span className={`font-semibold text-xs ${new Date(quiz.dueDate) < new Date() ? 'text-red-600' : 'text-gray-800'}`}>
                             {formatDate(quiz.dueDate)}
                         </span>
                    </div>
                 )}
            </div>

            {/* Card Footer - Actions */}
            <div className="px-4 py-3 mt-auto bg-gray-50/70 border-t border-gray-100 rounded-b-xl">
                 {hasAttempted ? (
                     // Already Attempted State
                     <div className="flex items-center justify-center gap-2 text-sm font-medium text-emerald-700 bg-emerald-100/80 px-3 py-1.5 rounded-md border border-emerald-200">
                         <FiCheckSquare size={16}/>
                         <span>Completed</span>
                     </div>
                 ) : (
                     // Take Quiz Button
                     <button
                         onClick={() => onTakeQuiz(quiz._id)}
                         className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-semibold rounded-lg shadow-md hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 transition transform hover:scale-105"
                         title={`Take the "${quiz.title}" quiz`}
                     >
                         <FiPlayCircle size={14}/> Take Quiz
                     </button>
                 )}
            </div>
        </motion.div>
    );
};

// --- Main Component ---
function StudentViewQuizzes() {
    const navigate = useNavigate();
    const [quizzes, setQuizzes] = useState([]);
    const [attemptedQuizIds, setAttemptedQuizIds] = useState(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState(''); // Added missing state

    // Fetch available quizzes for the student
    const fetchAvailableQuizzes = useCallback(async () => {
        setIsLoading(true);
        setError('');
        setSuccessMessage(''); // Clear any previous messages
        console.log("[StudentViewQuizzes] Fetching available quizzes...");
        try {
            const quizResponse = await api.get('/student/quizzes');
            console.log("[StudentViewQuizzes] API Quiz Response Data:", quizResponse?.data);

            if (Array.isArray(quizResponse?.data)) {
                setQuizzes(quizResponse.data);
                setAttemptedQuizIds(new Set());
            } else {
                setQuizzes([]); 
                setError("Received unexpected data format for quizzes.");
            }
        } catch (err) {
            console.error("[StudentViewQuizzes] Error fetching data:", err);
            setError(err.response?.data?.message || "Could not load available quizzes.");
            setQuizzes([]);
            setAttemptedQuizIds(new Set());
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAvailableQuizzes();
    }, [fetchAvailableQuizzes]);

    // Auto-clear success message after display
    useEffect(() => {
        let timer;
        if (successMessage) {
            timer = setTimeout(() => setSuccessMessage(''), 3500);
        }
        return () => clearTimeout(timer);
    }, [successMessage]);

    const handleTakeQuiz = (quizId) => {
        console.log("Navigating to take quiz:", quizId);
        navigate(`/student/take-quiz/${quizId}`);
    };

    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-6 bg-gradient-to-b from-white via-blue-50/50 to-cyan-50/50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-200">
                <div>
                     <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-cyan-700">
                         Available Quizzes
                    </h1>
                     <p className="text-sm text-gray-500 mt-1">Quizzes published by your teachers for your class.</p>
                </div>
            </div>

            {/* Feedback Area */}
            <div className="h-10">
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
                        >
                            {error}
                        </motion.div>
                    )}
                    {successMessage && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative"
                        >
                            {successMessage}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Main Content Area */}
            <div className="mt-0">
                {/* Loading State */}
                {isLoading && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {[...Array(8)].map((_, i) => (
                             <div key={i} className="bg-white rounded-xl shadow-lg border border-gray-200 h-56 animate-pulse">
                                 <div className="p-4 border-b border-gray-200"> <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div> <div className="h-3 bg-gray-200 rounded w-1/2"></div> </div>
                                 <div className="p-4 space-y-3"> <div className="h-3 bg-gray-200 rounded w-full"></div> <div className="h-3 bg-gray-200 rounded w-5/6"></div> </div>
                                 <div className="h-10 bg-gray-100 rounded-b-xl mt-4"></div>
                             </div>
                         ))}
                    </div>
                )}

                {/* Content Display Logic */}
                {!isLoading && (
                    <>
                        {quizzes.length === 0 ? (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }} 
                                animate={{ opacity: 1, y: 0 }} 
                                className="text-center py-20 px-6 bg-white rounded-xl border border-dashed border-gray-300 shadow-sm mt-6"
                            >
                                <FiInbox size={60} className="mx-auto text-blue-300 mb-6" />
                                <h3 className="text-xl font-semibold text-gray-800">No Quizzes Available Right Now</h3>
                                <p className="mt-2 text-md text-gray-500 mb-6 max-w-md mx-auto"> Check back later, or confirm with your teachers if you were expecting a quiz.</p>
                             </motion.div>
                        ) : (
                            <motion.div
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                                variants={{ show: { transition: { staggerChildren: 0.06 } } }}
                                initial="hidden" animate="show"
                            >
                                {quizzes.map((quiz) => (
                                    <StudentQuizCard
                                        key={quiz._id}
                                        quiz={quiz}
                                        onTakeQuiz={handleTakeQuiz}
                                        hasAttempted={attemptedQuizIds.has(quiz._id)}
                                    />
                                ))}
                            </motion.div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default StudentViewQuizzes;