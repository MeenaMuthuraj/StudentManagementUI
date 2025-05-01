import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FiUser, FiPlusCircle, FiTrash2, FiCheckSquare, FiSquare, FiAlertCircle, FiLoader, FiBookOpen,FiPaperclip, FiUsers, FiInbox } from 'react-icons/fi';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'; // Import Recharts components
import { motion, AnimatePresence } from 'framer-motion';

// --- Sticky Note Hook (using localStorage) ---
function useStickyNotes(storageKey = 'teacherStickyNotes') {
    const [notes, setNotes] = useState(() => {
        try {
            const savedNotes = localStorage.getItem(storageKey);
            return savedNotes ? JSON.parse(savedNotes) : [];
        } catch (error) {
            console.error("Failed to load sticky notes from localStorage", error);
            return [];
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(storageKey, JSON.stringify(notes));
        } catch (error) {
             console.error("Failed to save sticky notes to localStorage", error);
        }
    }, [notes, storageKey]);

    const addNote = (text) => {
        if (text.trim()) {
            const newNote = { id: Date.now(), text: text.trim(), completed: false };
            setNotes(prevNotes => [newNote, ...prevNotes]); // Add to beginning
        }
    };

    const deleteNote = (id) => {
        setNotes(prevNotes => prevNotes.filter(note => note.id !== id));
    };

    const toggleNoteCompletion = (id) => {
        setNotes(prevNotes =>
            prevNotes.map(note =>
                note.id === id ? { ...note, completed: !note.completed } : note
            )
        );
    };

    return { notes, addNote, deleteNote, toggleNoteCompletion };
}

// --- Component ---
function TeacherDashboard() {
    const navigate = useNavigate();
    const [profileName, setProfileName] = useState('Teacher');
    const [classData, setClassData] = useState([]); // Holds {name, studentCount} for charts
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [newNoteText, setNewNoteText] = useState('');

    // --- Use the Sticky Notes Hook ---
    const { notes, addNote, deleteNote, toggleNoteCompletion } = useStickyNotes();

    // --- Data Fetching (Simplified for now) ---
    const fetchDashboardData = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const [profileResponse, classesResponse] = await Promise.all([
                api.get('/teacher/profile'),
                api.get('/teacher/classes')
            ]);

            const fetchedProfile = profileResponse.data;
            setProfileName(fetchedProfile?.profile?.fullName || fetchedProfile?.username || 'Teacher');

            const fetchedClasses = classesResponse.data || [];
            // Prepare data for charts
            const chartReadyData = fetchedClasses.map(cls => ({
                name: cls.name,
                studentCount: cls.students?.length ?? 0,
                subjectCount: cls.subjects?.length ?? 0
            }));
            setClassData(chartReadyData);

        } catch (err) {
            console.error("Error fetching dashboard data:", err);
            setError(err.response?.data?.message || 'Failed to load dashboard data.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    // --- Chart Data & Config ---
    // Colors for Pie Chart slices
    const PIE_COLORS = ['#6366F1', '#EC4899', '#22D3EE', '#FACC15', '#34D399', '#A78BFA'];
    // Example data transformation for Pie Chart (student distribution)
    const pieChartData = classData.map((cls, index) => ({
        name: cls.name,
        value: cls.studentCount,
        fill: PIE_COLORS[index % PIE_COLORS.length] // Cycle through colors
    })).filter(item => item.value > 0); // Remove classes with 0 students for cleaner chart

    // Bar Chart data (already prepared in classData as {name, studentCount, subjectCount})

     // --- Sticky Note Handlers ---
     const handleAddNote = (e) => {
        e.preventDefault(); // Prevent form submission if wrapped in form
        addNote(newNoteText);
        setNewNoteText(''); // Clear input
    };

    // --- Render Logic ---
    return (
        <div className="p-4 md:p-6 space-y-6 bg-gradient-to-br from-indigo-50 via-purple-50 to-white min-h-screen">

             {/* 1. Welcome Header - Redesigned */}
            <motion.div
                 initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}
                 className="flex items-center space-x-4 p-5 bg-white rounded-xl shadow-md border border-gray-200/80"
            >
                 <div className="p-2.5 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-lg">
                    <FiUser size={20}/>
                 </div>
                 <div>
                     <h1 className="text-lg font-semibold text-gray-800">Welcome back, <span className="font-bold">{profileName}!</span></h1>
                     <p className="text-sm text-gray-500">Let's check your dashboard overview.</p>
                 </div>
             </motion.div>

              {/* Error Display */}
              <AnimatePresence>
                 {error && (
                    <motion.div initial={{ opacity: 0}} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded text-sm flex items-center justify-between">
                        <span><FiAlertCircle className="inline mr-2"/>{error}</span>
                         <button onClick={() => setError('')}>×</button>
                    </motion.div>
                 )}
              </AnimatePresence>


            {/* 2. Charts Section */}
             <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Charts - Span 3 cols */}
                <div className="lg:col-span-3 grid grid-cols-1 gap-6">
                     {/* Pie Chart Card */}
                     <div className="bg-white p-5 rounded-xl shadow-md border border-gray-200/80 min-h-[300px]">
                         <h2 className="text-md font-semibold text-gray-700 mb-4 flex items-center gap-2"><FiUsers size={18}/>Student Distribution</h2>
                         {isLoading ? ( <div className="flex justify-center items-center h-48"><FiLoader className="animate-spin text-2xl text-indigo-400"/></div> )
                          : pieChartData.length === 0 ? ( <div className="flex flex-col items-center justify-center h-48 text-center text-gray-500"><FiInbox size={30} className="mb-2 text-gray-300"/><p className="text-sm">No student data to display.</p></div> )
                         : (
                             <ResponsiveContainer width="100%" height={250}>
                                 <PieChart>
                                     <Pie data={pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%` } >
                                         {pieChartData.map((entry, index) => ( <Cell key={`cell-${index}`} fill={entry.fill}/> ))}
                                     </Pie>
                                     <Tooltip formatter={(value, name) => [`${value} students`, name]}/>
                                 </PieChart>
                             </ResponsiveContainer>
                         )}
                     </div>

                    {/* Bar Chart Card */}
                    <div className="bg-white p-5 rounded-xl shadow-md border border-gray-200/80 min-h-[300px]">
                         <h2 className="text-md font-semibold text-gray-700 mb-4 flex items-center gap-2"><FiBookOpen size={18}/> Subjects per Class</h2>
                         {isLoading ? ( <div className="flex justify-center items-center h-48"><FiLoader className="animate-spin text-2xl text-indigo-400"/></div> )
                          : classData.length === 0 ? ( <div className="flex flex-col items-center justify-center h-48 text-center text-gray-500"><FiInbox size={30} className="mb-2 text-gray-300"/><p className="text-sm">No class data available.</p></div> )
                         : (
                              <ResponsiveContainer width="100%" height={250}>
                                 <BarChart data={classData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}> {/* Adjust margins */}
                                     <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0"/>
                                     <XAxis dataKey="name" fontSize={11} />
                                     <YAxis allowDecimals={false} fontSize={11} />
                                     <Tooltip/>
                                      {/* <Legend verticalAlign="top" height={36}/> Consider if needed */}
                                     <Bar dataKey="subjectCount" name="Subjects" fill="#8B5CF6" barSize={30}/>
                                     {/* You could add studentCount bar here too */}
                                     {/* <Bar dataKey="studentCount" name="Students" fill="#3B82F6" /> */}
                                  </BarChart>
                             </ResponsiveContainer>
                         )}
                    </div>
                 </div>

                 {/* 3. Sticky Notes - Span 2 cols */}
                <div className="lg:col-span-2 bg-gradient-to-br from-yellow-50 via-amber-50 to-yellow-100 p-5 rounded-xl shadow-md border border-yellow-200/80 min-h-[400px] flex flex-col">
                    <h2 className="text-md font-semibold text-yellow-900/80 mb-4 flex items-center gap-2">
                        <FiPaperclip size={18}/> My Sticky Notes
                    </h2>
                     {/* Note Input Form */}
                    <form onSubmit={handleAddNote} className="flex items-center gap-2 mb-4">
                         <input
                            type="text"
                            value={newNoteText}
                            onChange={(e) => setNewNoteText(e.target.value)}
                            placeholder="Add a quick note..."
                            className="flex-grow px-3 py-1.5 border border-yellow-300 rounded-lg text-sm focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none placeholder-gray-400 shadow-sm bg-white/70"
                        />
                         <button
                            type="submit"
                            disabled={!newNoteText.trim()}
                            className="p-2 bg-yellow-400 text-yellow-900 rounded-lg hover:bg-yellow-500 transition disabled:opacity-50 shadow"
                            title="Add Note"
                        >
                            <FiPlusCircle size={18}/>
                        </button>
                     </form>

                     {/* Notes List */}
                    <div className="flex-grow space-y-2 overflow-y-auto max-h-[calc(100vh-300px)] custom-scrollbar pr-1 -mr-1">
                        <AnimatePresence>
                             {notes.length === 0 ? (
                                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-xs text-gray-500 pt-10 italic">No notes yet. Add one above!</motion.div>
                              ) : (
                                notes.map(note => (
                                    <motion.div
                                        key={note.id}
                                        layout initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 10 }} transition={{duration: 0.2}}
                                        className={`flex items-center justify-between gap-2 p-2.5 rounded-md shadow-sm transition-colors ${ note.completed ? 'bg-green-100 border border-green-200 opacity-70' : 'bg-yellow-100 border border-yellow-200'}`}
                                    >
                                         <div className="flex items-center gap-2 flex-grow min-w-0">
                                              <button onClick={() => toggleNoteCompletion(note.id)} className={`flex-shrink-0 text-lg ${note.completed ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'}`}>
                                                   {note.completed ? <FiCheckSquare /> : <FiSquare />}
                                              </button>
                                              <p className={`text-sm text-gray-800 break-words min-w-0 ${note.completed ? 'line-through text-gray-500' : ''}`}>
                                                {note.text}
                                              </p>
                                         </div>
                                         <button onClick={() => deleteNote(note.id)} className="p-1 text-gray-400 hover:text-red-600 flex-shrink-0" title="Delete Note">
                                              <FiTrash2 size={14}/>
                                          </button>
                                     </motion.div>
                                 ))
                             )}
                        </AnimatePresence>
                     </div>
                 </div>
             </div>

        </div>
    );
}

export default TeacherDashboard;