// src/studentSide/StudentDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useProfile } from '../context/ProfileContext'; // Using your existing student profile context

import {
    FiUserCheck, FiAward, FiAlertCircle, FiBookOpen, FiPlayCircle, FiTrendingUp, FiList, FiCalendar, FiClock,
    FiLoader, FiInbox, FiPieChart, FiBarChart2, FiChevronRight, FiCheck, FiZap, FiGrid  // Keep relevant icons
} from 'react-icons/fi';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend as RechartsLegend, Cell, PieChart, Pie } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

// --- Helper: Date Formatting ---
const formatDate = (dateString, options = { month: 'short', day: 'numeric', year: 'numeric' }) => {
    if (!dateString) return "N/A";
    try { return new Date(dateString).toLocaleDateString('en-US', options); }
    catch (e) { console.warn("Date formatting error:", e); return "Invalid Date"; }
};

// --- Reusable KPI Card ---
const KpiCard = React.memo(({ title, value, icon: Icon, iconBgColor, textColor, unit = '', isLoading, linkTo }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="bg-white p-4 sm:p-5 rounded-xl shadow-lg border border-gray-200/60 flex flex-col justify-between hover:shadow-xl transition-shadow duration-200 min-h-[110px]"
    >
        <div className="flex items-start justify-between">
            <p className={`text-xs font-semibold ${textColor || 'text-gray-600'} uppercase tracking-wider`}>{title}</p>
            <div className={`p-2.5 rounded-lg ${iconBgColor || 'bg-indigo-100'} flex-shrink-0 shadow-sm`}>
                <Icon size={18} className={`${textColor || 'text-indigo-600'}`} />
            </div>
        </div>
        {isLoading ? (
            <div className="h-7 w-16 sm:w-20 bg-gray-200 rounded animate-pulse mt-2 self-start"></div>
        ) : (
            <p className="text-2xl sm:text-3xl font-bold text-gray-800 mt-1 self-start">{value}{unit}</p>
        )}
        {linkTo && !isLoading && (
            <Link to={linkTo} className="text-[11px] sm:text-xs text-indigo-600 hover:underline mt-auto self-end pt-1 font-medium">
                View Details <FiChevronRight className="inline -mb-px"/>
            </Link>
        )}
    </motion.div>
));

// --- Main Dashboard Component ---
function StudentDashboard() {
    const navigate = useNavigate();
    const { userProfile, isLoadingProfile: isLoadingContextProfile, isAuthenticated } = useProfile();

    const [summaryData, setSummaryData] = useState({
        studentInfo: { firstName: '', username: '' },
        kpis: { overallAttendancePercentage: 0, presentAndLateDays: 0, absentDays: 0, totalRecordedAttendanceDays: 0, averageQuizScore: 0, unattemptedQuizzesCount: 0, subjectsEnrolledCount: 0 },
        upcomingQuizzes: [],
        recentGrades: [],
        subjectsForAccess: [],
    });
    const [isLoadingSummary, setIsLoadingSummary] = useState(true);
    const [error, setError] = useState('');

    // Fetch Dashboard Summary Data
    const fetchDashboardSummary = useCallback(async () => {
        if (!isAuthenticated) { setIsLoadingSummary(false); return; }
        setIsLoadingSummary(true); setError('');
        try {
            const response = await api.get('/student/dashboard-summary');
            setSummaryData(prev => ({
                ...prev,
                studentInfo: response.data?.studentInfo || prev.studentInfo,
                kpis: { ...prev.kpis, ...(response.data?.kpis || {}) },
                upcomingQuizzes: response.data?.upcomingQuizzes || [],
                recentGrades: response.data?.recentGrades || [],
                subjectsForAccess: response.data?.subjectsForAccess || [],
            }));
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load dashboard data.');
        } finally {
            setIsLoadingSummary(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated) { fetchDashboardSummary(); }
        else { setIsLoadingSummary(false); setSummaryData({ studentInfo:{}, kpis: {}, upcomingQuizzes: [], recentGrades: [], subjectsForAccess: [] });}
    }, [isAuthenticated, fetchDashboardSummary]);

    const studentDisplayName = summaryData.studentInfo?.firstName || summaryData.studentInfo?.username || userProfile?.profile?.firstName || userProfile?.username || 'Student';
    const barColors = ["#818CF8", "#A78BFA", "#F472B6", "#34D399", "#FBBF24"];
    const overallIsLoading = isLoadingContextProfile || isLoadingSummary;

    const attendancePieData = summaryData.kpis?.totalRecordedAttendanceDays > 0 ? [
        { name: 'Present/Late', value: summaryData.kpis.presentAndLateDays || 0, fill: '#34D399' },
        { name: 'Absent', value: summaryData.kpis.absentDays || 0, fill: '#EF4444' },
    ].filter(item => item.value > 0) : [];

    if (overallIsLoading && !userProfile && !Object.keys(summaryData.kpis).some(k => summaryData.kpis[k] !== 0 && summaryData.kpis[k] !== undefined )) {
        return ( <div className="min-h-screen flex justify-center items-center bg-slate-100"><FiLoader className="animate-spin text-5xl text-indigo-500" /></div> );
    }

    return (
        <div className="p-4 md:p-6 space-y-8 bg-gray-100 min-h-screen font-sans">
            {/* Welcome Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="pb-4 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                    Hey, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">{studentDisplayName}!</span>
                </h1>
                <p className="text-sm text-gray-500 mt-1.5">Welcome to your learning dashboard.</p>
            </motion.div>

            {/* Error Display */}
            <AnimatePresence>{error && (  <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="p-3 mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 text-sm rounded flex items-center justify-between shadow-md"><span className='flex items-center'><FiAlertCircle className="mr-2 flex-shrink-0"/>{error}</span><button onClick={() => {setError(''); fetchDashboardSummary();}} className='font-medium text-xs p-1 hover:bg-red-200 rounded'>Retry</button></motion.div> )}</AnimatePresence>

            {/* KPI Section */}
            {overallIsLoading && !summaryData.kpis.overallAttendancePercentage ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5"> {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-white rounded-xl shadow-lg border border-gray-200/60 animate-pulse"></div>)} </div>
            ) : (
                <motion.div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5" variants={{ show: { transition: { staggerChildren: 0.07 } } }} initial="hidden" animate="show" >
                    <KpiCard title="Attendance" value={summaryData.kpis.overallAttendancePercentage} unit="%" icon={FiUserCheck} iconBgColor="bg-green-100" textColor="text-green-600" isLoading={isLoadingSummary} linkTo="/student/StudentAttendance" />
                    <KpiCard title="Avg. Quiz Score" value={summaryData.kpis.averageQuizScore} unit="%" icon={FiAward} iconBgColor="bg-yellow-100" textColor="text-yellow-600" isLoading={isLoadingSummary} linkTo="/student/StudentGrades"/>
                    <KpiCard title="Pending Quizzes" value={summaryData.kpis.unattemptedQuizzesCount} icon={FiAlertCircle} iconBgColor="bg-red-100" textColor="text-red-600" isLoading={isLoadingSummary} linkTo="/student/quizzes"/>
                    <KpiCard title="My Subjects" value={summaryData.kpis.subjectsEnrolledCount} icon={FiBookOpen} iconBgColor="bg-purple-100" textColor="text-purple-600" isLoading={isLoadingSummary} linkTo="/student/StudentSubjects"/>
                </motion.div>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start mt-6">

                {/* Left Column: Upcoming Quizzes & Quick Subject Access */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Upcoming Quizzes - This is the "To Do" section */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration:0.4 }} className="bg-white p-5 rounded-xl shadow-xl border border-gray-200/70 space-y-4 min-h-[280px] flex flex-col">
                        <div className="flex justify-between items-center border-b border-gray-200/80 pb-3 mb-3">
                            <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2.5"><FiList className="text-indigo-500"/>To Do: Quizzes</h2>
                            <Link to="/student/quizzes" className="text-xs font-medium text-indigo-600 hover:underline hover:text-indigo-800 transition-colors">View All Available</Link>
                        </div>
                        {isLoadingSummary && summaryData.upcomingQuizzes.length === 0 ? (
                            <div className="flex-grow space-y-3"> {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse"></div>)}</div>
                        ) : !isLoadingSummary && summaryData.upcomingQuizzes?.length > 0 ? (
                            <ul className="flex-grow space-y-3 max-h-72 overflow-y-auto custom-scrollbar pr-1 -mr-1">
                                {summaryData.upcomingQuizzes.map(quiz => (
                                    <li key={quiz._id} className="p-3 bg-gradient-to-r from-indigo-50/70 via-purple-50/60 to-pink-50/50 rounded-lg border border-indigo-100/90 shadow-sm hover:shadow-md transition-all group duration-200">
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                            <div className="flex-grow min-w-0">
                                                <h4 className="text-sm font-semibold text-indigo-800 group-hover:text-indigo-600 truncate" title={quiz.title}>{quiz.title}</h4>
                                                <p className="text-xs text-gray-500 mt-0.5">{quiz.classId?.name} - {quiz.subjectName}</p>
                                            </div>
                                            <div className="flex-shrink-0 flex items-center gap-2 mt-2 sm:mt-0 self-start sm:self-center"> {/* Aligned actions */}
                                                {quiz.dueDate && <p className="text-[11px] text-orange-700 font-medium flex items-center gap-1"><FiCalendar size={12}/> Due: {formatDate(quiz.dueDate, {month:'short', day:'numeric'})}</p>}
                                                <button onClick={() => navigate(`/student/take-quiz/${quiz._id}`)} className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-[11px] font-semibold rounded-md shadow hover:bg-indigo-700 transition transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-400">
                                                    <FiPlayCircle size={13}/> Start Quiz
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="flex-grow flex flex-col items-center justify-center text-center text-gray-500 py-10">
                                <FiCheck className="text-green-400 text-4xl mb-2"/>
                                <p className="text-sm">No pending quizzes for you. Great work!</p>
                            </div>
                        )}
                    </motion.div>

                    {/* Quick Subject Access */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration:0.4 }} className="bg-white p-5 rounded-xl shadow-xl border border-gray-200/70 min-h-[200px] flex flex-col">
                        <div className="flex justify-between items-center border-b border-gray-200/80 pb-3 mb-4">
                            <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2.5"><FiGrid className="text-purple-500"/>Quick Subject Access</h2>
                            <Link to="/student/StudentSubjects" className="text-xs font-medium text-indigo-600 hover:underline">All Subjects</Link>
                        </div>
                        {isLoadingSummary && summaryData.subjectsForAccess.length === 0 ? (
                             <div className="flex-grow grid grid-cols-2 sm:grid-cols-3 gap-2.5"> {[...Array(3)].map((_,i) => <div key={i} className="h-10 bg-gray-100 rounded-md animate-pulse"></div>)} </div>
                        ) : !isLoadingSummary && summaryData.subjectsForAccess?.length > 0 ? (
                            <ul className="flex-grow grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                {summaryData.subjectsForAccess.map(subjectName => (
                                    <li key={subjectName}>
                                        <Link to={`/student/StudentSubjects#${encodeURIComponent(subjectName)}`}
                                            className="block text-center text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200/80 rounded-lg p-3 transition-all duration-150 hover:shadow-md truncate transform hover:scale-[1.02]"
                                            title={subjectName}
                                        >
                                            {subjectName}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="flex-grow flex flex-col items-center justify-center text-center text-gray-500 py-10"><FiBookOpen size={36} className="mb-3 text-gray-300"/> <p className="text-sm">No subjects to display yet.</p></div>
                        )}
                    </motion.div>
                </div>


                {/* Right Column: Attendance & Recent Performance */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Attendance Snapshot */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration:0.4 }} className="bg-white p-5 rounded-xl shadow-xl border border-gray-200/70 min-h-[300px] flex flex-col">
                        <div className="flex justify-between items-center border-b border-gray-200/80 pb-3 mb-4">
                            <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2.5"><FiPieChart className="text-emerald-500"/>Attendance</h2>
                            <Link to="/student/StudentAttendance" className="text-xs font-medium text-indigo-600 hover:underline">Full Report</Link>
                        </div>
                        {isLoadingSummary && attendancePieData.length === 0 ? (
                             <div className="flex-grow h-48 flex justify-center items-center bg-gray-100 rounded-lg animate-pulse"><FiLoader className="animate-spin text-2xl text-gray-400"/></div>
                        ) : !isLoadingSummary && attendancePieData.length > 0 ? (
                            <div className='flex-grow h-48'>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={attendancePieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} innerRadius={35} labelLine={false} label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                                            {attendancePieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill}/>))}
                                        </Pie>
                                        <Tooltip formatter={(value, name) => [`${value} days`, name.replace('/', ' / ')]} contentStyle={{fontSize: '11px', padding: '5px 8px', borderRadius: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'}}/>
                                        <RechartsLegend iconType="circle" layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: "10px", paddingTop: "10px" }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="flex-grow flex flex-col items-center justify-center text-center text-gray-500 py-10"><FiInbox size={36} className="mb-3 text-gray-300"/> <p className="text-sm">No attendance data recorded yet.</p></div>
                        )}
                    </motion.div>

                    {/* Recent Performance */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration:0.4 }} className="bg-white p-5 rounded-xl shadow-xl border border-gray-200/70 space-y-4 min-h-[300px] flex flex-col">
                        <div className="flex justify-between items-center border-b border-gray-200/80 pb-3 mb-4">
                            <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2.5"><FiZap className="text-yellow-500"/>Recent Performance</h2>
                            <Link to="/student/StudentGrades" className="text-xs font-medium text-indigo-600 hover:underline">All Grades</Link>
                        </div>
                         {isLoadingSummary && summaryData.recentGrades.length === 0 ? ( <div className="flex-grow h-60 bg-gray-100 rounded-lg animate-pulse"></div> )
                         : !isLoadingSummary && summaryData.recentGrades?.length > 0 ? (
                            <div className='flex-grow h-60'>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={summaryData.recentGrades} layout="vertical" margin={{ top: 0, right: 15, left: 30, bottom: 0 }}> {/* Adjusted margins */}
                                        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" horizontal={false}/>
                                        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9 }} allowDecimals={false}><label value="Percentage" offset={0} position="insideBottom" dy={10} style={{fontSize: '9px', fill: '#6b7280'}}/></XAxis>
                                        <YAxis type="category" dataKey="quizTitle" tick={{ fontSize: 8, width: 75, dy:-2 }} width={80} interval={0} /> {/* Adjusted YAxis ticks and width */}
                                        <Tooltip formatter={(value) => [`${value}%`, "Score"]} labelFormatter={(label) => `Quiz: ${label}`} cursor={{ fill: 'rgba(230, 230, 250, 0.5)'}} contentStyle={{fontSize: '11px', padding: '5px 8px', borderRadius: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'}}/>
                                        <Bar dataKey="percentage" name="Score" barSize={12} radius={[0, 3, 3, 0]}>
                                            {summaryData.recentGrades.map((entry, index) => ( <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]}/> ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                         )
                         : ( <div className="flex-grow flex flex-col items-center justify-center text-center text-gray-500 py-10"><FiAward size={36} className="mb-3 text-gray-300"/> <p className="text-sm">No recent grades to display.</p></div> )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

export default StudentDashboard;