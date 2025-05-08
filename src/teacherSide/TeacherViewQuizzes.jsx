// src/teacherSide/TeacherViewQuizzes.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import {
    FiPlus, FiEdit, FiTrash2, FiPlayCircle, FiCheckCircle, FiArchive, FiTrendingUp,
    FiLoader, FiAlertCircle, FiInbox, FiCalendar, FiTag, FiList, FiClock, FiEye, FiZap
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmationModal from '../components/ConfirmationModal';

// --- Helper: Format Date ---
const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
        return new Date(dateString).toLocaleDateString('en-CA'); // YYYY-MM-DD
    } catch (e) { return "Invalid Date"; }
};

// --- Helper: Status Info ---
const getStatusInfo = (status) => {
    switch (status) {
        case 'Draft': return { text: 'Draft', color: 'yellow', icon: FiEdit, iconColor: 'text-yellow-600', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', borderColor: 'border-yellow-300' };
        case 'Published': return { text: 'Published', color: 'green', icon: FiPlayCircle, iconColor: 'text-green-600', bgColor: 'bg-green-100', textColor: 'text-green-800', borderColor: 'border-green-300' };
        case 'Closed': return { text: 'Closed', color: 'gray', icon: FiArchive, iconColor: 'text-gray-500', bgColor: 'bg-gray-100', textColor: 'text-gray-700', borderColor: 'border-gray-300' };
        default: return { text: status || 'Unknown', color: 'gray', icon: FiAlertCircle, iconColor: 'text-gray-500', bgColor: 'bg-gray-100', textColor: 'text-gray-700', borderColor: 'border-gray-300' };
    }
};

// --- Reusable Quiz Card Component ---
const QuizCard = React.memo(({ quiz, onEdit, onPublish, onDelete, onViewResults }) => {
    if (!quiz) return null;

    const statusInfo = getStatusInfo(quiz.status);
    const StatusIcon = statusInfo.icon;
    const className = quiz.classId?.name ?? <span className='text-gray-400 italic'>Loading...</span>;
    const subjectName = quiz.subjectName ?? <span className='text-gray-400 italic'>Loading...</span>;
    const questionsCount = quiz.questions?.length ?? 0;
    const timeLimit = quiz.timeLimitMinutes ? `${quiz.timeLimitMinutes} min` : 'No limit';

    const cardVariants = {
        hidden: { opacity: 0, y: 15, scale: 0.97 },
        show: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } }
    };

    return (
        <motion.div
            layout variants={cardVariants} exit="exit"
            className="bg-white rounded-xl shadow-lg hover:shadow-xl border border-gray-200/70 flex flex-col transition-all duration-300 ease-in-out overflow-hidden group"
        >
            {/* Card Header */}
            <div className={`p-4 border-b-2 border-${statusInfo.color}-200 bg-gradient-to-r from-${statusInfo.color}-50 via-white to-white rounded-t-lg`}>
                 <h3 className="text-md font-bold text-gray-800 truncate group-hover:text-indigo-700 transition-colors" title={quiz.title}> {quiz.title || 'Untitled Quiz'} </h3>
                 <p className="text-xs font-medium text-indigo-600 mt-1"> {className} <span className='text-gray-400 mx-1'>/</span> {subjectName} </p>
            </div>
            {/* Card Body */}
            <div className="px-4 pt-3 pb-4 flex-grow space-y-2.5 text-xs">
                 <div className="flex items-center justify-between text-gray-600"><span className='flex items-center gap-1.5'><FiList size={13} className='text-gray-400'/> Questions</span><span className='font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded-md'>{questionsCount}</span></div>
                 <div className="flex items-center justify-between text-gray-600"><span className='flex items-center gap-1.5'><FiClock size={13} className='text-gray-400'/> Time Limit</span><span className='font-semibold text-gray-800'>{timeLimit}</span></div>
                 <div className="flex items-center justify-between text-gray-600"><span className='flex items-center gap-1.5'><FiCalendar size={13} className='text-gray-400'/> Created</span><span className='font-semibold text-gray-800'>{formatDate(quiz.createdAt)}</span></div>
                 <div className="flex items-center justify-between text-gray-600">
                    <span className='flex items-center gap-1.5'><StatusIcon size={13} className={`${statusInfo.iconColor}`}/> Status</span>
                    <span className={`px-2 py-0.5 inline-flex text-[11px] leading-4 font-semibold rounded-full border ${statusInfo.bgColor} ${statusInfo.textColor} ${statusInfo.borderColor}`}> {statusInfo.text} </span>
                 </div>
            </div>
            {/* Card Footer */}
            <div className="px-3 py-2 bg-gray-50/80 border-t border-gray-100 rounded-b-lg">
                <div className="flex items-center justify-end gap-1 sm:gap-1.5">
                     {quiz.status === 'Draft' && ( <> <button onClick={() => onEdit(quiz._id)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-full transition" title="Edit"><FiEdit size={15}/></button> <button onClick={() => onPublish(quiz._id)} className="p-1.5 text-green-600 hover:bg-green-100 rounded-full transition" title="Publish"><FiPlayCircle size={15}/></button> <button onClick={() => onDelete(quiz._id, quiz.title)} className="p-1.5 text-red-500 hover:bg-red-100 rounded-full transition" title="Delete"><FiTrash2 size={15}/></button> </> )}
                     {quiz.status === 'Published' && ( <> <button onClick={() => onViewResults(quiz._id)} className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-full transition" title="View Results"><FiTrendingUp size={15}/></button> </> )}
                     {quiz.status === 'Closed' && ( <> <button onClick={() => onViewResults(quiz._id)} className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-full transition" title="View Results"><FiTrendingUp size={15}/></button> <button onClick={() => onDelete(quiz._id, quiz.title)} className="p-1.5 text-red-500 hover:bg-red-100 rounded-full transition" title="Delete"><FiTrash2 size={15}/></button> </> )}
                </div>
            </div>
        </motion.div>
    );
});

// --- Main Component ---
function TeacherViewQuizzes() {
    const navigate = useNavigate();
    const [quizzes, setQuizzes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false); // For modal confirm button only
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // --- State for Confirmation Modal ---
    const [modalConfig, setModalConfig] = useState({
        isOpen: false, 
        title: '', 
        message: '', 
        confirmAction: () => {},
        quizId: null, 
        quizTitle: '', 
        confirmText: 'Confirm', 
        confirmColor: 'red',
        icon: FiAlertCircle, 
        iconColor: 'text-red-600', 
        bgColor: 'bg-red-100'
    });

    // Fetch quizzes function
    const fetchQuizzes = useCallback(async () => {
        if (!isActionLoading) setIsLoading(true); // Only show main load if not already doing an action
        setError('');
        try {
            const response = await api.get('/teacher/quizzes');
            if (Array.isArray(response?.data)) { setQuizzes(response.data); }
            else { setQuizzes([]); setError("Received unexpected data format."); }
        } catch (err) { setError(err.response?.data?.message || "Could not load quizzes."); setQuizzes([]); }
        finally { setIsLoading(false); setIsActionLoading(false); } // Reset both loading flags
    }, [isActionLoading]); // Dependency ensures this resets after action

    useEffect(() => { fetchQuizzes(); }, [fetchQuizzes]);

    // Auto-clear Success Message Timer
    useEffect(() => {
        let timer;
        if (successMessage) { timer = setTimeout(() => setSuccessMessage(''), 3500); }
        return () => clearTimeout(timer);
    }, [successMessage]);

    // --- Action Handlers ---
    const handleEdit = (quizId) => { navigate(`/teacher/create-quiz?editId=${quizId}`); };

    const openPublishModal = (quizId) => {
        setError('');
        setModalConfig({
            isOpen: true, 
            title: 'Confirm Publish',
            message: 'Publish this quiz?\nStudents will be able to see and attempt it.',
            confirmAction: () => executePublish(quizId), 
            quizId: quizId,
            confirmText: 'Publish', 
            confirmColor: 'green',
            icon: FiPlayCircle, 
            iconColor: 'text-green-600', 
            bgColor: 'bg-green-100'
        });
    };

    const executePublish = async (quizId) => {
        if (!quizId || isActionLoading) return;
        setIsActionLoading(true); 
        setSuccessMessage(''); // Set action loading
        try {
            await api.put(`/teacher/quizzes/${quizId}/status`, { status: 'Published' });
            setSuccessMessage("Quiz published successfully!");
            fetchQuizzes(); // Refresh list (will eventually set isActionLoading to false)
        } catch (err) { 
            setError(err.response?.data?.message || "Failed to publish quiz."); 
            setIsActionLoading(false); 
        } // Stop action loading on error
        finally { closeModal(); } // Close modal regardless of outcome
    };

    const openDeleteModal = (quizId, quizTitle) => {
        setError('');
        setModalConfig({
            isOpen: true, 
            title: 'Confirm Deletion',
            message: `DELETE Quiz: "${quizTitle}"?\nThis cannot be undone.`,
            confirmAction: () => executeDelete(quizId, quizTitle), 
            quizId: quizId, 
            quizTitle: quizTitle,
            confirmText: 'Delete', 
            confirmColor: 'red',
            icon: FiTrash2, 
            iconColor: 'text-red-600', 
            bgColor: 'bg-red-100'
        });
    };

    const executeDelete = async (quizId, quizTitle) => {
        if (!quizId || isActionLoading) return;
        setIsActionLoading(true); 
        setSuccessMessage('');
        try {
            await api.delete(`/teacher/quizzes/${quizId}`);
            setSuccessMessage(`Quiz "${quizTitle}" deleted.`);
            fetchQuizzes(); // Refresh list
        } catch (err) { 
            setError(err.response?.data?.message || "Failed to delete quiz."); 
            setIsActionLoading(false); 
        }
        finally { closeModal(); } // Close modal
    };

    const handleViewResults = (quizId) => {
        console.log(`Navigating to results for Quiz ID: ${quizId}`);
        // Navigate to the new results page route
        navigate(`/teacher/quizzes/${quizId}/results`);
    };

    // Function to close modal cleanly
    const closeModal = () => {
        setModalConfig(prev => ({ ...prev, isOpen: false, quizId: null, quizTitle: '', confirmAction: () => {} }));
    };

    // --- Render Logic ---
    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-6 bg-gradient-to-br from-indigo-50 via-purple-50 to-gray-100 min-h-screen">
            {/* Header */}
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-300">
                 <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-purple-700">My Quizzes</h1>
                 <Link to="/teacher/create-quiz" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-lg shadow-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition transform hover:scale-105 whitespace-nowrap">
                     <FiPlus size={18} /> Create New Quiz
                 </Link>
             </div>

            {/* Feedback Area */}
            <div className="h-10"> {/* Reserve space for feedback */}
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
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-white rounded-xl shadow-lg border border-gray-200/70 h-64 animate-pulse"></div>
                        ))}
                    </div>
                )}

                {/* Content Display */}
                {!isLoading && (
                    <>
                        {quizzes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <FiInbox size={48} className="text-gray-400 mb-4" />
                                <h3 className="text-lg font-medium text-gray-700">No quizzes found</h3>
                                <p className="text-gray-500 mt-1">Create your first quiz to get started</p>
                            </div>
                         ) : (
                             // Quizzes Grid
                            <motion.div
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
                                variants={{ show: { transition: { staggerChildren: 0.05 } } }}
                                initial="hidden" animate="show" // Animate children on show
                            >
                                {/* Map quizzes to QuizCard */}
                                {quizzes.map((quiz) => (
                                    <QuizCard
                                        key={quiz._id}
                                        quiz={quiz}
                                        onEdit={handleEdit}
                                        onPublish={openPublishModal} // Pass the function that OPENS the modal
                                        onDelete={openDeleteModal}   // Pass the function that OPENS the modal
                                        onViewResults={handleViewResults}
                                    />
                                ))}
                            </motion.div>
                        )}
                    </>
                )}
            </div>

            {/* --- Confirmation Modal --- */}
            <ConfirmationModal
                isOpen={modalConfig.isOpen}
                onClose={closeModal}
                onConfirm={modalConfig.confirmAction} // Calls executePublish/Delete
                title={modalConfig.title}
                message={modalConfig.message}
                confirmText={modalConfig.confirmText}
                confirmColor={modalConfig.confirmColor}
                icon={modalConfig.icon}
                iconColor={modalConfig.iconColor}
                bgColor={modalConfig.bgColor}
                isProcessing={isActionLoading} // Controls the spinner on confirm button
            />
        </div>
    );
}

export default TeacherViewQuizzes;