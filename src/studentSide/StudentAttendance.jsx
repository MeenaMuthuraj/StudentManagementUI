// src/studentSide/StudentAttendance.jsx
import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format, isSameDay, parseISO, startOfDay } from 'date-fns';
import {
    FiLoader, FiAlertCircle, FiCheckCircle, FiXCircle, FiClock, FiInfo,
    FiChevronLeft, FiChevronRight, FiCheckSquare, FiTrendingUp, FiUserCheck, FiActivity,FiCalendar
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

// Custom styles for react-calendar
const calendarCustomStyles = `
  .react-calendar {
    width: 100%;
    max-width: 100%;
    background: white;
    border: 1px solid #e5e7eb; /* Tailwind gray-200 */
    border-radius: 0.75rem; /* Tailwind rounded-xl */
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); /* Tailwind shadow-lg */
    font-family: inherit;
    line-height: 1.2em;
    padding: 0.5em;
  }
  .react-calendar button {
    margin: 0;
    border: 0;
    outline: none;
    transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;
  }
  .react-calendar button:enabled:hover {
    cursor: pointer;
  }
  .react-calendar__navigation {
    display: flex;
    height: 44px;
    margin-bottom: 0.5em;
    align-items: center;
  }
  .react-calendar__navigation button {
    min-width: 44px;
    background: none;
    font-size: 1.1em;
    font-weight: 600; /* Semi-bold */
    color: #4f46e5; /* Indigo-600 */
  }
  .react-calendar__navigation button:disabled {
    background-color: #f3f4f6; /* Gray-100 */
    color: #9ca3af; /* Gray-400 */
  }
  .react-calendar__navigation button:enabled:hover,
  .react-calendar__navigation button:enabled:focus {
    background-color: #e0e7ff; /* Indigo-100 */
    border-radius: 0.375rem;
  }
  .react-calendar__month-view__weekdays {
    text-align: center;
    text-transform: uppercase;
    font-weight: 600; /* Semi-bold */
    font-size: 0.7em;
    color: #6b7280; /* Gray-500 */
  }
  .react-calendar__month-view__weekdays__weekday {
    padding: 0.5em;
  }
  .react-calendar__month-view__days__day--weekend {
    /* color: #6366f1; // Optional: if you want to color weekend text */
  }
  .react-calendar__month-view__days__day--neighboringMonth {
    color: #d1d5db; /* Gray-300 */
    opacity: 0.7;
  }
  .react-calendar__tile {
    max-width: 100%;
    padding: 10px 6.6667px;
    background: none;
    text-align: center;
    line-height: 16px;
    border-radius: 0.375rem;
    font-size: 0.9em;
  }
  .react-calendar__tile:disabled {
    background-color: #f8f9fa; /* Lighter gray for disabled, e.g., weekends */
    color: #adb5bd; /* Muted color for disabled text */
    /* text-decoration: line-through; // Optional: strike-through */
  }
  .react-calendar__tile:enabled:hover,
  .react-calendar__tile:enabled:focus {
    background-color: #e0e7ff; /* Indigo-100 */
  }
  .react-calendar__tile--now {
    background: #dbeafe; /* Blue-100 for today */
    font-weight: bold;
    color: #1e40af; /* Blue-800 */
  }
  .react-calendar__tile--now:enabled:hover,
  .react-calendar__tile--now:enabled:focus {
    background: #bfdbfe; /* Blue-200 */
  }
  .react-calendar__tile--hasActive { /* For range selection, not used here but good to have */
    background: #4f46e5;
    color: white;
  }
  .react-calendar__tile--hasActive:enabled:hover,
  .react-calendar__tile--hasActive:enabled:focus {
    background: #4338ca;
  }
  .react-calendar__tile--active { /* Currently selected day */
    background: #3730a3 !important; /* Indigo-800, !important to override custom status */
    color: white !important;
  }
  .react-calendar__tile--active:enabled:hover,
  .react-calendar__tile--active:enabled:focus {
    background: #3730a3 !important;
  }
  /* Custom day tile styles */
  .attendance-present { background-color: #D1FAE5 !important; color: #065F46 !important; border: 1px solid #A7F3D0; }
  .attendance-absent { background-color: #FEE2E2 !important; color: #991B1B !important; border: 1px solid #FECACA; }
  .attendance-late { background-color: #FEF3C7 !important; color: #92400E !important; border: 1px solid #FDE68A; }
`;

const StatCard = ({ title, value, icon: Icon, colorClass, iconBgClass }) => (
    <motion.div 
        className="bg-white p-4 rounded-lg shadow-md border border-gray-200/80 flex items-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
    >
        <div className={`p-3 rounded-full ${iconBgClass || 'bg-gray-100'} ${colorClass || 'text-gray-600'} mr-4`}>
            <Icon size={20} />
        </div>
        <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-semibold text-gray-800">{value}</p>
        </div>
    </motion.div>
);


function StudentAttendance() {
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [currentCalendarDate, setCurrentCalendarDate] = useState(startOfDay(new Date()));
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    // Updated initial state for summaryStats
    const [summaryStats, setSummaryStats] = useState({
        presentOnly: 0, // Count of days strictly 'present'
        absent: 0,      // Count of 'absent' days
        late: 0,        // Count of 'late' days (used for tile coloring and info)
        daysMarkedPresentAndLate: 0, // Sum of 'present' + 'late' for the "Days Marked Present" card
        totalSchoolDays: 0, // Sum of 'present' + 'late' + 'absent' for "Total School Days" card
        percentage: 0   // (present + late) / (present + late + absent)
    });
    const [selectedDayInfo, setSelectedDayInfo] = useState(null);

    const fetchStudentAttendance = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await api.get('/student/my-attendance');
            const records = response.data || [];
            setAttendanceRecords(records);

            let presentCount = 0, absentCount = 0, lateCount = 0;
            records.forEach(record => {
                if (record.status === 'present') presentCount++;
                else if (record.status === 'absent') absentCount++;
                else if (record.status === 'late') lateCount++;
            });

            const totalDaysAttendedIncludingLate = presentCount + lateCount;
            const totalRecordedDaysWithStatus = presentCount + absentCount + lateCount;
            
            const overallPercentage = totalRecordedDaysWithStatus > 0
                ? Math.round((totalDaysAttendedIncludingLate / totalRecordedDaysWithStatus) * 100)
                : 0;

            // Updated setSummaryStats call
            setSummaryStats({
                presentOnly: presentCount,
                absent: absentCount,
                late: lateCount,
                daysMarkedPresentAndLate: totalDaysAttendedIncludingLate,
                totalSchoolDays: totalRecordedDaysWithStatus,
                percentage: overallPercentage
            });

        } catch (err) {
            console.error("[StudentAttendance] Error fetching attendance:", err);
            setError(err.response?.data?.message || "Could not load attendance records.");
            setAttendanceRecords([]);
            // Updated error state for summaryStats
            setSummaryStats({
                presentOnly: 0, absent: 0, late: 0, daysMarkedPresentAndLate: 0, totalSchoolDays: 0, percentage: 0
            });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStudentAttendance();
    }, [fetchStudentAttendance]);

    const tileClassName = ({ date, view }) => {
        if (view === 'month') {
            const dayToCompare = startOfDay(date);
            // No need to check for currentCalendarDate here for active class,
            // react-calendar handles it if `value` prop is set correctly.
            const record = attendanceRecords.find(r => isSameDay(startOfDay(parseISO(r.date)), dayToCompare));
            if (record) {
                if (record.status === 'present') return 'attendance-present';
                if (record.status === 'absent') return 'attendance-absent';
                if (record.status === 'late') return 'attendance-late';
            }
        }
        return null;
    };

    const handleDayClick = (value) => {
        const clickedDate = startOfDay(value);
        setCurrentCalendarDate(clickedDate);
        const record = attendanceRecords.find(r => isSameDay(startOfDay(parseISO(r.date)), clickedDate));
        if (record) {
            setSelectedDayInfo({
                date: format(clickedDate, "MMMM d, yyyy"),
                status: record.status.charAt(0).toUpperCase() + record.status.slice(1),
                className: record.class?.name || 'N/A',
                remark: record.remark || 'No remark',
            });
        } else {
            setSelectedDayInfo({
                date: format(clickedDate, "MMMM d, yyyy"),
                status: 'No Record',
                className: 'N/A',
                remark: 'No attendance marked for this day.'
            });
        }
    };

    const onActiveStartDateChange = ({ activeStartDate: newActiveStartDate }) => {
        setSelectedDayInfo(null);
    };


    return (
        <div className="p-4 md:p-6 space-y-6 bg-gray-50 min-h-screen font-sans">
            <style>{calendarCustomStyles}</style>
            <div className="pb-4 mb-4 border-b border-gray-200">
                <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                    My Attendance Report
                </h1>
                <p className="text-sm text-gray-500 mt-1">View your attendance record.</p>
            </div>

            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-md shadow" role="alert"
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

            {isLoading && (
                <div className="text-center py-20">
                    <FiLoader className="animate-spin text-4xl text-indigo-500 mx-auto" />
                    <p className="mt-3 text-sm text-gray-500">Loading your attendance...</p>
                </div>
            )}

            {!isLoading && (
                <>
                    {/* StatCards with updated values and titles */}
                    <motion.div
                        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6"
                        variants={{ show: { transition: { staggerChildren: 0.07 } } }} initial="hidden" animate="show"
                    >
                        <StatCard title="Overall Attendance" value={`${summaryStats.percentage}%`} icon={FiTrendingUp} iconBgClass="bg-green-100" colorClass="text-green-600" />
                        <StatCard title="Days Marked Present" value={summaryStats.daysMarkedPresentAndLate} icon={FiCheckSquare} iconBgClass="bg-emerald-100" colorClass="text-emerald-600" />
                        <StatCard title="Absent Days" value={summaryStats.absent} icon={FiXCircle} iconBgClass="bg-red-100" colorClass="text-red-600" />
                        <StatCard title="Total School Days" value={summaryStats.totalSchoolDays} icon={FiActivity} iconBgClass="bg-purple-100" colorClass="text-purple-600" />
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                            className="lg:col-span-2 bg-white p-3 sm:p-4 rounded-xl shadow-xl border border-gray-200/80"
                        >
                            <Calendar
                                value={currentCalendarDate}
                                tileClassName={tileClassName}
                                onClickDay={handleDayClick}
                                onActiveStartDateChange={onActiveStartDateChange}
                                prev2Label={null}
                                next2Label={null}
                                prevLabel={<FiChevronLeft size={20} />}
                                nextLabel={<FiChevronRight size={20} />}
                                calendarType="gregory"
                                tileDisabled={({ date, view }) => view === 'month' && (date.getDay() === 0 || date.getDay() === 6)}
                            />
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                            className="lg:col-span-1 bg-white p-5 rounded-xl shadow-xl border border-gray-200/80 min-h-[250px]"
                        >
                            <h3 className="text-md font-semibold text-gray-700 border-b border-gray-200 pb-2 mb-4 flex items-center gap-2">
                                <FiInfo className="text-indigo-500"/> Details for Selected Day
                            </h3>
                            {selectedDayInfo ? (
                                <div className="space-y-2.5 text-sm">
                                    <p><strong className="text-gray-500 font-medium w-20 inline-block">Date:</strong> {selectedDayInfo.date}</p>
                                    <p><strong className="text-gray-500 font-medium w-20 inline-block">Status:</strong>
                                        <span className={`ml-1 font-medium px-2 py-0.5 rounded-full text-xs border
                                            ${selectedDayInfo.status === 'Present' ? 'bg-green-100 text-green-700 border-green-300' :
                                            selectedDayInfo.status === 'Absent' ? 'bg-red-100 text-red-700 border-red-300' :
                                            selectedDayInfo.status === 'Late' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                                            'bg-gray-100 text-gray-600 border-gray-300'}`}>
                                            {selectedDayInfo.status}
                                        </span>
                                    </p>
                                    <p><strong className="text-gray-500 font-medium w-20 inline-block">Class:</strong> {selectedDayInfo.className}</p>
                                    {(selectedDayInfo.remark && selectedDayInfo.remark !== 'No remark' && selectedDayInfo.remark !== 'N/A') &&
                                        <p><strong className="text-gray-500 font-medium w-20 inline-block">Remark:</strong> {selectedDayInfo.remark}</p>
                                    }
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center pt-6">
                                    <FiCalendar size={30} className="text-gray-300 mb-2"/>
                                    <p className="text-sm text-gray-400 italic">
                                        Click on a date in the calendar to see details.
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </>
            )}
        </div>
    );
}

export default StudentAttendance;