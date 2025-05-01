import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom"; // Added useLocation
import {
  FiPlus,
  // FiUserPlus, // Removed - No longer adding students here
  FiUsers,
  FiEdit2,
  FiTrash2,
  FiChevronRight,
  FiLoader,
  FiAlertTriangle,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api"; // Your Axios instance

// --- Skeleton Loader Components (Keep these as they are) ---
const SkeletonCard = () => (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 animate-pulse"> {/* ... Skeleton Structure ... */} </div>
);
const SkeletonTable = () => (
    <div className="overflow-x-auto"> <table className="min-w-full divide-y divide-gray-200 animate-pulse"> {/* ... Skeleton Structure ... */} </table> </div>
);
// ---------------------------------

const TeacherClasses = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Get location for state checking

  // --- State Variables (Keep all existing state) ---
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [formClassName, setFormClassName] = useState("");
  const [editingClass, setEditingClass] = useState(null);
  const [classToDelete, setClassToDelete] = useState(null);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [showClassModal, setShowClassModal] = useState(false);
  const [modalError, setModalError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- API Interaction Functions (Keep fetchClasses, fetchStudents) ---
  const fetchClasses = useCallback(
    async (selectClassId = null) => {
      setIsLoadingClasses(true);
      setGeneralError("");
      try {
        const response = await api.get("/teacher/classes");
        const fetchedClasses = response.data || [];
        setClasses(fetchedClasses.sort((a, b) => a.name.localeCompare(b.name)));

        // --- Auto-select logic ---
        const classIdFromState = location.state?.updatedClassId; // Read ID from state first
        const idToSelect = selectClassId || classIdFromState;
        let foundClassToSelect = null;

        if (idToSelect) {
            foundClassToSelect = fetchedClasses.find((c) => c._id === idToSelect);
            if (foundClassToSelect) {
                setSelectedClass(foundClassToSelect);
                if (classIdFromState) { // Clear state only if it was used for selection
                     // Use replaceState to clear without adding history entry
                     window.history.replaceState({}, document.title)
                     console.log("Navigation state cleared after using updatedClassId");
                 }
            } else {
                setSelectedClass(null); setStudents([]);
            }
        } else if (selectedClass && !fetchedClasses.some((c) => c._id === selectedClass._id)) {
            // Deselect if previously selected class no longer exists
            setSelectedClass(null); setStudents([]);
        }

      } catch (err) {
          console.error("Error fetching classes:", err);
          setGeneralError(err.response?.data?.message || "Failed to load classes.");
          setClasses([]); setSelectedClass(null); setStudents([]);
      } finally { setIsLoadingClasses(false); }
    },
    // Include location.state?.updatedClassId as dependency
     // Ensure this dependency doesn't cause infinite loops (clearing state should help)
     [location.state?.updatedClassId, selectedClass] // Keep selectedClass here maybe? Let's test without first
   );

  const fetchStudents = useCallback(async (classId) => {
        if (!classId) { setStudents([]); return; }
        setIsLoadingStudents(true); setStudents([]); setGeneralError("");
        try {
            const response = await api.get(`/teacher/classes/${classId}/students`);
            // Assuming backend returns necessary profile fields like fullName or firstName/lastName
            setStudents(response.data || []);
            console.log("Fetched students:", response.data);
         } catch (err) {
            console.error(`Error fetching students for class ${classId}:`, err);
            setGeneralError(err.response?.data?.message || `Failed to load students.`);
            setStudents([]);
         } finally { setIsLoadingStudents(false); }
     }, []); // Removed selectedClass dependency - classId is enough


   // Effects for fetching data (Keep these)
   useEffect(() => { fetchClasses(); }, [fetchClasses]);
   useEffect(() => { if (selectedClass?._id) { fetchStudents(selectedClass._id); } else { setStudents([]); } }, [selectedClass, fetchStudents]);

   // --- Modal/Form Handlers for CLASS Management (Keep these) ---
   const openAddModal = () => { /* ... keep logic ... */ setEditingClass(null); setFormClassName(""); setModalError(""); setShowClassModal(true); };
   const openEditModal = (cls) => { /* ... keep logic ... */ setEditingClass(cls); setFormClassName(cls.name); setModalError(""); setShowClassModal(true); };
   const closeModal = () => { /* ... keep logic ... */ setShowClassModal(false); setEditingClass(null); setFormClassName(""); setModalError(""); };
   const handleFormSubmit = async (event) => { /* ... keep logic for adding/editing CLASS NAME ... */
       event.preventDefault();
       const name = formClassName.trim();
       if (!name) { setModalError("Class name cannot be empty"); return; }
       // ... (rest of duplicate checks etc) ...

        setIsSubmitting(true); setModalError("");
        try {
            let response;
            if (editingClass) {
                 // Ensure API call is made for editing too
                 console.log("Calling API to update class:", editingClass._id, "to name:", name);
                 response = await api.put(`/teacher/classes/${editingClass._id}`, { name }); // USE API
             } else {
                 console.log("Calling API to add class with name:", name);
                 response = await api.post("/teacher/classes", { name });
             }
             closeModal();
             if (response.data?._id) { fetchClasses(response.data._id); } else { fetchClasses(); } // Refetch list
        } catch (err) {
             console.error("Error saving class:", err);
             setModalError(err.response?.data?.message || `Failed to ${editingClass ? 'update' : 'create'} class.`);
        } finally { setIsSubmitting(false); }
   };


   // --- Delete Handlers for CLASS and STUDENT (Keep these) ---
   const confirmDeleteClass = (cls) => { /* ... keep logic ... */ setClassToDelete(cls); };
   const executeDeleteClass = async () => { /* ... keep logic using api.delete ... */
         if (!classToDelete) return; setIsSubmitting(true); setGeneralError("");
         try {
             await api.delete(`/teacher/classes/${classToDelete._id}`);
             const deletedId = classToDelete._id; setClassToDelete(null);
             await fetchClasses(); // Use await if fetchClasses returns promise
             if (selectedClass?._id === deletedId) { setSelectedClass(null); setStudents([]); }
         } catch (err) { setGeneralError(err.response?.data?.message || "Failed to delete class."); setClassToDelete(null); }
         finally { setIsSubmitting(false); }
     };
   const confirmDeleteStudent = (student) => {
        // Adjust if needed, but basic storing for confirmation is okay
        // Need student._id and potentially profile.fullName from student object
        setStudentToDelete({ studentId: student._id, studentName: student.profile?.fullName || student.email });
   };
   const executeDeleteStudent = async () => { /* ... keep logic using api.delete ... */
         if (!studentToDelete || !selectedClass?._id) return; setIsSubmitting(true); setGeneralError("");
         try {
             await api.delete( `/teacher/classes/${selectedClass._id}/students/${studentToDelete.studentId}` );
             setStudentToDelete(null);
             await fetchStudents(selectedClass._id); // Refresh student list for current class
              // Optionally refetch classes to update counts, or handle count update differently
             await fetchClasses(selectedClass._id); // Pass current class ID to stay selected
          } catch (err) { setGeneralError(err.response?.data?.message || "Failed to remove student."); }
          finally { setIsSubmitting(false); }
    };

    // --- Navigation Handlers ---
    const handleSelectClass = (cls) => { /* ... keep logic ... */ setSelectedClass(cls); setGeneralError(""); };

    // --- *** REMOVED handleStudentAction function *** ---
    // const handleStudentAction = (...) => { ... };


  // --- Render Component ---
  return (
    <div className="p-6 md:p-8 bg-gray-50 min-h-screen">
      {/* General Error Display */}
      {generalError && ( /* ... Keep error display ... */
            <div className="mb-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow" role="alert"><div className="flex items-center"><FiAlertTriangle className="h-5 w-5 text-red-600 mr-3" /><div><p className="font-bold">Error</p><p>{generalError}</p></div><button onClick={() => setGeneralError("")} className="ml-auto pl-3 text-red-600 hover:text-red-800" aria-label="Close error">✕</button></div></div>
       )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div><h1 className="text-3xl font-bold text-gray-800">My Classes</h1><p className="text-gray-600 mt-1">Manage classes and view enrolled students.</p></div>
         {/* Keep Add CLASS button */}
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} onClick={openAddModal} className="mt-4 sm:mt-0 flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-lg shadow-md font-semibold transition-all" > <FiPlus size={18} /> Add New Class </motion.button>
      </div>

      {/* Classes Section */}
      <div className="mb-10">
         <h2 className="text-xl font-semibold text-gray-700 mb-4"> Class Overview </h2>
         {isLoadingClasses ? ( <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div> )
         : classes.length === 0 ? ( /* ... Keep Empty State ... */
                <div className="text-center py-16 px-6 bg-white rounded-2xl border border-gray-200 shadow-sm"> <FiUsers className="mx-auto h-12 w-12 text-indigo-300" /> <h3 className="mt-2 text-xl font-semibold text-gray-800"> No Classes Found </h3> <p className="mt-1 text-gray-500"> Get started by adding your first class. </p> <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={openAddModal} className="mt-6 inline-flex items-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" > <FiPlus className="-ml-1 mr-2 h-5 w-5" /> Add Class </motion.button> </div>
        ) : ( /* --- Display Class Cards (Keep Logic) --- */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((cls) => ( <motion.div key={cls._id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} whileHover={{ y: -4, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",}} className={`bg-white p-5 rounded-xl shadow-md border transition-all cursor-pointer ${ selectedClass?._id === cls._id ? "border-indigo-500 ring-2 ring-indigo-300" : "border-gray-200 hover:border-gray-300"}`} onClick={() => handleSelectClass(cls)} >
                  {/* Card Content (Keep logic) */}
                   <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-gray-800 truncate" title={cls.name}>{cls.name}</h3> {/* Consider adding student count: <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{cls.students?.length ?? 0} std</span> */} </div>
                   <p className="text-xs text-gray-400 mb-5">ID: {cls._id}</p>
                   <div className="flex justify-between items-center"> <button onClick={(e) => { e.stopPropagation(); handleSelectClass(cls); }} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1" > View Students <FiChevronRight size={16} /> </button>
                       <div className="flex gap-1"> <button onClick={(e) => { e.stopPropagation(); openEditModal(cls); }} className="text-gray-400 hover:text-blue-600 p-1.5 rounded-md hover:bg-blue-50 transition" title="Edit Class Name"> <FiEdit2 size={16} /> </button> <button onClick={(e) => { e.stopPropagation(); confirmDeleteClass(cls); }} className="text-gray-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 transition" title="Delete Class"> <FiTrash2 size={16} /> </button> </div>
                  </div>
             </motion.div> ))}
           </div>
         )}
       </div>

      {/* Students Section - Conditional Rendering */}
      <AnimatePresence>
        {selectedClass && (
          <motion.div key={selectedClass._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200" >
             {/* Header for Student Section - REMOVE Add Student Button */}
             <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                 <h2 className="text-lg font-semibold text-gray-800">Students in: <span className="text-indigo-600">{selectedClass.name}</span></h2>
                 {/* <<<--- REMOVED ADD STUDENT BUTTON --->>> */}
             </div>

            {isLoadingStudents ? ( <SkeletonTable /> )
            : students.length === 0 ? ( /* ... Keep Empty State ... */
                 <div className="text-center py-12 px-6"> <FiUsers className="mx-auto h-10 w-10 text-gray-400" /> <h3 className="mt-2 text-md font-semibold text-gray-700"> No Students Enrolled </h3> <p className="mt-1 text-sm text-gray-500"> Students will appear here once enrolled. </p> </div>
             ) : (
                 <div className="overflow-x-auto">
                     <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50"> {/* ... Table Headers ... */} <tr> <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"> Name </th> <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"> Email </th> <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"> Phone </th> <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"> Actions </th> </tr> </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {students.map((student) => (
                                <tr key={student._id} className="hover:bg-gray-50/80 transition duration-150 ease-in-out">
                                     {/* Name Column */}
                                      <td className="px-6 py-4 whitespace-nowrap"> <div className="text-sm font-semibold text-gray-900">{student.profile?.fullName || `${student.profile?.firstName || ''} ${student.profile?.lastName || ''}`.trim() || student.email || 'N/A'}</div> <div className="text-xs text-gray-500 mt-1">ID: {student._id}</div> </td>
                                      {/* Email Column */}
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{student.email || "-"}</td>
                                     {/* Phone Column */}
                                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{student.profile?.phone || "-"}</td>
                                      {/* Actions Column - UPDATED */}
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex gap-4">
                                           {/* View Profile Button */}
                                            <button onClick={() => navigate(`/teacher/students/${student._id}/profile`)} className="text-indigo-600 hover:text-indigo-800 font-semibold transition hover:underline" > View Profile </button>
                                            {/* Remove Student Button */}
                                            <button onClick={() => confirmDeleteStudent(student)} className="text-red-600 hover:text-red-800 font-semibold transition hover:underline" > Remove </button>
                                        </div>
                                      </td>
                                </tr>
                             ))}
                          </tbody>
                     </table>
                 </div>
             )}
           </motion.div>
         )}
       </AnimatePresence>

      {/* Modals (Keep these as they are for Class Edit/Delete and Student Remove) */}
      <AnimatePresence> {showClassModal && ( /* ... Add/Edit Class Modal JSX ... */ <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm"><motion.div key="classModal" initial={{ scale: 0.95, opacity: 0, y: -20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: -20 }} transition={{ duration: 0.2 }} className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg"> <h2 className="text-xl font-semibold text-gray-800 mb-4">{editingClass ? "Edit Class Name" : "Create New Class"}</h2><form onSubmit={handleFormSubmit}><label htmlFor="classNameInput" className="block text-sm font-medium text-gray-700 mb-1">Class Name</label><input id="classNameInput" type="text" value={formClassName} onChange={(e)=>{ setFormClassName(e.target.value); setModalError(""); }} placeholder="e.g., Grade 10 - Section A" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm" required autoFocus/>{modalError && ( <p className="mt-2 text-xs text-red-600">{modalError}</p>)}<div className="mt-6 flex justify-end gap-3"><motion.button type="button" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} onClick={closeModal} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500" disabled={isSubmitting}>Cancel</motion.button><motion.button type="submit" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50`} disabled={isSubmitting || !formClassName.trim()}>{isSubmitting && <FiLoader className="animate-spin mr-2 inline" />} {editingClass ? "Update Class" : "Create Class"}</motion.button></div></form></motion.div></div> )} </AnimatePresence>
       <AnimatePresence> {classToDelete && ( /* ... Delete Class Confirm Modal JSX ... */ <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm"><motion.div key="deleteClassConfirm" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.2 }} className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md text-center"><div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4"><FiAlertTriangle className="h-6 w-6 text-red-600" /></div><h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Class?</h3><p className="text-sm text-gray-500 mb-6">Are you sure you want to delete the class "{classToDelete.name}"? Associated student enrollments will be affected. This action cannot be undone.</p><div className="flex justify-center gap-4"><motion.button type="button" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setClassToDelete(null)} disabled={isSubmitting} className="px-5 py-2 text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">Cancel</motion.button><motion.button type="button" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={executeDeleteClass} disabled={isSubmitting} className="px-5 py-2 text-sm font-medium text-white bg-red-600 rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50">{isSubmitting && <FiLoader className="animate-spin mr-2 inline" />} Delete</motion.button></div></motion.div></div> )} </AnimatePresence>
       <AnimatePresence> {studentToDelete && ( /* ... Delete Student Confirm Modal JSX ... */ <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm"><motion.div key="deleteStudentConfirm" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.2 }} className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md text-center"><div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4"><FiAlertTriangle className="h-6 w-6 text-red-600" /></div><h3 className="text-lg font-semibold text-gray-900 mb-2">Remove Student?</h3><p className="text-sm text-gray-500 mb-6">Are you sure you want to remove "{studentToDelete.studentName || `Student ID: ${studentToDelete.studentId}`}" from "{selectedClass?.name}"?</p><div className="flex justify-center gap-4"><motion.button type="button" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setStudentToDelete(null)} disabled={isSubmitting} className="px-5 py-2 text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">Cancel</motion.button><motion.button type="button" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={executeDeleteStudent} disabled={isSubmitting} className="px-5 py-2 text-sm font-medium text-white bg-red-600 rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50">{isSubmitting && <FiLoader className="animate-spin mr-2 inline" />} Remove</motion.button></div></motion.div></div> )} </AnimatePresence>

    </div> // End Page Container
  );

};


export default TeacherClasses;