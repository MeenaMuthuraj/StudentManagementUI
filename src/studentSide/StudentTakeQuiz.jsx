// src/studentSide/StudentTakeQuiz.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { FiClock, FiSend, FiLoader, FiAlertCircle, FiHelpCircle, FiChevronsLeft, FiChevronsRight, FiCheckSquare, FiInfo, FiList, FiHome } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
const AlreadySubmittedDisplay = ({ message, attemptId, quizTitle }) => {
    const navigate = useNavigate();
    return (
        <div className="flex flex-col items-center justify-center p-6 md:p-10 min-h-[calc(100vh-10rem)] text-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="bg-gradient-to-br from-blue-50 via-cyan-50 to-white p-8 rounded-xl shadow-lg border border-blue-200 max-w-md w-full"
            >
                <FiCheckSquare className="text-blue-500 text-5xl mx-auto mb-5" />
                <h2 className="text-xl font-semibold text-gray-700 mb-2">Quiz Already Attempted</h2>
                <p className="text-sm text-gray-600 mb-6">
                    {message || "You have already completed this quiz."}
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-3">
                    {/* Option 1: Go back to Quiz List */}
                    <Link
                        to="/student/quizzes" // Link to the quiz list page
                        className="inline-flex items-center justify-center gap-1.5 px-5 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
                    >
                        <FiList size={16}/> View All Quizzes
                    </Link>
                    {/* Option 2: Go to Dashboard */}
                    <Link
                        to="/student/studentDashboard" // Link to dashboard
                        className="inline-flex items-center justify-center gap-1.5 px-5 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition"
                    >
                         <FiHome size={16}/> Go to Dashboard
                    </Link>
                    {/* Option 3: Link to view results (if attemptId is available) */}
                    {/* {attemptId && (
                        <Link
                            to={`/student/quiz-result/${attemptId}`}
                            className="inline-flex items-center justify-center gap-1.5 px-5 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition"
                        >
                             <FiEye size={16}/> View My Result
                         </Link>
                     )} */}
                </div>
            </motion.div>
        </div>
    );
};

function StudentTakeQuiz() {
    const { quizId } = useParams();
    const navigate = useNavigate();

    const [quiz, setQuiz] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [studentAnswers, setStudentAnswers] = useState({}); // Store as { questionId: selectedOptionIndex }
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [timeLeft, setTimeLeft] = useState(null); // Time left in seconds
    const timerRef = useRef(null); // Ref for the timer interval
    const startTimeRef = useRef(null); // Ref to store quiz start time
    // --- NEW STATE for specific "Already Submitted" scenario ---
    const [alreadySubmittedInfo, setAlreadySubmittedInfo] = useState(null); // Store { message, attemptId }
    // --- Fetch Quiz Details (without answers) ---
    // --- Fetch Quiz Details (Modified Error Handling) ---
    const fetchQuiz = useCallback(async () => {
        setIsLoading(true);
        setError('');
        setAlreadySubmittedInfo(null); // Reset submit info on fetch
        console.log(`[TakeQuiz] Fetching quiz ${quizId} for taking...`);
        try {
            const response = await api.get(`/student/quizzes/${quizId}/take`);
            console.log("[TakeQuiz] Quiz data received:", response.data);
            setQuiz(response.data);
            const initialAnswers = {};
            response.data?.questions?.forEach(q => { initialAnswers[q._id] = null; });
            setStudentAnswers(initialAnswers);
            if (response.data?.timeLimitMinutes) { setTimeLeft(response.data.timeLimitMinutes * 60); }
            startTimeRef.current = new Date().toISOString(); // Record start time ONLY when quiz is successfully loaded
        } catch (err) {
            console.error("[TakeQuiz] Error fetching quiz:", err);

            // *** DIFFERENTIATE ERROR TYPE ***
            if (err.response?.status === 403 && err.response?.data?.message?.includes("already submitted")) {
                // Set specific state for "already submitted"
                console.log("[TakeQuiz] Detected 'Already Submitted' error.");
                setAlreadySubmittedInfo({
                     message: err.response.data.message,
                     attemptId: err.response.data.attemptId // Pass attemptId if backend sends it
                });
                setQuiz(null); // Don't try to render the quiz
            } else if (err.response?.status === 403) {
                 // Handle other forbidden errors (like not enrolled)
                 setError(err.response.data?.message || "Access Denied.");
                 setQuiz(null);
            }
             else {
                 // Handle general errors
                 setError(err.response?.data?.message || "Could not load quiz details.");
                 setQuiz(null);
            }
        } finally {
            setIsLoading(false);
        }
    }, [quizId]);

    useEffect(() => { fetchQuiz(); }, [fetchQuiz]);

    // --- Timer Logic ---
    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0) {
            clearInterval(timerRef.current); // Clear any existing timer
            if (timeLeft === 0) {
                 console.log("[TakeQuiz] Time ran out!");
                 alert("Time's up! Submitting your answers automatically.");
                 handleSubmit(); // Auto-submit when time runs out
            }
            return; // Don't start timer if null or zero
        }

        // Start countdown timer
        timerRef.current = setInterval(() => {
            setTimeLeft(prevTime => {
                if (prevTime <= 1) {
                    clearInterval(timerRef.current);
                    return 0; // Ensure it hits exactly 0
                }
                return prevTime - 1;
            });
        }, 1000);

        // Cleanup function to clear interval when component unmounts or timeLeft changes
        return () => clearInterval(timerRef.current);

    }, [timeLeft]); // Rerun effect if timeLeft changes

    // --- Answer Handling ---
    const handleOptionSelect = (questionId, optionIndex) => {
        setStudentAnswers(prev => ({
            ...prev,
            [questionId]: optionIndex,
        }));
    };

    // --- Navigation ---
    const goToNextQuestion = () => {
        if (currentQuestionIndex < quiz.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };
    const goToPrevQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    // --- Submission ---
    const handleSubmit = async () => {
        // Check if all questions answered (optional - allow partial submission?)
        const answeredCount = Object.values(studentAnswers).filter(ans => ans !== null).length;
        if (answeredCount < quiz.questions.length) {
            if (!window.confirm(`You haven't answered all questions. Submit anyway?`)) {
                return;
            }
        }

        setIsSubmitting(true);
        setError('');
        clearInterval(timerRef.current); // Stop timer on submit

        const submissionData = {
            answers: Object.entries(studentAnswers)
                .filter(([questionId, selectedOptionIndex]) => selectedOptionIndex !== null) // Only send answered questions
                .map(([questionId, selectedOptionIndex]) => ({ questionId, selectedOptionIndex })),
            startTime: startTimeRef.current, // Send the start time
        };

        console.log("[TakeQuiz] Submitting answers:", JSON.stringify(submissionData, null, 2));

        try {
            const response = await api.post(`/student/quizzes/${quizId}/submit`, submissionData);
            console.log("[TakeQuiz] Submission Response:", response.data);
            // Navigate to results page, passing attempt details
            navigate(`/student/quiz-result/${response.data.attemptId}`, {
                 state: { // Pass results data directly to avoid another fetch on results page
                     score: response.data.score,
                     totalQuestions: response.data.totalQuestions,
                     percentage: response.data.percentage,
                     quizTitle: quiz.title // Pass quiz title for context
                 }
            });
        } catch (err) {
            console.error("[TakeQuiz] Error submitting quiz:", err);
            setError(err.response?.data?.message || "Failed to submit your answers.");
            setIsSubmitting(false); // Allow retry?
        }
        // No finally setIsSubmitting(false) because we navigate away on success
    };

     // --- Render Logic ---
     if (isLoading) { return <div className="p-10 flex justify-center items-center min-h-[400px]"><FiLoader className="animate-spin text-3xl text-indigo-500"/></div>; }

     // *** NEW: Render dedicated component if already submitted ***
     if (alreadySubmittedInfo) {
         return <AlreadySubmittedDisplay
                     message={alreadySubmittedInfo.message}
                     attemptId={alreadySubmittedInfo.attemptId}
                     quizTitle={quiz?.title} // Pass title if quiz state was briefly set before error
                 />;
     }
 
     // Render general error banner if not "already submitted"
     if (error) { return <div className="m-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded shadow"><FiAlertCircle className="inline mr-2"/>{error}</div>; }
 
     // Render "not found" if no quiz data and no specific errors
     if (!quiz) { return <div className="p-10 text-center text-gray-500">Quiz details could not be loaded or access denied.</div>; }
 
     // --- Render Quiz Taking Interface ---
     const currentQuestion = quiz.questions[currentQuestionIndex];
     const progressPercent = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
     const minutes = timeLeft !== null ? Math.floor(timeLeft / 60) : null;
     const seconds = timeLeft !== null ? timeLeft % 60 : null;
 
     // Ensure currentQuestion exists before trying to access its properties
     if (!currentQuestion) {
         console.error("Error: currentQuestion is undefined at index", currentQuestionIndex);
         // Optionally handle this state, maybe show an error or navigate away
         return <div className="p-10 text-center text-red-500">Error displaying question.</div>;
     }

    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-6 bg-gray-50 min-h-screen flex flex-col">
            {/* Quiz Header */}
            <div className="pb-4 border-b border-gray-300 mb-4">
                <h1 className="text-xl md:text-2xl font-bold text-gray-800">{quiz.title}</h1>
                <p className="text-sm text-gray-600 mt-1">{quiz.description}</p>
                {timeLeft !== null && (
                     <div className={`mt-2 text-sm font-semibold flex items-center gap-1.5 ${timeLeft < 60 ? 'text-red-600 animate-pulse' : 'text-indigo-700'}`}>
                        <FiClock size={15}/> Time Left: {minutes}:{seconds < 10 ? '0' : ''}{seconds}
                    </div>
                )}
            </div>

            {/* Error Display */}
            <AnimatePresence>{error}</AnimatePresence>

            {/* Quiz Content */}
            <motion.div
                key={currentQuestionIndex} // Animate when question changes
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="bg-white p-6 rounded-xl shadow-lg border border-gray-200/80 flex-grow"
            >
                {/* Question Progress */}
                <div className="mb-5">
                    <p className="text-xs font-medium text-indigo-600 mb-1 text-right">
                        Question {currentQuestionIndex + 1} of {quiz.questions.length}
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-1.5 rounded-full transition-all duration-300 ease-out" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                </div>

                {/* Current Question */}
                <h2 className="text-md md:text-lg font-semibold text-gray-800 mb-5 leading-relaxed">
                    {currentQuestion?.questionText}
                </h2>

                {/* Options */}
                <div className="space-y-3">
                    {currentQuestion?.options?.map((option, index) => (
                        <label
                            key={index}
                            htmlFor={`q_${currentQuestion._id}_opt_${index}`}
                            className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all duration-150 ease-in-out group hover:border-indigo-400 hover:bg-indigo-50/50 has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50 has-[:checked]:ring-2 has-[:checked]:ring-indigo-300 has-[:checked]:shadow-md ${studentAnswers[currentQuestion._id] === index ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-300 shadow-md' : 'border-gray-300 bg-white'}`}
                        >
                            <input
                                type="radio"
                                id={`q_${currentQuestion._id}_opt_${index}`}
                                name={`question_${currentQuestion._id}`} // Group radios for the same question
                                value={index}
                                checked={studentAnswers[currentQuestion._id] === index}
                                onChange={() => handleOptionSelect(currentQuestion._id, index)}
                                className="w-4 h-4 text-indigo-600 border-gray-400 focus:ring-indigo-500 mr-3 flex-shrink-0 accent-indigo-600"
                                disabled={isSubmitting}
                            />
                            <span className={`text-sm ${studentAnswers[currentQuestion._id] === index ? 'font-medium text-indigo-800' : 'text-gray-700 group-hover:text-gray-900'}`}>{option}</span>
                        </label>
                    ))}
                </div>
            </motion.div>

             {/* Navigation & Submission Buttons */}
            <div className="mt-6 flex justify-between items-center flex-shrink-0">
                 <button
                    onClick={goToPrevQuestion}
                    disabled={currentQuestionIndex === 0 || isSubmitting}
                    className="inline-flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                    <FiChevronsLeft size={16}/> Previous
                </button>

                {currentQuestionIndex === quiz.questions.length - 1 ? (
                    // Show Submit on last question
                     <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || Object.values(studentAnswers).some(ans => ans === null)} // Disable if submitting or any unanswered
                        className="inline-flex items-center gap-2 px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                         {isSubmitting ? <FiLoader className="animate-spin"/> : <FiCheckSquare size={16}/>}
                         {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
                    </button>
                ) : (
                    // Show Next on other questions
                     <button
                        onClick={goToNextQuestion}
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 disabled:opacity-50 transition"
                    >
                         Next <FiChevronsRight size={16}/>
                    </button>
                )}
            </div>
        </div>
    );
}

export default StudentTakeQuiz;