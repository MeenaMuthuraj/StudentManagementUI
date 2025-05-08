// src/studentSide/StudentSubjects.jsx
import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api'; // Your axios instance
import {
    FiBookOpen, FiFileText, FiDownload, FiAlertCircle, FiLoader, FiInbox, FiPaperclip
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

// Helper to get base URL for download links
const getBackendBaseUrl = () => {
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    return apiUrl.replace(/\/api\/?$/, ''); // Get http://localhost:5000
};
const backendBaseUrl = getBackendBaseUrl();

// Helper to determine file icon (similar to TeacherUploadMaterials)
const getFileTypeIcon = (filename = '') => {
    const extension = filename.split('.').pop()?.toLowerCase();
    // Add more cases as needed
    switch (extension) {
        case 'pdf': return <FiFileText className="text-red-500" />;
        case 'doc': case 'docx': return <FiFileText className="text-blue-600" />;
        case 'ppt': case 'pptx': return <FiFileText className="text-orange-500" />;
        case 'xls': case 'xlsx': return <FiFileText className="text-green-600" />;
        case 'txt': return <FiFileText className="text-gray-500" />;
        // Default icon
        default: return <FiPaperclip className="text-gray-400" />;
    }
};

// Component to display a single downloadable file
const FileItem = ({ file, type }) => (
    <a
        href={`${backendBaseUrl}${file.path}`} // Construct download URL
        target="_blank" // Open in new tab
        rel="noopener noreferrer"
        download={file.originalName} // Suggest original filename for download
        className="flex items-center justify-between p-2.5 bg-gray-50 hover:bg-gray-100 rounded-md border border-gray-200 transition duration-150 ease-in-out group"
        title={`Download ${type}: ${file.originalName}`}
    >
        <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg flex-shrink-0 w-5 text-center">{getFileTypeIcon(file.originalName)}</span>
            <span className="text-xs text-gray-700 group-hover:text-indigo-700 truncate flex-1">
                {file.originalName}
            </span>
        </div>
        <FiDownload className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 flex-shrink-0 ml-2" />
    </a>
);


function StudentSubjects() {
    const [subjects, setSubjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchMySubjects = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            // Call the new backend endpoint
            const response = await api.get('/student/my-subjects');
            setSubjects(response.data || []);
            if (response.data?.length === 0) {
                 // Optional: Set a specific message if no subjects found vs. error
                 // setError("No subjects found for your assigned class yet.");
            }
        } catch (err) {
            console.error("Error fetching student subjects:", err);
            setError(err.response?.data?.message || "Could not load subjects.");
            setSubjects([]); // Clear subjects on error
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMySubjects();
    }, [fetchMySubjects]);

    // --- Render Logic ---

    if (isLoading) {
        return (
            <div className="p-10 flex justify-center items-center min-h-[400px]">
                <FiLoader className="animate-spin text-3xl text-indigo-500"/>
                <span className='ml-3 text-gray-500'>Loading Subjects...</span>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 space-y-6">
            <h1 className="text-2xl font-bold text-gray-800 pb-4 border-b border-gray-200">
                My Subjects & Materials
            </h1>

            {/* Error Display */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded text-sm shadow-sm flex items-center justify-between"
                        role="alert"
                    >
                        <span className="flex items-center"><FiAlertCircle className="mr-2"/>{error}</span>
                        <button onClick={() => setError('')} className="font-bold opacity-70 hover:opacity-100">×</button>
                    </motion.div>
                )}
            </AnimatePresence>

             {/* Subjects List */}
             {!isLoading && subjects.length === 0 && !error && (
                <div className="text-center py-16 px-6 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <FiInbox size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700">No Subjects Available</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Subjects and materials for your class haven't been added by your teachers yet. Please check back later.
                    </p>
                </div>
            )}

            {subjects.length > 0 && (
                 <div className="space-y-6">
                     {subjects.map((subject) => (
                         <motion.div
                             key={subject.name} // Use name as key since _id might be ambiguous
                             layout
                             initial={{ opacity: 0, y: 10 }}
                             animate={{ opacity: 1, y: 0 }}
                             className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
                         >
                             {/* Subject Header */}
                             <div className="px-5 py-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-100 border-b border-gray-200">
                                 <h2 className="text-lg font-semibold text-indigo-800 flex items-center gap-2">
                                     <FiBookOpen size={18} /> {subject.name}
                                 </h2>
                             </div>

                             {/* Materials and Syllabi Sections */}
                             <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                 {/* Syllabi Section */}
                                 <div>
                                     <h3 className="text-sm font-semibold text-gray-600 mb-3 pb-1 border-b border-gray-100">Syllabus Files</h3>
                                      {(subject.syllabi && subject.syllabi.length > 0) ? (
                                         <div className="space-y-2">
                                             {subject.syllabi.map((syllabus) => (
                                                 <FileItem key={syllabus._id || syllabus.path} file={syllabus} type="Syllabus" />
                                             ))}
                                         </div>
                                     ) : (
                                         <p className="text-xs text-gray-400 italic mt-2">No syllabus uploaded.</p>
                                     )}
                                 </div>

                                 {/* Materials Section */}
                                 <div>
                                     <h3 className="text-sm font-semibold text-gray-600 mb-3 pb-1 border-b border-gray-100">Study Materials</h3>
                                     {(subject.materials && subject.materials.length > 0) ? (
                                         <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1"> {/* Optional scroll for many materials */}
                                             {subject.materials.map((material) => (
                                                 <FileItem key={material._id || material.path} file={material} type="Material" />
                                             ))}
                                         </div>
                                     ) : (
                                         <p className="text-xs text-gray-400 italic mt-2">No materials uploaded.</p>
                                     )}
                                 </div>
                             </div>
                         </motion.div>
                     ))}
                 </div>
            )}
        </div>
    );
}

export default StudentSubjects;