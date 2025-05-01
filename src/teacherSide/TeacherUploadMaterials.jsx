import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
    FiUploadCloud, FiFileText, FiTrash2, FiDownload, FiAlertTriangle,
    FiCheckCircle, FiLoader, FiArrowLeft, FiInbox, FiCalendar, FiEdit,
    FiFile, FiImage, FiVideo, FiHeadphones, FiArchive, FiFilm // More icons
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion'; // Added AnimatePresence
import api from '../services/api';

// --- Helpers ---
const getBackendBaseUrl = () => {
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    return apiUrl.replace(/\/api\/?$/, '');
};

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' // Added time
        });
    } catch (e) {
        return 'Invalid Date';
    }
};

// Helper to get a specific file type icon
const getFileTypeIcon = (filename = '') => {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
        case 'pdf': return <FiFileText className="text-red-500" />;
        case 'doc':
        case 'docx': return <FiFileText className="text-blue-600" />;
        case 'ppt':
        case 'pptx': return <FiFileText className="text-orange-500" />;
        case 'xls':
        case 'xlsx': return <FiFileText className="text-green-600" />;
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif': return <FiImage className="text-teal-500" />;
        case 'mp4':
        case 'mov':
        case 'avi': return <FiFilm className="text-purple-500" />; // Changed icon
        case 'mp3':
        case 'wav':
        case 'ogg': return <FiHeadphones className="text-pink-500" />;
        case 'zip':
        case 'rar': return <FiArchive className="text-yellow-500" />;
        case 'txt': return <FiFileText className="text-gray-500" />;
        default: return <FiFile className="text-gray-400" />;
    }
};

// Helper to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// --- Component ---
function TeacherUploadMaterials() {
    const navigate = useNavigate();
    const location = useLocation();
    const fileInputRef = useRef(null);

    // --- State ---
    const [paramClassId, setParamClassId] = useState(null);
    const [paramSubjectId, setParamSubjectId] = useState(null);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [allClasses, setAllClasses] = useState([]);
    const [subjectsForSelectedClass, setSubjectsForSelectedClass] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [className, setClassName] = useState('');
    const [subjectName, setSubjectName] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
    const [isLoadingMaterials, setIsLoadingMaterials] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(null);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [dragActive, setDragActive] = useState(false); // For dropzone UI

    const backendUrl = getBackendBaseUrl();
    const needsSelection = !paramClassId || !paramSubjectId;
    const finalClassId = paramClassId || selectedClassId;
    const finalSubjectId = paramSubjectId || selectedSubjectId;

    // --- Effects and Callbacks (Keep the logic, minor updates for clarity) ---

    // Get IDs from URL
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const cId = params.get('classId');
        const sId = params.get('subjectId');
        let paramsChanged = false;
        if (cId !== paramClassId) { setParamClassId(cId); paramsChanged = true; }
        if (sId !== paramSubjectId) { setParamSubjectId(sId); paramsChanged = true; }
        if (paramsChanged) {
            if (cId && sId) { setSelectedClassId(''); setSelectedSubjectId(''); setSubjectsForSelectedClass([]); }
            setIsLoadingInitialData(true); setError(''); setSuccessMessage(''); setMaterials([]); setClassName(''); setSubjectName('');
        }
    }, [location.search, paramClassId, paramSubjectId]);

    // Fetch ALL classes/subjects
    const fetchAllClassesAndSubjects = useCallback(async () => {
        if (!needsSelection || !isLoadingInitialData) { if (!needsSelection) setIsLoadingInitialData(false); return; }
        setError('');
        try {
            const response = await api.get('/teacher/classes');
            const fetchedClasses = response.data || [];
            const classesWithSubjects = fetchedClasses.filter(cls => cls.subjects && cls.subjects.length > 0);
            setAllClasses(classesWithSubjects);
        } catch (err) { setError(err.response?.data?.message || "Failed to load class list."); setAllClasses([]); }
        finally { setIsLoadingInitialData(false); }
    }, [needsSelection, isLoadingInitialData]);

    useEffect(() => { if (needsSelection) { fetchAllClassesAndSubjects(); } }, [needsSelection, fetchAllClassesAndSubjects]);

    // Fetch materials list
    const fetchMaterialsData = useCallback(async () => {
        if (!finalClassId || !finalSubjectId) { setMaterials([]); setClassName(''); setSubjectName(''); return; }
        setIsLoadingMaterials(true); setError('');
        try {
            let targetClass = allClasses.find(c => c._id === finalClassId);
            let targetSubject = targetClass?.subjects?.find(s => s._id === finalSubjectId);
             if (!targetClass && !needsSelection) {
                 try {
                    const classInfoResponse = await api.get(`/teacher/classes/${finalClassId}`);
                    targetClass = classInfoResponse.data;
                    targetSubject = targetClass?.subjects?.find(s => s._id === finalSubjectId);
                 } catch (nameFetchError){ console.error("Could not fetch class/subject names", nameFetchError); }
             }
             setClassName(targetClass?.name || 'Class');
             setSubjectName(targetSubject?.name || 'Subject');
            const response = await api.get(`/teacher/classes/${finalClassId}/subjects/${finalSubjectId}/materials`);
            setMaterials(response.data || []);
        } catch (err) { setError(err.response?.data?.message || "Failed to load materials."); setMaterials([]); }
        finally { setIsLoadingMaterials(false); }
    }, [finalClassId, finalSubjectId, allClasses, needsSelection]);

    useEffect(() => { fetchMaterialsData(); }, [fetchMaterialsData]);

    // Update Subject Dropdown
    useEffect(() => {
        if (selectedClassId && needsSelection) {
            const selectedClassData = allClasses.find(cls => cls._id === selectedClassId);
            setSubjectsForSelectedClass(selectedClassData?.subjects || []);
            setSelectedSubjectId(''); setMaterials([]); setClassName(selectedClassData?.name || ''); setSubjectName('');
        } else if (!selectedClassId && needsSelection) {
            setSubjectsForSelectedClass([]); setSelectedSubjectId(''); setMaterials([]); setClassName(''); setSubjectName('');
        }
    }, [selectedClassId, allClasses, needsSelection]);

    // --- File Handlers ---
    const handleFileChange = (event) => {
        handleFiles(event.target.files);
        // Reset file input visually to allow uploading the same file again if needed
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleFiles = (files) => { // Handle single file from input or drop
        const file = files?.[0];
        if (file) {
             if (file.size > 20 * 1024 * 1024) { // 20MB limit
                 setError("File size exceeds 20MB limit.");
                 setSelectedFile(null); return;
             }
             // Minimal type validation for materials, allow most things
             setError(''); setSuccessMessage(''); setSelectedFile(file);
        }
    }

    // Drag and Drop Handlers
    const handleDrag = (e) => {
        e.preventDefault(); e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
        else if (e.type === "dragleave") setDragActive(false);
    };
    const handleDrop = (e) => {
        e.preventDefault(); e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFiles(e.dataTransfer.files);
        }
    };


    // Upload Handler
    const handleUpload = async () => {
        if (!selectedFile || !finalClassId || !finalSubjectId || isUploading) return;
        setIsUploading(true); setError(''); setSuccessMessage('');
        const formData = new FormData();
        formData.append('materialFile', selectedFile);
        try {
            const response = await api.post(`/teacher/classes/${finalClassId}/subjects/${finalSubjectId}/materials`, formData);
            setMaterials(prev => [response.data.material, ...prev]);
            setSelectedFile(null);
            setSuccessMessage(`Material "${response.data.material?.originalName}" uploaded!`);
        } catch (err) { setError(err.response?.data?.message || "Failed to upload material."); }
        finally { setIsUploading(false); }
    };

    // Delete Handler
    const handleDelete = async (materialId, materialName) => {
        if (!materialId || !finalClassId || !finalSubjectId || isDeleting) return;
        if (!window.confirm(`Delete "${materialName}"?`)) return;
        setIsDeleting(materialId); setError(''); setSuccessMessage('');
        try {
            await api.delete(`/teacher/classes/${finalClassId}/subjects/${finalSubjectId}/materials/${materialId}`);
            setMaterials(prev => prev.filter(m => m._id !== materialId));
            setSuccessMessage(`Material "${materialName}" deleted!`);
        } catch (err) { setError(err.response?.data?.message || "Failed to delete material."); }
        finally { setIsDeleting(null); }
    };

    // Download URL (Still placeholder - needs backend route)
    const getDownloadUrl = (materialPath) => {
        // TODO: Replace with backend download route when implemented
        // return `/api/teacher/classes/${finalClassId}/subjects/${finalSubjectId}/materials/${materialId}/download`;
        return materialPath ? `${backendUrl}${materialPath}` : '#';
    };

    // --- Render Logic ---
    if (isLoadingInitialData && needsSelection) {
        return ( <div className="p-6 min-h-[300px] flex justify-center items-center"><FiLoader className="animate-spin text-indigo-500 text-3xl" /><span className="ml-3 text-gray-500">Loading classes...</span></div> );
    }
    if (needsSelection && !isLoadingInitialData && allClasses.length === 0) {
        return ( <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 flex flex-col items-center justify-center text-center"><FiInbox size={60} className="text-gray-300 mb-4" /><h2 className="text-xl font-semibold text-gray-700 mb-2">No Subjects Found</h2><p className="text-gray-500 mb-4 max-w-md">You need to create classes and add subjects before uploading materials.</p><Link to="/teacher/TeacherViewSubjects" className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg shadow hover:bg-indigo-700 transition"><FiEdit size={16}/> Go to Subject Management</Link></div> );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-indigo-100">
            <button onClick={() => navigate(paramClassId ? -1 : '/teacher/TeacherViewSubjects')} className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 mb-6 p-2 rounded-md hover:bg-indigo-100/50 transition-colors">
                <FiArrowLeft /> Back
            </button>

            {/* Main Content Card */}
            <div className="bg-white rounded-xl shadow-xl border border-gray-200/80 overflow-hidden">
                {/* Header */}
                <div className="p-5 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-white to-indigo-50/30">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Manage Study Materials</h1>
                    <p className="text-gray-600 mt-1 text-sm">
                        {finalClassId && finalSubjectId
                           ? <>For Subject: <strong className="text-indigo-700">{subjectName || 'Loading...'}</strong> in Class: <strong className="text-indigo-700">{className || 'Loading...'}</strong></>
                           : 'Select a class and subject to manage materials.'}
                    </p>
                </div>

                {/* Selection Dropdowns */}
                {needsSelection && (
                     <div className="p-5 sm:p-6 border-b border-gray-100">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-indigo-100 rounded-lg bg-indigo-50/30">
                             <div>
                                 <label htmlFor="classSelectMat" className="block text-sm font-medium text-gray-700 mb-1.5">1. Select Class</label>
                                 <select id="classSelectMat" value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm" disabled={isLoadingInitialData} >
                                     <option value="">-- Select a Class --</option>
                                     {allClasses.map(cls => (<option key={cls._id} value={cls._id}>{cls.name}</option>))}
                                 </select>
                             </div>
                             <div>
                                 <label htmlFor="subjectSelectMat" className="block text-sm font-medium text-gray-700 mb-1.5">2. Select Subject</label>
                                 <select id="subjectSelectMat" value={selectedSubjectId} onChange={(e) => setSelectedSubjectId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm" disabled={!selectedClassId || subjectsForSelectedClass.length === 0} >
                                     <option value="">-- Select a Subject --</option>
                                     {subjectsForSelectedClass.map(sub => (<option key={sub._id} value={sub._id}>{sub.name}</option> ))}
                                 </select>
                                 {!selectedClassId && <p className="text-xs text-gray-500 mt-1.5">Select a class first.</p>}
                                 {selectedClassId && subjectsForSelectedClass.length === 0 && <p className="text-xs text-gray-500 mt-1.5">No subjects found.</p>}
                             </div>
                         </div>
                     </div>
                  )}

                {/* Main Interaction Area */}
                 {finalClassId && finalSubjectId ? (
                     <div className="grid grid-cols-1 lg:grid-cols-7 gap-6 p-5 sm:p-6">
                         {/* Upload Section (Span 2 cols on large screens) */}
                         <div className="lg:col-span-2 space-y-4">
                             <h2 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-3">Upload New</h2>
                             {/* Dropzone */}
                              <div
                                 id="dropzone"
                                 onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                                 onClick={() => fileInputRef.current?.click()}
                                 className={`relative flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200 ease-in-out h-48 ${ dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}
                              >
                                 <FiUploadCloud className={`w-10 h-10 mb-3 transition-colors ${dragActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                                 <p className="mb-2 text-sm text-center text-gray-500">
                                     <span className="font-semibold">Click to upload</span> or drag & drop
                                 </p>
                                 <p className="text-xs text-gray-500">Any file type (Max 20MB)</p>
                                 <input id="material-upload" ref={fileInputRef} name="materialFile" type="file" className="hidden" onChange={handleFileChange} />
                              </div>

                              {/* Selected File Info & Upload Button */}
                              <AnimatePresence>
                                {selectedFile && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0}}
                                        className="p-3 border border-indigo-200 bg-indigo-50 rounded-lg space-y-2"
                                    >
                                        <div className="flex items-center gap-2 text-sm">
                                             <span className="text-indigo-600">{getFileTypeIcon(selectedFile.name)}</span>
                                             <span className="font-medium text-indigo-800 truncate flex-1" title={selectedFile.name}>{selectedFile.name}</span>
                                             <span className="text-xs text-gray-500 flex-shrink-0">{formatFileSize(selectedFile.size)}</span>
                                        </div>
                                        <button
                                            onClick={handleUpload}
                                            disabled={isUploading || isDeleting !== null || !selectedFile}
                                            className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition inline-flex items-center justify-center gap-2"
                                        >
                                            {isUploading ? ( <> <FiLoader className="animate-spin"/> Uploading... </> ) : ( <> <FiUploadCloud /> Upload File </> )}
                                        </button>
                                    </motion.div>
                                )}
                                </AnimatePresence>

                                {/* Feedback Messages */}
                                <AnimatePresence>
                                {error && ( <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-4 bg-red-50 border border-red-300 text-red-700 px-3 py-2 rounded-md shadow-sm text-xs" role="alert"> <div className="flex items-center"> <FiAlertTriangle className="text-red-500 mr-2 flex-shrink-0"/> <span>{error}</span> <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700 text-lg font-bold">×</button> </div> </motion.div> )}
                                {successMessage && !error && ( <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-4 bg-green-50 border border-green-300 text-green-700 px-3 py-2 rounded-md shadow-sm text-xs" role="alert"> <div className="flex items-center"> <FiCheckCircle className="text-green-500 mr-2 flex-shrink-0" /> <span>{successMessage}</span> <button onClick={() => setSuccessMessage('')} className="ml-auto text-green-500 hover:text-green-700 text-lg font-bold">×</button> </div> </motion.div> )}
                                </AnimatePresence>

                         </div>

                         {/* Materials List Section (Span 5 cols on large screens) */}
                         <div className="lg:col-span-5">
                             <h2 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-3">Uploaded Materials ({materials.length})</h2>
                              {isLoadingMaterials ? (
                                 <div className="space-y-3">
                                     {[...Array(3)].map((_, i) => ( <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-100 rounded-lg animate-pulse"> <div className="w-8 h-8 bg-gray-200 rounded"></div> <div className="flex-1 space-y-2"> <div className="h-3 bg-gray-200 rounded w-3/4"></div> <div className="h-2 bg-gray-200 rounded w-1/2"></div> </div> <div className="h-6 w-16 bg-gray-200 rounded"></div> </div> ))}
                                 </div>
                              ) : materials.length === 0 ? (
                                 <div className="text-center py-12 border border-gray-200 border-dashed rounded-lg bg-gray-50/50"> <FiInbox size={40} className="mx-auto text-gray-400 mb-3"/> <p className="text-sm text-gray-500">No materials uploaded yet.</p> </div>
                              ) : (
                                 <div className="space-y-3 max-h-[calc(100vh-350px)] overflow-y-auto pr-2 custom-scrollbar"> {/* Scrollable List */}
                                     <AnimatePresence>
                                         {materials.map(material => (
                                             <motion.div
                                                 key={material._id}
                                                 layout initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20, transition: { duration: 0.2} }}
                                                 className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-md transition duration-150 ease-in-out"
                                             >
                                                 <div className="flex items-center gap-3 min-w-0 flex-grow">
                                                     <span className="text-2xl flex-shrink-0 w-7 text-center">{getFileTypeIcon(material.originalName)}</span>
                                                     <div className='min-w-0'>
                                                         <p className="text-sm text-gray-800 font-semibold truncate" title={material.originalName}> {material.originalName} </p>
                                                         <p className="text-xs text-gray-500 inline-flex items-center gap-1 mt-1"> <FiCalendar size={12}/> {formatDate(material.uploadedAt)} </p>
                                                     </div>
                                                 </div>
                                                 <div className="flex items-center gap-2 flex-shrink-0 mt-2 sm:mt-0 self-end sm:self-center">
                                                     <a href={getDownloadUrl(material.path)} target="_blank" rel="noopener noreferrer" className="p-2 text-xs text-blue-600 hover:text-white hover:bg-blue-500 border border-blue-200 hover:border-blue-500 rounded-full transition duration-150" title="Download Material" > <FiDownload size={14} /> </a>
                                                     <button onClick={() => handleDelete(material._id, material.originalName)} disabled={isDeleting === material._id || isUploading} className="p-2 text-xs text-red-600 hover:text-white hover:bg-red-500 border border-red-200 hover:border-red-500 rounded-full transition duration-150 disabled:opacity-50" title="Delete Material" > {isDeleting === material._id ? <FiLoader className="animate-spin" size={14}/> : <FiTrash2 size={14} />} </button>
                                                 </div>
                                             </motion.div>
                                         ))}
                                     </AnimatePresence>
                                 </div>
                              )}
                         </div>
                     </div>
                  ) : (
                      /* Placeholder if selection needed */
                       needsSelection && !isLoadingInitialData && allClasses.length > 0 && (
                           <div className="text-center p-16 text-gray-500 italic"> Please select a class and subject above. </div>
                       )
                   )}

            </div> {/* End Main Content Card */}
        </div> /* End Page Container */
    );
}

export default TeacherUploadMaterials;