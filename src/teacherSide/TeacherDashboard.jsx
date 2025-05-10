// src/teacherSide/TeacherDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useTeacherProfile } from '../context/TeacherProfileContext';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format, startOfDay } from 'date-fns';
import {
    FiGrid, FiPlayCircle, FiEdit, FiCalendar, FiList,
    FiLoader, FiAlertCircle, FiPaperclip, FiPlusCircle, FiTrash2, FiCheckSquare, FiSquare, FiChevronDown, FiInbox,
    FiArchive
} from 'react-icons/fi'; // Removed unused: FiUsers, FiFileText, FiBarChart2, FiPieChart, FiTrendingUp
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
/*
  For custom-scrollbar styling, add this to your global CSS file (e.g., index.css or App.css):
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent; // or a very light grey like #f1f1f1
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #cbd5e1; // Tailwind's slate-300
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #94a3b8; // Tailwind's slate-400
  }
  .custom-scrollbar {
    scrollbar-width: thin; // For Firefox
    scrollbar-color: #cbd5e1 transparent; // For Firefox (thumb, track)
  }
*/

function useStickyNotes(storageKey = 'teacherDashboardStickyNotes_v2') {
    const [notes, setNotes] = useState(() => {
        try { const saved = localStorage.getItem(storageKey); return saved ? JSON.parse(saved) : []; }
        catch (e) { console.error("Failed to load sticky notes", e); return []; }
    });
    useEffect(() => { localStorage.setItem(storageKey, JSON.stringify(notes)); }, [notes, storageKey]);
    const addNote = (text) => { if (text.trim()) setNotes(prev => [{ id: Date.now(), text: text.trim(), completed: false }, ...prev]); };
    const deleteNote = (id) => setNotes(prev => prev.filter(n => n.id !== id));
    const toggleNoteCompletion = (id) => setNotes(prev => prev.map(n => n.id === id ? { ...n, completed: !n.completed } : n));
    return { notes, addNote, deleteNote, toggleNoteCompletion };
}

const getStatusInfo = (status) => {
    switch (status) {
        case 'Draft': return { text: 'Draft', icon: FiEdit, iconColor: 'text-yellow-600', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', borderColor: 'border-yellow-300' };
        case 'Published': return { text: 'Published', icon: FiPlayCircle, iconColor: 'text-green-600', bgColor: 'bg-green-100', textColor: 'text-green-800', borderColor: 'border-green-300' };
        case 'Closed': return { text: 'Closed', icon: FiArchive, iconColor: 'text-gray-500', bgColor: 'bg-gray-100', textColor: 'text-gray-700', borderColor: 'border-gray-300' };
        default: return { text: status || 'Unknown', icon: FiAlertCircle, iconColor: 'text-gray-500', bgColor: 'bg-gray-100', textColor: 'text-gray-700', borderColor: 'border-gray-300' };
    }
};

const KpiCard = ({ title, value, icon: Icon, color, isLoading }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className={`p-5 bg-white rounded-xl shadow-lg border border-gray-200/80 flex items-center justify-between col-span-1`}
    >
        <div>
            <p className={`text-xs font-semibold ${color} uppercase tracking-wider`}>{title}</p>
            {isLoading ? (
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mt-1"></div>
            ) : (
                <p className="text-3xl font-bold text-gray-800 mt-1">{value ?? '0'}</p>
            )}
        </div>
        {/* Icon background made fully opaque for better color pop */}
        {/* === THIS IS THE MODIFIED SECTION === */}
        <div className={`p-3 rounded-full bg-${color.split('-')[1]}-100 dark:bg-${color.split('-')[1]}-200 shadow-sm`}>
            <Icon size={22} className={`${color}`} />
        </div>
        {/* === END OF MODIFIED SECTION === */}
    </motion.div>
);

const CustomDateInput = React.forwardRef(({ value, onClick, id }, ref) => (
    <button
        id={id}
        onClick={onClick}
        ref={ref}
        type="button"
        className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-left text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
    >
        {value}
        <FiCalendar className="ml-2 h-4 w-4 text-gray-400" />
    </button>
));
CustomDateInput.displayName = 'CustomDateInput';


function TeacherDashboard() {
    const navigate = useNavigate();
    const { teacherProfile } = useTeacherProfile();

    const [kpis, setKpis] = useState({ totalClasses: 0, activePublishedQuizzes: 0, draftQuizzes: 0 });
    const [isLoadingKpis, setIsLoadingKpis] = useState(true);

    const [teacherClasses, setTeacherClasses] = useState([]);
    const [selectedClassForAttendance, setSelectedClassForAttendance] = useState('');
    const [selectedDateForAttendance, setSelectedDateForAttendance] = useState(startOfDay(new Date()));
    const [attendanceData, setAttendanceData] = useState(null);
    const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);

    const [recentQuizzes, setRecentQuizzes] = useState([]);
    const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(true);

    const { notes, addNote, deleteNote, toggleNoteCompletion } = useStickyNotes();
    const [newNoteText, setNewNoteText] = useState('');
    const [error, setError] = useState('');

    const fetchInitialData = useCallback(async () => {
        setIsLoadingKpis(true);
        setIsLoadingQuizzes(true);
        setError('');
        try {
            const [kpiResponse, classesResponse, quizzesResponse] = await Promise.all([
                api.get('/teacher/dashboard/kpis'),
                api.get('/teacher/classes'),
                api.get('/teacher/quizzes?sort=-updatedAt&limit=5')
            ]);
            setKpis(kpiResponse.data || { totalClasses: 0, activePublishedQuizzes: 0, draftQuizzes: 0 });
            setTeacherClasses(classesResponse.data || []);
            setRecentQuizzes(quizzesResponse.data || []);
        } catch (err) {
            console.error("Error fetching initial dashboard data:", err);
            setError(err.response?.data?.message || 'Failed to load dashboard data.');
        } finally {
            setIsLoadingKpis(false);
            setIsLoadingQuizzes(false);
        }
    }, []);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    const fetchAttendanceReport = useCallback(async () => {
        if (!selectedClassForAttendance || !selectedDateForAttendance) {
            setAttendanceData(null);
            return;
        }
        setIsLoadingAttendance(true);
        try {
            const formattedDate = format(selectedDateForAttendance, 'yyyy-MM-dd');
            const response = await api.get(`/teacher/attendance/reports/class/${selectedClassForAttendance}?date=${formattedDate}`);
            const records = response.data || [];
            let present = 0, absent = 0, late = 0;
            records.forEach(record => {
                if (record.status === 'present') present++;
                else if (record.status === 'absent') absent++;
                else if (record.status === 'late') late++;
            });
            setAttendanceData({ present, absent, late, total: records.length });
        } catch (err) {
            console.error("Error fetching attendance report:", err);
            setError(prevError => `${prevError ? prevError + ' ' : ''}Failed to load attendance. ${err.response?.data?.message || ''}`.trim());
            setAttendanceData(null);
        } finally {
            setIsLoadingAttendance(false);
        }
    }, [selectedClassForAttendance, selectedDateForAttendance]);

    useEffect(() => {
        if (selectedClassForAttendance && selectedDateForAttendance) {
             fetchAttendanceReport();
        }
    }, [fetchAttendanceReport, selectedClassForAttendance, selectedDateForAttendance]);

    const handleAddNote = (e) => { e.preventDefault(); addNote(newNoteText); setNewNoteText(''); };

    const attendanceChartData = attendanceData && attendanceData.total > 0 ? [
        { name: 'Present', value: attendanceData.present, fill: '#10B981' },
        { name: 'Absent', value: attendanceData.absent, fill: '#EF4444' },
        { name: 'Late', value: attendanceData.late, fill: '#F59E0B' },
    ].filter(item => item.value > 0) : [];

    const profileName = teacherProfile?.profile?.fullName || teacherProfile?.username || 'Teacher';

    return (
        <div className="p-4 md:p-6 space-y-6 bg-gradient-to-br from-indigo-50 via-purple-50 to-gray-100 min-h-screen font-sans">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="pb-4 mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                    Welcome back, <span className="text-indigo-600">{profileName}!</span>
                </h1>
                <p className="text-sm text-gray-500 mt-1">Here's your teaching dashboard overview.</p>
            </motion.div>

            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-md shadow-md" role="alert"
                    >
                        <div className="flex">
                            <div className="py-1"><FiAlertCircle className="h-6 w-6 text-red-500 mr-3" /></div>
                            <div>
                                <p className="font-bold">Error</p>
                                <p className="text-sm">{error}</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-6"
                variants={{ show: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="show"
            >
                <KpiCard title="Total Classes" value={kpis.totalClasses} icon={FiGrid} color="text-blue-500" isLoading={isLoadingKpis}/>
                <KpiCard title="Active Quizzes" value={kpis.activePublishedQuizzes} icon={FiPlayCircle} color="text-green-500" isLoading={isLoadingKpis}/>
                <KpiCard title="Draft Quizzes" value={kpis.draftQuizzes} icon={FiEdit} color="text-yellow-500" isLoading={isLoadingKpis}/>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-1 bg-white p-5 rounded-xl shadow-lg border border-gray-200/80 space-y-5"> {/* Increased space-y slightly */}
                    <h2 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2 flex items-center gap-2">
                        <FiCalendar className="text-blue-500 h-5 w-5"/> Daily Attendance Snapshot
                    </h2>
                    
                    {/* Class Selector: Improved Styling */}
                    <div className='space-y-1.5'>
                        <label htmlFor="classAttSelect" className="text-xs font-medium text-gray-600 uppercase">Class</label>
                        <div className="relative">
                            <select 
                                id="classAttSelect" 
                                value={selectedClassForAttendance} 
                                onChange={(e) => setSelectedClassForAttendance(e.target.value)} 
                                className="w-full px-3 py-2.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 pr-10" // Added pr-10 for icon space
                            >
                                <option value="">-- Select a Class --</option>
                                {teacherClasses.map(cls => (<option key={cls._id} value={cls._id}>{cls.name}</option>))}
                            </select>
                            <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Date Picker: Harmonized Styling */}
                    <div className='space-y-1.5'>
                        <label htmlFor="dateAttSelect" className="text-xs font-medium text-gray-600 uppercase me-2">Date</label>
                        <DatePicker
                            id="dateAttSelect"
                            selected={selectedDateForAttendance}
                            onChange={(date) => setSelectedDateForAttendance(startOfDay(date || new Date()))}
                            dateFormat="yyyy-MM-dd"
                            customInput={<CustomDateInput />}
                            maxDate={new Date()}
                            popperPlacement="bottom-start"
                        />
                    </div>

                    {/* Attendance Chart: Improved Empty State */}
                    <div className='h-60 relative pt-2'> {/* Added pt-2 for slight spacing from controls */}
                        {isLoadingAttendance ? (
                            <div className="absolute inset-0 flex justify-center items-center bg-white/60 rounded-md"><FiLoader className="animate-spin text-3xl text-indigo-500"/></div>
                        ) : attendanceData && attendanceData.total > 0 && attendanceChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={attendanceChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} labelLine={false} label={false}>
                                        {attendanceChartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill}/>))}
                                    </Pie>
                                    <Tooltip formatter={(value, name) => [`${value} students`, name]}/>
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}/>
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="absolute inset-0 flex flex-col justify-center items-center text-center text-gray-500 text-sm p-4">
                                 <FiInbox size={36} className="mb-3 opacity-50"/>
                                 {selectedClassForAttendance && selectedDateForAttendance ? 'No attendance data for this selection.' : 'Please select a class and date to view the report.'}
                            </div>
                        )}
                    </div>
                </motion.div>

                <div className="lg:col-span-2 space-y-6">
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="bg-white p-5 rounded-xl shadow-lg border border-gray-200/80">
                        <h2 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2 mb-4 flex items-center justify-between">
                            <span className='flex items-center gap-2'><FiList className="text-green-500 h-5 w-5"/>Latest Quizzes</span>
                            <Link to="/teacher/quizzes" className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline">View All</Link>
                        </h2>
                        {isLoadingQuizzes ? (
                            <div className="space-y-3">
                                {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded-md animate-pulse"></div>)}
                            </div>
                        ) : recentQuizzes.length === 0 ? (
                            <p className='text-sm text-gray-500 italic text-center py-4'>No quizzes created recently.</p>
                        ) : (
                            <ul className="space-y-2.5 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                                {recentQuizzes.map(quiz => {
                                    const statusInfo = getStatusInfo(quiz.status);
                                    return (
                                        <li key={quiz._id} className="flex items-center justify-between p-2.5 bg-gray-50/70 rounded-lg border border-gray-200/80 hover:bg-gray-100 transition-colors">
                                            <div className="flex-grow min-w-0 mr-2">
                                                <Link to={`/teacher/create-quiz?editId=${quiz._id}`} className="text-sm font-medium text-indigo-700 hover:underline truncate block" title={quiz.title}>{quiz.title}</Link>
                                                <p className="text-xs text-gray-500">{quiz.classId?.name || 'N/A'} - {quiz.subjectName || 'N/A'}</p>
                                            </div>
                                            <span className={`flex-shrink-0 flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full border ${statusInfo.bgColor} ${statusInfo.textColor} ${statusInfo.borderColor}`}>
                                                {statusInfo.icon && <statusInfo.icon className={`mr-1 h-3 w-3 ${statusInfo.iconColor}`} />}
                                                {statusInfo.text}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </motion.div>

                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="bg-gradient-to-br from-yellow-50 via-amber-50 to-yellow-100 p-5 rounded-xl shadow-lg border border-yellow-200/80 flex flex-col min-h-[300px]">
                        <h2 className="text-lg font-semibold text-yellow-800/90 border-b border-yellow-300/70 pb-2 mb-4 flex items-center gap-2">
                            <FiPaperclip className="text-yellow-700 h-5 w-5"/> Quick Notes
                        </h2>
                        <form onSubmit={handleAddNote} className="flex items-center gap-2 mb-3">
                            <input type="text" value={newNoteText} onChange={(e) => setNewNoteText(e.target.value)} placeholder="Add a new note..." className="flex-grow px-3 py-1.5 border border-amber-400 rounded-lg text-sm focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none shadow-sm bg-white placeholder-gray-500"/>
                            <button type="submit" disabled={!newNoteText.trim()} className="p-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition disabled:opacity-50 disabled:cursor-not-allowed shadow" title="Add Note"><FiPlusCircle size={18}/></button>
                        </form>
                        <div className="flex-grow space-y-2 overflow-y-auto max-h-60 custom-scrollbar pr-1 -mr-1">
                            <AnimatePresence>
                                {notes.length === 0 ? (<motion.p initial={{opacity:0}} animate={{opacity:1}} className="text-xs text-gray-500 pt-8 italic text-center">No notes yet. Start typing above!</motion.p>)
                                : (notes.map(note => (
                                    <motion.div key={note.id} layout initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 10 }} transition={{duration: 0.2}} className={`flex items-center justify-between gap-2 p-2.5 rounded-md shadow-sm transition-colors text-sm ${ note.completed ? 'bg-green-100/70 border border-green-200 opacity-75' : 'bg-yellow-50 border-yellow-200'}`}>
                                        <div className="flex items-center gap-2 flex-grow min-w-0">
                                            <button onClick={() => toggleNoteCompletion(note.id)} className={`flex-shrink-0 text-lg ${note.completed ? 'text-green-600 hover:text-green-700' : 'text-gray-400 hover:text-gray-600'}`}>{note.completed ? <FiCheckSquare /> : <FiSquare />}</button>
                                            <p className={`text-gray-800 break-words min-w-0 ${note.completed ? 'line-through text-gray-500' : ''}`}>{note.text}</p>
                                        </div>
                                        <button onClick={() => deleteNote(note.id)} className="p-1 text-gray-400 hover:text-red-600 flex-shrink-0" title="Delete Note"><FiTrash2 size={14}/></button>
                                    </motion.div>
                                )))}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

export default TeacherDashboard;