// src/teacherSide/TeacherCreateQuiz.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
    FiPlus, FiTrash2, FiCheckCircle, FiXCircle,FiTag, FiClock, FiSave, FiTarget,
    FiLoader, FiAlertCircle, FiArrowLeft, FiBookOpen, FiEdit2, FiCheck, FiX,
    FiInfo, FiList, FiHelpCircle, FiCheckSquare, FiGrid // Added more icons
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

// --- Initial State ---
const initialNewQuestionState = {
    questionText: '',
    options: ['', '', '', ''],
    correctAnswerIndex: null,
};

// --- Reusable Form Components (Enhanced Styling) ---
const InputField = React.memo(({ id, label, required, error, icon: Icon, ...props }) => (
    <div className="relative pb-4"> {/* Added padding-bottom for absolute error */}
        <label htmlFor={id} className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative flex items-center">
            {Icon && <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />}
            <input
                id={id}
                className={`w-full py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:border-transparent text-sm transition duration-150 ease-in-out ${Icon ? 'pl-9 pr-3' : 'px-3'} ${error ? 'border-red-300 ring-red-300 bg-red-50/50' : 'border-gray-300 focus:ring-indigo-400 bg-white'}`}
                {...props}
            />
        </div>
        <AnimatePresence>
            {error && <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-[11px] text-red-600 mt-1 absolute -bottom-0.5 left-1">{error}</motion.p>}
        </AnimatePresence>
    </div>
));

const TextareaField = React.memo(({ id, label, required, error, ...props }) => (
     <div className="relative pb-4">
        <label htmlFor={id} className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <textarea
            id={id}
            className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:border-transparent text-sm resize-none transition duration-150 ease-in-out ${error ? 'border-red-300 ring-red-300 bg-red-50/50' : 'border-gray-300 focus:ring-indigo-400 bg-white'}`}
            {...props}
        />
         <AnimatePresence>
            {error && <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-[11px] text-red-600 mt-1 absolute -bottom-0.5 left-1">{error}</motion.p>}
        </AnimatePresence>
    </div>
));

const SelectField = React.memo(({ id, label, required, error, children, ...props }) => (
    <div className="relative pb-4">
        <label htmlFor={id} className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <select
            id={id}
            className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:border-transparent text-sm bg-white appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0iY3VycmVudENvbG9yIiB2aWV3Qm94PSIwIDAgMTYgMTYiPiA8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xLjYzNiA1LjIzMWEuNzUuNzUgMCAwIDEtMS4wNjEtMS4wNjFsNC41LTQuNWEuNzUuNzUgMCAwIDEgMS4wNjEgMGw0LjUgNC41YS43NS43NSAwIDAgMS0xLjA2MSAxLjA2MUw4LjUgMS43ODEgMy4yODIgNi45NWwtMS40My0xLjQzMS0uMjE1LjIxNmEuNzUuNzUgMCAwIDEgMCAwbDEuNDE0LTEuNDE0ek0xNC4zNjQgMTAuNzY5YS43NS43NSAwIDEgMSAxLjA2MSAxLjA2MWwtNC41IDQuNWEuNzUuNzUgMCAwIDEtMS4wNjEgMEw1LjUgMTEuODM3YS43NS43NSAwIDEgMSAxLjA2MS0xLjA2MWwzLjIxNyAzLjIxN2w0LjU4Ni00LjU4NkExOS42MzEgMTkuNjMxIDE0LjM2NCAxMC43N3oiIGNsaXAtcnVsZT0iZXZlbm9kZCIvIDwvc3ZnPg==')] bg-no-repeat bg-[center_right_0.75rem] transition duration-150 ease-in-out ${error ? 'border-red-300 ring-1 ring-red-300' : 'border-gray-300 focus:ring-indigo-400'}`}
            {...props}
        >
            {children}
        </select>
         <AnimatePresence>
         {error && <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-[11px] text-red-600 mt-1 absolute -bottom-0.5 left-1">{error}</motion.p>}
        </AnimatePresence>
    </div>
));
// --- End Reusable Components ---

function TeacherCreateQuiz() {
    const navigate = useNavigate();

    // --- State Variables (keep as before) ---
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [timeLimitMinutes, setTimeLimitMinutes] = useState('');
    const [teacherClasses, setTeacherClasses] = useState([]);
    const [subjectsForClass, setSubjectsForClass] = useState([]);
    const [isLoadingClasses, setIsLoadingClasses] = useState(true);
    const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
    const [questions, setQuestions] = useState([]);
    const [newQuestion, setNewQuestion] = useState({...initialNewQuestionState}); // Use spread to ensure new object
    const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);
    const [error, setError] = useState('');
    const [formError, setFormError] = useState({}); // Use object for potential field-specific errors
    const [isSaving, setIsSaving] = useState(false);
    const questionEditorRef = useRef(null); // Ref for scrolling

    // --- Data Fetching (Keep as before) ---
    const fetchClasses = useCallback(async () => {/* ... */ setIsLoadingClasses(true); try { const res = await api.get('/teacher/classes'); setTeacherClasses((res.data || []).filter(c => c.subjects?.length > 0)); } catch(e) {setError("Failed to load classes");} finally {setIsLoadingClasses(false);} }, []);
    useEffect(() => { fetchClasses(); }, [fetchClasses]);
    useEffect(() => { setSubjectsForClass([]); setSelectedSubjectId(''); if (!selectedClassId) return; const cls = teacherClasses.find(c => c._id === selectedClassId); setSubjectsForClass(cls?.subjects || []); }, [selectedClassId, teacherClasses]);

    // --- Question Form Handlers ---
    const handleNewQuestionChange = (e) => {
        const { name, value } = e.target;
        setNewQuestion(prev => ({ ...prev, [name]: value }));
        setFormError(prev => ({...prev, [name]: null})); // Clear specific error
    };
    const handleOptionChange = (index, value) => {
        setNewQuestion(prev => {
            const updatedOptions = [...prev.options]; updatedOptions[index] = value;
            return { ...prev, options: updatedOptions };
        });
         setFormError(prev => ({...prev, [`option_${index}`]: null, optionsGeneral: null})); // Clear specific/general option error
    };
    const handleCorrectAnswerSelect = (index) => {
        setNewQuestion(prev => ({ ...prev, correctAnswerIndex: index }));
         setFormError(prev => ({...prev, correctAnswerIndex: null})); // Clear specific error
    };

    // Enhanced Validation and Add/Update
    const handleAddOrUpdateQuestion = () => {
        let currentFormErrors = {};
        // Validation Checks
        if (!newQuestion.questionText.trim()) currentFormErrors.questionText = "Question text required.";
        const validOptions = newQuestion.options.map(opt => opt.trim()).filter(Boolean); // Get trimmed, non-empty options
        if (validOptions.length < 2) currentFormErrors.optionsGeneral = "At least 2 non-empty options required.";
        if (newQuestion.correctAnswerIndex === null) currentFormErrors.correctAnswerIndex = "Select correct answer.";
        else if (newQuestion.options[newQuestion.correctAnswerIndex]?.trim() === '') currentFormErrors.correctAnswerIndex = "Correct answer cannot be empty.";

        setFormError(currentFormErrors); // Set all errors at once

        if (Object.keys(currentFormErrors).length > 0) return; // Stop if errors exist

        // Prepare question object (store all 4 options as trimmed)
        const questionToSave = {
             questionText: newQuestion.questionText.trim(),
             options: newQuestion.options.map(opt => (opt || '').trim()),
             correctAnswerIndex: newQuestion.correctAnswerIndex
        };

        // Add or Update
        if (editingQuestionIndex !== null) {
            const updatedQuestions = questions.map((q, index) => index === editingQuestionIndex ? questionToSave : q);
            setQuestions(updatedQuestions);
        } else {
            setQuestions(prev => [...prev, questionToSave]);
        }
        cancelEditing(); // Reset form
    };

    const handleEditQuestion = (index) => {
        if (index >= 0 && index < questions.length) {
            const q = questions[index];
            setNewQuestion({ // Load into form state
                questionText: q.questionText,
                options: [ q.options[0] || '', q.options[1] || '', q.options[2] || '', q.options[3] || '' ], // Ensure 4 slots
                correctAnswerIndex: q.correctAnswerIndex
            });
            setEditingQuestionIndex(index);
            setFormError({}); // Clear errors
             // Scroll to editor smoothly
            questionEditorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const handleDeleteQuestion = (index) => {
        if (window.confirm(`Delete question ${index + 1}?`)) {
            setQuestions(prev => prev.filter((_, i) => i !== index));
            if (editingQuestionIndex === index) { cancelEditing(); }
        }
    };

    const cancelEditing = () => {
        setNewQuestion({...initialNewQuestionState}); // Ensure fresh object
        setEditingQuestionIndex(null);
        setFormError({});
    };

    const handleSubmitQuiz = async (status = 'Draft') => {
        console.log(`[handleSubmitQuiz] Called with status: ${status}`); // Log function call
        setError(''); // Clear previous global errors
        setFormError({}); // Clear previous form errors

        // --- 1. Frontend Validation ---
        let validationPassed = true;
        let errors = {}; // Local errors object for this submission

        if (!title.trim()) { errors.title = "Title required"; validationPassed = false; }
        if (!selectedClassId) { errors.classId = "Class required"; validationPassed = false; }
        if (!selectedSubjectId) { errors.subjectId = "Subject required"; validationPassed = false; }
        if (questions.length === 0) { errors.questions = "Add at least one question."; validationPassed = false; }
        if (editingQuestionIndex !== null) { errors.editing = "Save or cancel the current question edit first."; validationPassed = false; }

        // Update local error state if needed (though primary display is via global error now)
        // setFormError(errors); // Update formError state if you use it for inline field errors

        if (!validationPassed) {
             // Combine errors into a single message for the main error banner
             const errorMessages = Object.values(errors).filter(Boolean); // Get non-empty error messages
             setError(errorMessages.length > 0 ? errorMessages.join(' ') : "Please complete all required fields.");
             console.warn("[handleSubmitQuiz] Validation Failed:", errors);
             window.scrollTo(0,0); // Scroll to top to show error banner
             return; // Stop submission
        }
        // --- End Validation ---


        // --- 2. Set Loading State ---
        setIsSaving(true);
        console.log("[handleSubmitQuiz] Validation passed. Setting isSaving=true.");

        // --- 3. Prepare Payload ---
        const formattedQuestions = questions.map(q => ({
            questionText: q.questionText,
            options: q.options,
            correctAnswerIndex: q.correctAnswerIndex
        }));

        const quizData = {
             title: title.trim(),
             description: description.trim(),
             classId: selectedClassId,
             subjectId: selectedSubjectId,
             timeLimitMinutes: timeLimitMinutes ? Number(timeLimitMinutes) : null,
             questions: formattedQuestions,
             status: status, // Use the status passed to the function ('Draft' or 'Published')
        };

        console.log("[handleSubmitQuiz] Sending Payload to Backend:", JSON.stringify(quizData, null, 2));

        // --- 4. API Call ---
        try {
             const response = await api.post('/teacher/quizzes', quizData);
             console.log("[handleSubmitQuiz] API Success Response:", response.data);
             alert(`Quiz '${response.data.title || title}' saved successfully as ${status}!`); // Use response title if available
             navigate('/teacher/quizzes'); // Navigate to quiz list after success

        } catch (err) {
             console.error("[handleSubmitQuiz] API Error:", err);
             // Display specific error from backend if available, otherwise generic
             setError(err.response?.data?.message || err.message || "An error occurred while saving the quiz.");
             window.scrollTo(0,0); // Scroll to show error
        } finally {
             setIsSaving(false); // Clear loading state regardless of success/failure
             console.log("[handleSubmitQuiz] Finished attempt. Setting isSaving=false.");
        }
     };


    // --- Render ---
    if (isLoadingClasses) { /* ... Loading ... */ }

    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-6 bg-gradient-to-br from-indigo-50 via-purple-50 to-gray-100 min-h-screen font-sans">
            {/* Header */}
            <div className='flex items-center justify-between mb-6 pb-4 border-b border-gray-300'>
                <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-purple-700">
                    {editingQuestionIndex !== null ? 'Edit Quiz' : 'Create New Quiz'}
                </h1>
                <button onClick={() => navigate('/teacher/quizzes')} className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium p-1">
                    <FiArrowLeft size={16} /> Back to Quiz List
                </button>
            </div>

            {/* Global Error */}
            <AnimatePresence>{error }</AnimatePresence>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 lg:gap-8 items-start">

                {/* --- Left Column (XL): Quiz Details & Actions --- */}
                <div className="xl:col-span-2 space-y-6">
                    {/* Details Card */}
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-white p-5 rounded-xl shadow-lg border border-gray-200/70">
                        <h2 className="text-md font-semibold text-gray-700 border-b border-gray-200 pb-2 mb-4 flex items-center gap-2"><FiTarget className="text-indigo-500"/>Quiz Setup</h2>
                        <div className="space-y-1"> {/* Reduced spacing for tighter form */}
                            <InputField id="quizTitle" label="Title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Chapter 1 Review" error={error && !title.trim() ? 'Required': null} icon={FiTag}/>
                            <TextareaField id="quizDescription" label="Description" rows="2" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional instructions..." icon={FiInfo} />
                            <div className='grid grid-cols-2 gap-x-3'>
                                <SelectField id="classSelectQuiz" label="Class" required value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} disabled={teacherClasses.length === 0} error={error && !selectedClassId ? 'Required': null}>
                                    <option value="">-- Select --</option> {teacherClasses.map(cls => (<option key={cls._id} value={cls._id}>{cls.name}</option>))}
                                </SelectField>
                                <SelectField id="subjectSelectQuiz" label="Subject" required value={selectedSubjectId} onChange={(e) => setSelectedSubjectId(e.target.value)} disabled={!selectedClassId || subjectsForClass.length === 0} error={error && !selectedSubjectId ? 'Required': null}>
                                     <option value="">-- Select --</option> {subjectsForClass.map(subj => (<option key={subj._id} value={subj._id}>{subj.name}</option> ))}
                                </SelectField>
                            </div>
                            <InputField id="timeLimit" label="Time Limit (Minutes)" type="number" value={timeLimitMinutes} onChange={(e) => setTimeLimitMinutes(e.target.value)} placeholder="Optional (e.g., 30)" min="1" icon={FiClock}/>
                        </div>
                    </motion.div>
                    
                </div>

                {/* --- Right Column (XL): Question Builder & List --- */}
                <div className="xl:col-span-3 space-y-6">
                    {/* Question Editor Card */}
                    <motion.div ref={questionEditorRef} id="question-editor-section" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="bg-white p-5 rounded-xl shadow-xl border border-gray-200/90">
                        <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-3 mb-4 flex items-center gap-2">
                            <FiEdit2 className="text-purple-600"/> {editingQuestionIndex !== null ? `Editing Question ${editingQuestionIndex + 1}` : 'Add New Question'}
                        </h2>
                        <div className="space-y-4">
                             <TextareaField id="questionText" name="questionText" label="Question Text" required rows="3" value={newQuestion.questionText} onChange={handleNewQuestionChange} placeholder="Enter the question..." error={formError.questionText} />
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Options <span className="text-red-500">*</span> (Mark Correct Answer)</label>
                                <div className="space-y-2.5">
                                    {newQuestion.options.map((option, index) => (
                                        <div key={index} className="flex items-center gap-3 bg-gray-50/70 p-2 rounded-md border border-gray-200/80 has-[:checked]:border-green-400 has-[:checked]:bg-green-50/60 transition-colors"> {/* Highlight parent when radio inside is checked */}
                                            <input type="radio" name={`correctAnswer_${editingQuestionIndex ?? 'new'}`} id={`option_correct_${index}`} checked={newQuestion.correctAnswerIndex === index} onChange={() => handleCorrectAnswerSelect(index)} className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500 flex-shrink-0 cursor-pointer accent-green-500" title="Mark as correct"/>
                                            <InputField id={`option_${index}`} type="text" value={option} onChange={(e) => handleOptionChange(index, e.target.value)} placeholder={`Option ${index + 1}${index < 2 ? ' *' : ''}`} error={formError[`option_${index}`] || (formError.optionsGeneral && index < 2 && !option.trim() ? 'Req.': null)} required={index<2} className={`flex-grow !shadow-none !border-gray-300 focus:!ring-1 focus:!border-indigo-400 ${newQuestion.correctAnswerIndex === index ? '!bg-green-50/0' : '!bg-white'}`} /> {/* Simplified input */}
                                        </div>
                                    ))}
                                    {formError.optionsGeneral && <p className="text-xs text-red-600 mt-1">{formError.optionsGeneral}</p>}
                                    {formError.correctAnswerIndex && <p className="text-xs text-red-600 mt-1">{formError.correctAnswerIndex}</p>}
                                </div>
                            </div>
                             <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100 mt-4">
                                {editingQuestionIndex !== null && ( <button type="button" onClick={cancelEditing} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 transition shadow-sm"> Cancel Edit </button> )}
                                <button type="button" onClick={handleAddOrUpdateQuestion} className="inline-flex items-center gap-1.5 px-5 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 transform hover:scale-105 transition">
                                    {editingQuestionIndex !== null ? <FiCheck size={16}/> : <FiPlus size={16}/>} {editingQuestionIndex !== null ? 'Update Question' : 'Add Question to List'}
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Question List Card */}
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }} className="bg-white p-5 rounded-xl shadow-xl border border-gray-200/90">
                        <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-3 mb-4 flex items-center justify-between">
                            <span className='flex items-center gap-2'><FiList className="text-green-600"/>Quiz Questions</span>
                            <span className='text-sm font-bold text-indigo-600 bg-indigo-100 px-2.5 py-1 rounded-full'>{questions.length}</span>
                        </h2>
                        {questions.length === 0 ? (
                            <p className="text-sm text-center text-gray-400 italic py-10">No questions added yet. Use the form above.</p>
                        ) : (
                            <ul className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2 -mr-2"> {/* Increased max-height */}
                                <AnimatePresence initial={false}> {/* Allow exit animations */}
                                    {questions.map((q, index) => (
                                       <motion.li
                                           key={`q-item-${index}`} // Use a more stable key if possible later
                                           layout // Animate layout changes
                                           initial={{ opacity: 0, height: 0 }}
                                           animate={{ opacity: 1, height: 'auto' }}
                                           exit={{ opacity: 0, x: 50, transition: { duration: 0.2 } }}
                                           className="p-3.5 border border-gray-200 rounded-lg bg-gray-50/50 hover:bg-gray-100/70 transition-colors group relative overflow-hidden" // Added overflow-hidden
                                       >
                                            <div className="flex justify-between items-start gap-2 mb-2.5">
                                                <p className="text-sm font-medium text-gray-900 flex-1 pr-16 leading-snug"><span className='font-bold text-indigo-700 mr-1.5'>{index + 1}.</span>{q.questionText}</p>
                                                 {/* Actions - improved visibility */}
                                                 <div className="absolute top-2 right-2 flex-shrink-0 flex items-center gap-1 opacity-50 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150">
                                                    <button onClick={() => handleEditQuestion(index)} title="Edit" className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-full transition disabled:opacity-30 disabled:cursor-not-allowed" disabled={editingQuestionIndex !== null}><FiEdit2 size={14}/></button>
                                                    <button onClick={() => handleDeleteQuestion(index)} title="Delete" className="p-1.5 text-red-500 hover:bg-red-100 rounded-full transition disabled:opacity-30 disabled:cursor-not-allowed" disabled={editingQuestionIndex !== null}><FiTrash2 size={14}/></button>
                                                </div>
                                            </div>
                                            {/* Options */}
                                            <ul className="space-y-1.5 pl-5 text-xs mt-3 border-t border-gray-200 pt-2">
                                                {q.options.map((opt, optIndex) => (
                                                   <li key={optIndex} className={`flex items-center gap-2 ${q.correctAnswerIndex === optIndex ? 'text-green-800 font-medium' : 'text-gray-700'}`}>
                                                        {q.correctAnswerIndex === optIndex ? <FiCheckSquare size={13} className="text-green-500 flex-shrink-0"/> : <FiGrid size={13} className="text-gray-400 flex-shrink-0"/>} {/* Use Grid for neutral */}
                                                        <span>{opt || <span className='italic text-gray-400'>(Empty Option)</span>}</span>
                                                    </li>
                                               ))}
                                            </ul>
                                        </motion.li>
                                   ))}
                                </AnimatePresence>
                            </ul>
                         )}
                    </motion.div>
                    {/* Actions Card */}
                    <motion.div /* ... */ className="bg-gradient-to-br from-gray-50 via-gray-100 to-white p-5 rounded-xl shadow-lg border border-gray-200/70 sticky top-20">
                        <h2 className="text-base font-semibold text-gray-700 border-b border-gray-200 pb-2 mb-4 flex items-center gap-2"><FiSave className="text-blue-500"/>Actions</h2>
                        <div className="space-y-3">
                            {/* *** CHECK BUTTONS AND DISABLED LOGIC *** */}
                            <button
                                type="button"
                                onClick={() => handleSubmitQuiz('Draft')} // Pass 'Draft' status
                                disabled={isSaving || questions.length === 0 || editingQuestionIndex !== null}
                                className="w-full inline-flex justify-center items-center gap-2 px-4 py-2 border border-indigo-300 rounded-md shadow-sm text-sm font-medium text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                <FiSave size={16} /> Save as Draft
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSubmitQuiz('Published')} // Pass 'Published' status
                                disabled={isSaving || questions.length === 0 || editingQuestionIndex !== null}
                                className="w-full inline-flex justify-center items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                {isSaving ? <FiLoader className="animate-spin" size={16} /> : <FiCheckCircle size={16} />}
                                {isSaving ? 'Saving...' : 'Save & Publish'}
                            </button>
                            {/* Informational message */}
                            {(questions.length === 0 || editingQuestionIndex !== null) &&
                                <p className='text-xs text-center text-amber-700 bg-amber-50 p-2 rounded border border-amber-200 flex items-center justify-center gap-1'>
                                <FiInfo size={14}/> {editingQuestionIndex !== null ? 'Save/cancel question edit first.' : 'Add questions before saving.'}
                                </p>
                            }
                            {/* *** END BUTTON CHECK *** */}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

export default TeacherCreateQuiz;