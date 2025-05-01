// src/teacherSide/TeacherViewSubjects.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiCheck,
  FiX,
  FiLayers,
  FiChevronRight,
  FiAlertTriangle,
  FiInbox,
  FiLoader,
  FiBook,
  FiFileText,
  FiSearch,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import api from '../services/api'; // <-- Import the API service

// --- Reusable Animated Input for Inline Edit/Add ---
// (Keep the AnimatedInlineInput component as it was in your original file)
const AnimatedInlineInput = ({
  value,
  onChange,
  onSave,
  onCancel,
  placeholder,
  inputRef,
  isSaving,
  error,
  bgColor = "bg-indigo-50",
  borderColor = "border-indigo-200",
}) => (
  <motion.div
    layout
    initial={{ opacity: 0, height: 0 }}
    animate={{ opacity: 1, height: "auto" }}
    exit={{ opacity: 0, height: 0 }}
    transition={{ duration: 0.2 }}
    className={`flex items-center gap-2 py-1.5 px-2 rounded-md shadow-sm ${
      error ? `bg-red-50 border border-red-300` : `${bgColor} border ${borderColor}` // Added border class
    }`}
  >
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={isSaving}
      className={`flex-grow px-2.5 py-1.5 border rounded-md text-sm focus:ring-1 focus:outline-none transition duration-150 ease-in-out ${
        error
          ? "border-red-400 focus:ring-red-500 focus:border-red-500 text-red-800 placeholder-red-400"
          : "border-indigo-300 focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 placeholder-gray-400"
      } disabled:bg-gray-100`}
      onKeyDown={(e) => {
        if (e.key === "Enter" && value.trim()) onSave(); // Trigger save only if value is not empty
        if (e.key === "Escape") onCancel();
      }}
    />
    <button
      onClick={onSave}
      disabled={isSaving || !value.trim()}
      className="p-1.5 text-green-600 hover:text-green-700 disabled:text-green-300 disabled:cursor-not-allowed rounded-md hover:bg-green-100/50 transition" // Adjusted disabled style
      title="Save"
    >
      <FiCheck size={18} />
    </button>
    <button
      onClick={onCancel}
      disabled={isSaving}
      className="p-1.5 text-red-600 hover:text-red-700 disabled:text-red-300 disabled:cursor-not-allowed rounded-md hover:bg-red-100/50 transition" // Adjusted disabled style
      title="Cancel"
    >
      <FiX size={18} />
    </button>
  </motion.div>
);


// --- Skeleton Loaders ---
// (Keep the Skeleton components as they were)
const ClassListSkeleton = () => (
  <div className="space-y-2.5 animate-pulse">
    {" "}
    {[...Array(5)].map((_, i) => (
      <div key={i} className="h-12 bg-slate-200/70 rounded-lg"></div>
    ))}{" "}
  </div>
);
const SubjectListSkeleton = () => (
  <div className="space-y-3 animate-pulse">
    {" "}
    {[...Array(4)].map((_, i) => (
      <div key={i} className="h-[72px] bg-slate-200/70 rounded-lg"></div>
    ))}{" "}
  </div>
);
const DetailPaneSkeleton = () => (
  <div className="flex-grow flex flex-col items-center justify-center text-gray-300 animate-pulse">
    {" "}
    <FiLayers size={56} className="opacity-50 mb-5" />{" "}
    <div className="h-4 bg-slate-300 rounded w-36 mb-2"></div>{" "}
    <div className="h-3 bg-slate-200 rounded w-48"></div>{" "}
  </div>
);

// --- Confirmation Modal ---
// (Keep the ConfirmationModal component as it was)
const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  confirmColor = "red",
  isProcessing = false,
}) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div // Backdrop
        key="confirmModal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]"
        onClick={onClose}
      >
        <motion.div // Modal Content
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm text-center relative border border-gray-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-${confirmColor}-100 mb-4`}
          >
            <FiAlertTriangle className={`h-6 w-6 text-${confirmColor}-600`} />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
          <p className="text-sm text-gray-600 mb-6 whitespace-pre-wrap">
            {message}
          </p>
          <div className="flex justify-center gap-3">
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              disabled={isProcessing}
              className="px-5 py-2 text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400 disabled:opacity-50 shadow-sm"
            >
              Cancel
            </motion.button>
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={onConfirm}
              disabled={isProcessing}
              className={`px-5 py-2 text-sm font-medium text-white bg-${confirmColor}-600 rounded-md shadow-sm hover:bg-${confirmColor}-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${confirmColor}-500 disabled:opacity-50`}
            >
              {isProcessing ? (
                <FiLoader className="animate-spin mr-2 inline" />
              ) : null}{" "}
              {confirmText}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// --- Main Component ---
const TeacherViewSubjects = () => {
  // --- State ---
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true); // Initially loading classes
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [error, setError] = useState({ scope: null, message: "" }); // scope: 'global', 'class-add', 'class-edit-<id>', 'subject-add', 'subject-edit-<id>'
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [editingClass, setEditingClass] = useState(null); // Stores { _id, name } of class being edited
  const [editingClassName, setEditingClassName] = useState("");
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [editingSubject, setEditingSubject] = useState(null); // Stores { _id, name } of subject being edited
  const [editingSubjectName, setEditingSubjectName] = useState("");
  const [subjectToDelete, setSubjectToDelete] = useState(null); // Stores { _id, name }
  const [classToDelete, setClassToDelete] = useState(null); // Stores { _id, name }
  const [isSaving, setIsSaving] = useState(false); // General saving state for mutations
  const [searchTerm, setSearchTerm] = useState("");

  // --- Refs ---
  const addClassInputRef = useRef(null);
  const editClassInputRef = useRef(null);
  const addSubjectInputRef = useRef(null);
  const editSubjectInputRef = useRef(null);

  // --- Focus Effects (Keep as is) ---
  useEffect(() => { if (isAddingClass) addClassInputRef.current?.focus(); }, [isAddingClass]);
  useEffect(() => { if (editingClass) editClassInputRef.current?.focus(); }, [editingClass]);
  useEffect(() => { if (isAddingSubject) addSubjectInputRef.current?.focus(); }, [isAddingSubject]);
  useEffect(() => { if (editingSubject) editSubjectInputRef.current?.focus(); }, [editingSubject]);

  // --- Data Fetching ---
  const fetchClasses = useCallback(async () => {
    setIsLoadingClasses(true);
    setError({ scope: null, message: "" });
    try {
      console.log("Fetching classes via API...");
      const response = await api.get('/teacher/classes');
      setClasses(response.data || []);
      console.log("Fetched classes:", response.data);
    } catch (err) {
      console.error("Error fetching classes:", err);
      setError({ scope: 'global', message: err.response?.data?.message || "Failed to load classes." });
      setClasses([]);
    } finally {
      setIsLoadingClasses(false);
    }
  }, []);

  const fetchSubjectsForClass = useCallback(async (classId) => {
    if (!classId) {
      setSubjects([]);
      return;
    }
    setIsLoadingSubjects(true);
    setError({ scope: null, message: "" }); // Clear previous errors
    setSubjects([]); // Clear existing subjects before fetching
    try {
      console.log(`Fetching subjects for class ${classId} via API...`);
      // --- Replace with actual API call ---
      // ** NOTE: This endpoint needs to be created in the backend **
      const response = await api.get(`/teacher/classes/${classId}/subjects`);
      setSubjects(response.data || []); // Assuming backend returns an array of subjects { _id, name }
      console.log("Fetched subjects:", response.data);
    } catch (err) {
      console.error(`Error fetching subjects for class ${classId}:`, err);
      setError({ scope: 'global', message: err.response?.data?.message || `Failed to load subjects for this class.` });
      setSubjects([]);
    } finally {
      setIsLoadingSubjects(false);
    }
  }, []); // Dependency array is empty as api is stable

  // Initial class fetch on mount
  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  // Fetch subjects when selectedClassId changes
  useEffect(() => {
    fetchSubjectsForClass(selectedClassId);
  }, [selectedClassId, fetchSubjectsForClass]); // Add fetchSubjectsForClass dependency


  // --- Action Handlers ---
  const handleSelectClass = (classId) => {
    if (editingClass?._id === classId || isSaving) return; // Prevent selection change during edit/save
    setSelectedClassId(classId);
    setIsAddingSubject(false); // Close add subject form
    setEditingSubject(null); // Close edit subject form
    setError({ scope: null, message: "" }); // Clear errors
    setEditingClass(null); // Ensure class edit mode is off
  };

  // --- Class Actions ---
  const handleAddClass = async () => {
    const name = newClassName.trim();
    const errorScope = "class-add";
    if (!name) {
      setError({ scope: errorScope, message: "Class name is required." });
      return;
    }
    // Frontend check for duplicate name (optional, backend should handle primary)
    if (classes.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      setError({ scope: errorScope, message: "Class name already exists." });
      return;
    }

    setIsSaving(true);
    setError({ scope: null, message: "" });
    try {
      console.log("Calling API to add class:", name);
      const response = await api.post('/teacher/classes', { name });
      console.log("Class add API response:", response.data);
      setIsAddingClass(false);
      setNewClassName("");
      // Re-fetch classes to include the new one and potentially select it
      await fetchClasses(); // Re-fetch the whole list
      // Optionally auto-select the newly added class:
      // if (response.data?._id) {
      //   handleSelectClass(response.data._id);
      // }
    } catch (err) {
      console.error("Error adding class:", err);
      setError({ scope: errorScope, message: err.response?.data?.message || "Failed to add class." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleShowEditClass = (cls) => {
    if (isSaving) return;
    setEditingClass(cls);
    setEditingClassName(cls.name);
    setIsAddingClass(false); // Ensure add mode is off
    setError({ scope: null, message: "" });
  };

  const handleCancelEditClass = () => {
    setEditingClass(null);
    setEditingClassName("");
    setError({ scope: null, message: "" });
  };

  const handleUpdateClass = async () => {
    const name = editingClassName.trim();
    const errorScope = `class-edit-${editingClass?._id}`;
    if (!name || !editingClass) return;
    if (name === editingClass.name) { // No change
      handleCancelEditClass();
      return;
    }
    // Optional frontend duplicate check
    if (classes.some((c) => c._id !== editingClass._id && c.name.toLowerCase() === name.toLowerCase())) {
      setError({ scope: errorScope, message: "Another class has this name." });
      return;
    }

    setIsSaving(true);
    setError({ scope: null, message: "" });
    try {
      console.log("Calling API to update class:", editingClass._id, "to name:", name);
      await api.put(`/teacher/classes/${editingClass._id}`, { name });
      console.log("Class update successful.");
      handleCancelEditClass();
      await fetchClasses(); // Re-fetch to update the list
    } catch (err) {
      console.error("Error updating class:", err);
      setError({ scope: errorScope, message: err.response?.data?.message || "Failed to update class." });
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDeleteClass = (cls) => {
    setClassToDelete(cls); // Store { _id, name }
    setError({ scope: null, message: "" });
  };

  const executeDeleteClass = async () => {
    if (!classToDelete) return;
    setIsSaving(true);
    setError({ scope: null, message: "" });
    try {
      console.log("Calling API to delete class:", classToDelete._id);
      await api.delete(`/teacher/classes/${classToDelete._id}`);
      console.log("Class deleted successfully via API.");
      setClassToDelete(null); // Close modal
      const deletedId = classToDelete._id;
      await fetchClasses(); // Re-fetch updated list
      if (selectedClassId === deletedId) { // If deleted class was selected
        setSelectedClassId(null); // Deselect it
        setSubjects([]); // Clear subjects pane
      }
    } catch (err) {
      console.error("Error deleting class:", err);
      setError({ scope: 'global', message: err.response?.data?.message || "Failed to delete class." });
      setClassToDelete(null); // Close modal even on error
    } finally {
      setIsSaving(false);
    }
  };

  // --- Subject Actions ---
  const handleAddSubject = async () => {
    const name = newSubjectName.trim();
    const errorScope = "subject-add";
    if (!name || !selectedClassId) return;
    // Optional frontend duplicate check
    if (subjects.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      setError({ scope: errorScope, message: "Subject name already exists in this class." });
      return;
    }

    setIsSaving(true);
    setError({ scope: null, message: "" });
    try {
      console.log(`Calling API to add subject "${name}" to class ${selectedClassId}`);
      // ** NOTE: This endpoint needs to be created in the backend **
      await api.post(`/teacher/classes/${selectedClassId}/subjects`, { name });
      console.log("Subject added successfully.");
      setIsAddingSubject(false);
      setNewSubjectName("");
      await fetchSubjectsForClass(selectedClassId); // Re-fetch subjects for the current class
    } catch (err) {
      console.error("Error adding subject:", err);
      setError({ scope: errorScope, message: err.response?.data?.message || "Failed to add subject." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleShowEditSubject = (subject) => {
    if (isSaving) return;
    setEditingSubject(subject);
    setEditingSubjectName(subject.name);
    setIsAddingSubject(false); // Ensure add mode is off
    setError({ scope: null, message: "" });
  };

  const handleCancelEditSubject = () => {
    setEditingSubject(null);
    setEditingSubjectName("");
    setError({ scope: null, message: "" });
  };

  const handleUpdateSubject = async () => {
    const name = editingSubjectName.trim();
    const errorScope = `subject-edit-${editingSubject?._id}`;
    if (!name || !editingSubject || !selectedClassId) return;
    if (name === editingSubject.name) { // No change
      handleCancelEditSubject();
      return;
    }
    // Optional frontend duplicate check
    if (subjects.some((s) => s._id !== editingSubject._id && s.name.toLowerCase() === name.toLowerCase())) {
       setError({ scope: errorScope, message: "Another subject has this name in this class." });
      return;
    }

    setIsSaving(true);
    setError({ scope: null, message: "" });
    try {
       console.log(`Calling API to update subject ${editingSubject._id} in class ${selectedClassId} to name "${name}"`);
       // ** NOTE: This endpoint needs to be created in the backend **
       await api.put(`/teacher/classes/${selectedClassId}/subjects/${editingSubject._id}`, { name });
       console.log("Subject updated successfully.");
       handleCancelEditSubject();
       await fetchSubjectsForClass(selectedClassId); // Re-fetch subjects
    } catch (err) {
       console.error("Error updating subject:", err);
       setError({ scope: errorScope, message: err.response?.data?.message || "Failed to update subject." });
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDeleteSubject = (subject) => {
    setSubjectToDelete(subject); // Store { _id, name }
    setError({ scope: null, message: "" });
  };

  const executeDeleteSubject = async () => {
    if (!subjectToDelete || !selectedClassId) return;
    setIsSaving(true);
    setError({ scope: null, message: "" });
    try {
       console.log(`Calling API to delete subject ${subjectToDelete._id} from class ${selectedClassId}`);
       // ** NOTE: This endpoint needs to be created in the backend **
       await api.delete(`/teacher/classes/${selectedClassId}/subjects/${subjectToDelete._id}`);
       console.log("Subject deleted successfully via API.");
       setSubjectToDelete(null); // Close modal
       await fetchSubjectsForClass(selectedClassId); // Re-fetch subjects for the current class
    } catch (err) {
      console.error("Error deleting subject:", err);
      setError({ scope: 'global', message: err.response?.data?.message || "Failed to delete subject." });
      setSubjectToDelete(null); // Close modal on error
    } finally {
      setIsSaving(false);
    }
  };

  // --- Filtered Classes ---
  const filteredClasses = classes.filter((cls) =>
    cls.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Selected Class Name ---
  const selectedClassName = classes.find((c) => c._id === selectedClassId)?.name || "";

  // --- Component Render ---
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-100 via-white to-blue-100 p-4 sm:p-6 md:p-8 overflow-hidden font-sans">
      {/* Header */}
      <header className="mb-6 pb-4 border-b border-slate-200/80 flex-shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-700 to-indigo-800">
            Subject Management
          </h1>
          <p className="text-sm md:text-base text-slate-500 mt-1">
            Organize subjects within your assigned classes.
          </p>
        </div>
      </header>

      {/* Global Error Display */}
      {error.scope === "global" && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg relative shadow-sm flex items-center justify-between flex-shrink-0"
          role="alert"
        >
          <span className="flex items-center">
            <FiAlertTriangle className="inline mr-2 flex-shrink-0" />
            <span className="text-sm">{error.message}</span>
          </span>
          <button
            onClick={() => setError({ scope: null, message: "" })}
            className="ml-3 text-red-600 hover:text-red-800 text-xl font-bold flex-shrink-0"
            aria-label="Close error"
          >
            ×
          </button>
        </motion.div>
      )}

      {/* Main Content Area */}
      <div className="flex-grow flex gap-6 md:gap-8 overflow-hidden">

        {/* Left Column: Class List */}
        <motion.div
          layout
          className="w-2/5 lg:w-1/3 xl:w-1/4 flex-shrink-0 bg-gradient-to-br from-white/70 via-white to-white/70 backdrop-blur-xl p-4 rounded-xl shadow-xl border border-slate-200/70 flex flex-col h-full overflow-hidden"
        >
          {/* Column Header & Search/Add */}
          <div className="mb-3 pb-3 border-b border-slate-200/60 flex-shrink-0 px-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-grow">
                <FiSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                <input
                  type="text"
                  placeholder="Search classes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-2 py-1.5 border border-slate-300 rounded-md text-sm focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 outline-none shadow-sm bg-white/70 placeholder-slate-400"
                />
              </div>
              <motion.button
                title="Add New Class"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => { setIsAddingClass(true); setError({ scope: null, message: "" }); setEditingClass(null); }}
                disabled={isSaving || isAddingClass}
                className={`p-2 bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg ${isSaving || isAddingClass ? 'opacity-50 cursor-not-allowed' : ''} transition shadow-md flex-shrink-0`}
                aria-label="Add New Class"
              >
                <FiPlus size={16} />
              </motion.button>
            </div>
            <AnimatePresence>
              {isAddingClass && !editingClass && (
                <motion.div key="addClassDiv" layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <AnimatedInlineInput
                    value={newClassName}
                    onChange={(e) => { setNewClassName(e.target.value); setError({ scope: null, message: "" }); }}
                    onSave={handleAddClass}
                    onCancel={() => { setIsAddingClass(false); setNewClassName(""); setError({ scope: null, message: "" }); }}
                    placeholder="New Class Name"
                    inputRef={addClassInputRef}
                    isSaving={isSaving}
                    error={error.scope === "class-add"}
                    bgColor="bg-blue-50"
                    borderColor="border-blue-200"
                  />
                  {error.scope === "class-add" && <p className="text-xs text-red-600 mt-1 pl-1">{error.message}</p>}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Class List Scrollable Area */}
          <div className="flex-grow overflow-y-auto space-y-2 pr-1 -mr-1 py-1">
            {isLoadingClasses ? (
              <ClassListSkeleton />
            ) : filteredClasses.length === 0 && !isAddingClass ? (
              <div className="text-center py-10 text-sm text-slate-500 italic px-2">
                {classes.length === 0 ? "No classes created." : "No classes match search."}
              </div>
            ) : (
              <AnimatePresence>
                {filteredClasses.map((cls) => (
                  <motion.div
                    layout key={cls._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                    className={`group relative border rounded-lg transition-all duration-200 ease-out overflow-hidden ${
                      editingClass?._id === cls._id
                        ? "border-yellow-300 bg-yellow-50/60 shadow-inner" // Editing style
                        : selectedClassId === cls._id
                        ? "border-transparent bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg" // Selected style
                        : "border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-sm" // Default style
                    }`}
                  >
                    {editingClass?._id === cls._id ? (
                      <div className="p-2">
                        <AnimatedInlineInput
                          value={editingClassName}
                          onChange={(e) => { setEditingClassName(e.target.value); setError({ scope: null, message: "" }); }}
                          onSave={handleUpdateClass}
                          onCancel={handleCancelEditClass}
                          placeholder="Edit Class Name"
                          inputRef={editClassInputRef}
                          isSaving={isSaving}
                          error={error.scope === `class-edit-${cls._id}`}
                          bgColor="bg-yellow-50"
                          borderColor="border-yellow-300"
                        />
                        {error.scope === `class-edit-${cls._id}` && <p className="text-xs text-red-600 mt-1 pl-1">{error.message}</p>}
                      </div>
                    ) : (
                      <div
                        onClick={() => handleSelectClass(cls._id)}
                        role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleSelectClass(cls._id); }}
                        className={`flex justify-between items-center text-left px-3.5 py-3 cursor-pointer transition-colors duration-150 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-indigo-400 ${
                          selectedClassId !== cls._id ? "hover:bg-indigo-50/70" : "" }`}
                      >
                        <span className={`text-sm font-medium truncate ${ selectedClassId === cls._id ? "text-white" : "text-slate-700 group-hover:text-indigo-800" }`} >
                          {cls.name}
                        </span>
                        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                          <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150`} >
                            <motion.button
                              title="Edit Class" onClick={(e) => { e.stopPropagation(); handleShowEditClass(cls); }} disabled={isSaving} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                              className={`p-1.5 rounded-full shadow-sm outline-none disabled:opacity-20 disabled:cursor-not-allowed transition ${
                                selectedClassId === cls._id
                                  ? "text-indigo-200 bg-white/10 hover:bg-white/20 hover:text-white focus:bg-white/20 focus:text-white"
                                  : "text-slate-400 bg-white/60 hover:bg-blue-100 hover:text-blue-600 focus:bg-blue-100 focus:text-blue-600"
                              }`} aria-label={`Edit class ${cls.name}`}
                            > <FiEdit2 size={13} /> </motion.button>
                            <motion.button
                              title="Delete Class" onClick={(e) => { e.stopPropagation(); confirmDeleteClass(cls); }} disabled={isSaving} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                              className={`p-1.5 rounded-full shadow-sm outline-none disabled:opacity-20 disabled:cursor-not-allowed transition ${
                                selectedClassId === cls._id
                                  ? "text-red-300 bg-white/10 hover:bg-white/20 hover:text-red-100 focus:bg-white/20 focus:text-red-100"
                                  : "text-slate-400 bg-white/60 hover:bg-red-100 hover:text-red-600 focus:bg-red-100 focus:text-red-600"
                              }`} aria-label={`Delete class ${cls.name}`}
                            > <FiTrash2 size={13} /> </motion.button>
                          </div>
                          <FiChevronRight size={16} className={`transition-opacity duration-150 flex-shrink-0 ${ selectedClassId === cls._id ? "text-indigo-100 opacity-100" : "text-slate-400 group-hover:text-indigo-500 group-hover:opacity-0" }`} />
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </motion.div>

        {/* Right Column: Subject Details */}
        <motion.div
          layout
          className="flex-grow bg-gradient-to-br from-white/80 via-white to-white/80 backdrop-blur-lg p-5 rounded-xl shadow-xl border border-gray-200/70 flex flex-col h-full overflow-hidden"
        >
          {isLoadingClasses ? ( // Show skeleton if initial classes are loading
            <DetailPaneSkeleton />
          ) : !selectedClassId ? (
            <div className="flex-grow flex flex-col items-center justify-center text-center text-slate-400 p-10">
              <FiInbox size={60} className="opacity-40 mb-5 text-slate-300" />
              <p className="font-semibold text-slate-600 text-xl">Select a Class</p>
              <p className="text-base text-slate-500 mt-2">Choose a class from the left panel to view and manage its subjects.</p>
            </div>
          ) : (
            <>
              {/* Header for Selected Class */}
              <motion.header
                layoutId={`className-${selectedClassId}`} // For potential animation
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 pb-3 border-b border-gray-200/80 flex-shrink-0 gap-3"
              >
                <h2 className="text-xl font-semibold text-slate-800 truncate">
                  Subjects in: <span className="text-indigo-700">{selectedClassName}</span>
                </h2>
                <motion.button
                  title="Add New Subject" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => { setIsAddingSubject(true); setEditingSubject(null); setError({ scope: null, message: "" }); }}
                  disabled={isSaving || isAddingSubject}
                  className="flex-shrink-0 flex items-center gap-1.5 text-sm bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-3.5 py-2 rounded-lg font-semibold transition shadow-md disabled:opacity-60"
                > <FiPlus size={16} /> Add Subject </motion.button>
              </motion.header>

              {/* Add Subject Input */}
              <AnimatePresence>
                {isAddingSubject && (
                  <motion.div key="addSubjectDiv" layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-3 flex-shrink-0" >
                    <AnimatedInlineInput
                      value={newSubjectName}
                      onChange={(e) => { setNewSubjectName(e.target.value); setError({ scope: null, message: "" }); }}
                      onSave={handleAddSubject}
                      onCancel={() => { setIsAddingSubject(false); setNewSubjectName(""); setError({ scope: null, message: "" }); }}
                      placeholder="New Subject Name"
                      inputRef={addSubjectInputRef}
                      isSaving={isSaving}
                      error={error.scope === "subject-add"}
                      bgColor="bg-purple-50"
                      borderColor="border-purple-200"
                    />
                    {error.scope === "subject-add" && <p className="text-xs text-red-600 mt-1 pl-1">{error.message}</p>}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Subject List */}
              <div className="flex-grow overflow-y-auto space-y-2.5 pr-1 -mr-1 py-1"> {/* Scrollable Area */}
                {isLoadingSubjects ? (
                  <SubjectListSkeleton />
                ) : subjects.length === 0 && !isAddingSubject ? (
                  <div className="text-center py-10 text-sm text-slate-500 italic">
                    No subjects added yet for this class.
                  </div>
                ) : (
                  <AnimatePresence>
                    {subjects.map((subject) => (
                      <motion.li
                        key={subject._id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2, ease: "easeOut" }}
                        className="list-none bg-white border border-slate-200/90 rounded-lg overflow-hidden shadow-sm hover:shadow-md hover:border-slate-300 focus-within:shadow-md focus-within:border-slate-300 transition-all duration-200"
                      >
                        {editingSubject?._id === subject._id ? (
                          <div className="p-2.5">
                            <AnimatedInlineInput
                              value={editingSubjectName}
                              onChange={(e) => { setEditingSubjectName(e.target.value); setError({ scope: null, message: "" }); }}
                              onSave={handleUpdateSubject}
                              onCancel={handleCancelEditSubject}
                              placeholder="Edit subject name"
                              inputRef={editSubjectInputRef}
                              isSaving={isSaving}
                              error={error.scope === `subject-edit-${subject._id}`}
                              bgColor="bg-yellow-50"
                              borderColor="border-yellow-300"
                            />
                            {error.scope === `subject-edit-${subject._id}` && <p className="text-xs text-red-600 pt-1 px-1">{error.message}</p>}
                          </div>
                        ) : (
                          <div className="flex justify-between items-center group p-3">
                            <span className="text-slate-800 text-sm font-medium">{subject.name}</span>
                            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150">
                              <button onClick={() => handleShowEditSubject(subject)} disabled={isSaving} className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-50 rounded hover:bg-blue-100/50 transition" title="Edit Subject" > <FiEdit2 size={14} /> </button>
                              <button onClick={() => confirmDeleteSubject(subject)} disabled={isSaving} className="p-1 text-slate-400 hover:text-red-600 disabled:opacity-50 rounded hover:bg-red-100/50 transition" title="Delete Subject" > <FiTrash2 size={14} /> </button>
                            </div>
                          </div>
                        )}
                        {/* Links Section */}
                        <div className="bg-slate-50/70 px-3 py-2 border-t border-slate-200/80 flex items-center justify-end gap-4">
                          <Link to={`/teacher/TeacherUploadSyllabus?classId=${selectedClassId}&subjectId=${subject._id}`} className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1 transition" >
                            <FiBook size={13} /> Syllabus
                          </Link>
                          <Link to={`/teacher/TeacherUploadMaterials?classId=${selectedClassId}&subjectId=${subject._id}`} className="text-xs font-medium text-purple-600 hover:text-purple-800 hover:underline inline-flex items-center gap-1 transition" >
                            <FiFileText size={13} /> Materials
                          </Link>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </>
          )}
        </motion.div>
      </div> {/* End Main Content Area */}

      {/* Modals (Keep as is) */}
       <ConfirmationModal
        isOpen={!!subjectToDelete}
        onClose={() => setSubjectToDelete(null)}
        onConfirm={executeDeleteSubject}
        title="Delete Subject?"
        message={`Are you sure you want to delete the subject "${subjectToDelete?.name}"?\nAssociated materials and syllabus might be affected.`} // Slightly updated message
        confirmText="Delete Subject"
        confirmColor="red"
        isProcessing={isSaving}
      />
      <ConfirmationModal
        isOpen={!!classToDelete}
        onClose={() => setClassToDelete(null)}
        onConfirm={executeDeleteClass}
        title="Delete Class?"
        message={`Are you sure you want to delete the class "${classToDelete?.name}"?\nAll subjects and student enrollments within it will be removed.\nThis action cannot be undone.`} // Updated message
        confirmText="Delete Class"
        confirmColor="red"
        isProcessing={isSaving}
      />

    </div> // End Page Container
  );
};

export default TeacherViewSubjects;