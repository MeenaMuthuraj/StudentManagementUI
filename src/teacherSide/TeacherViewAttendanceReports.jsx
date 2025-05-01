// src/teacherSide/TeacherViewAttendanceReports.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { FiCalendar, FiFilter, FiDownload, FiAlertCircle, FiLoader, FiUsers, FiCheckSquare, FiXSquare, FiClock } from 'react-icons/fi';
import { format, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- Helpers ---
const getStatusBadge = (status) => { switch (status?.toLowerCase()) { case 'present': return 'bg-green-100 text-green-700'; case 'absent': return 'bg-red-100 text-red-700'; case 'late': return 'bg-yellow-100 text-yellow-700'; default: return 'bg-gray-100 text-gray-500'; } };
const getStatusIcon = (status) => { switch (status?.toLowerCase()) { case 'present': return <FiCheckSquare className="inline mr-1.5 mb-px"/>; case 'absent': return <FiXSquare className="inline mr-1.5 mb-px"/>; case 'late': return <FiClock className="inline mr-1.5 mb-px"/>; default: return null; } };
const formatDateForDisplay = (dateString) => { if (!dateString) return '-'; try { const dateObj = parseISO(dateString); return format(dateObj, 'PPP'); } catch (e) { try { return format(new Date(dateString), 'PPP'); } catch { return 'Invalid Date'; } } };
// --- END Helpers ---

function TeacherViewAttendanceReports() {
    const navigate = useNavigate();
    const [classes, setClasses] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [reportData, setReportData] = useState([]);
    const [isLoadingClasses, setIsLoadingClasses] = useState(true);
    const [isLoadingReport, setIsLoadingReport] = useState(false);
    const [error, setError] = useState('');
    const [selectedClassName, setSelectedClassName] = useState('');

    const fetchClasses = useCallback(async () => { setIsLoadingClasses(true);setError('');try{const r=await api.get('/teacher/classes');setClasses(r.data||[]);}catch(e){setError('Failed to load classes.');}finally{setIsLoadingClasses(false);}},[]);
    useEffect(() => { fetchClasses(); }, [fetchClasses]);
    useEffect(() => { if(selectedClassId){const c=classes.find(cl=>cl._id===selectedClassId); setSelectedClassName(c?.name||'');} else {setSelectedClassName('');}}, [selectedClassId, classes]);

    const fetchReport = useCallback(async () => {
        if (!selectedClassId || !selectedDate) { setReportData([]); return; }
        setIsLoadingReport(true); setError('');
        const formattedDate = format(selectedDate, 'yyyy-MM-dd');
        try {
             const response = await api.get(`/teacher/attendance/reports/class/${selectedClassId}`, { params: { date: formattedDate } });
             const sortedData = (response.data || []).sort((a,b) => a.student?.profile?.fullName?.localeCompare(b.student?.profile?.fullName || '') || 0);
             setReportData(sortedData);
             if (sortedData.length === 0) console.log("No records found");
        } catch (err) { setError(err.response?.data?.message || 'Failed to load report.'); setReportData([]); }
        finally { setIsLoadingReport(false); }
    }, [selectedClassId, selectedDate]);

    const handleViewReport = () => { if (selectedClassId && selectedDate) fetchReport(); else { setError("Select Class and Date."); setReportData([]);}};

    const handleDownloadPdf = () => {
         if (reportData.length === 0 || !selectedClassName || !selectedDate) { alert("No report data to download."); return; }
         try {
             const doc = new jsPDF();
             const title = `Attendance Report - ${selectedClassName}`;
             const reportDate = format(selectedDate, 'PPP');
             doc.setFontSize(16); doc.text(title, 14, 22); doc.setFontSize(10); doc.setTextColor(100); doc.text(`Date: ${reportDate}`, 14, 30);
             const tableColumn = ["#", "Student Name", "Phone", "Status"]; // Changed Email to Phone
             const tableRows = [];
             reportData.forEach((record, index) => {
                 const rowData = [
                     index + 1,
                     record.student?.profile?.fullName || '(No Name)',
                     record.student?.profile?.phone || '-', // Using Phone now
                     record.status ? record.status.charAt(0).toUpperCase() + record.status.slice(1) : 'N/A'
                  ];
                 tableRows.push(rowData);
             });
             autoTable(doc, { head: [tableColumn], body: tableRows, startY: 36, theme: 'grid', headStyles:{fillColor:[74,85,104]}, styles:{fontSize:9,cellPadding:2}, columnStyles:{0:{cellWidth:10}}});
              const fileName = `Attendance_${selectedClassName}_${format(selectedDate, 'yyyy-MM-dd')}.pdf`; doc.save(fileName);
          } catch(err) { setError("Could not generate PDF report."); console.error("Error generating PDF:", err); }
      };

    return (
        <div className="p-4 md:p-6 space-y-6 min-h-screen bg-gray-50">
            <h1 className="text-2xl font-bold text-gray-800 border-b pb-3 mb-3">View Daily Attendance Report</h1>
            {/* Filter Section */}
            <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div> <label htmlFor="classSelectRpt" className="block text-sm font-medium text-gray-700 mb-1.5">Class</label> <select id="classSelectRpt" value={selectedClassId} onChange={(e)=>{setSelectedClassId(e.target.value);setReportData([]);setError('');}} className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm" disabled={isLoadingClasses}> <option value="">-- Select Class --</option> {classes.map(cls => (<option key={cls._id} value={cls._id}>{cls.name}</option>))} </select> </div>
                <div> <label htmlFor="dateSelectRpt" className="block text-sm font-medium text-gray-700 mb-1.5">Date</label> <div className="relative"> <DatePicker id="dateSelectRpt" selected={selectedDate} onChange={(date)=>{setSelectedDate(date);setReportData([]);setError('');}} dateFormat="yyyy-MM-dd" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm" maxDate={new Date()} /> <FiCalendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" /> </div> </div>
                <div> <button onClick={handleViewReport} disabled={isLoadingReport || !selectedClassId || !selectedDate} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50" > {isLoadingReport ? <FiLoader className="animate-spin"/> : <FiFilter />} View Report </button> </div>
            </div>
            {/* Error Display */}
            <AnimatePresence> {error && (<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-2.5 rounded text-sm flex items-center justify-between shadow-sm"><span><FiAlertCircle className="inline mr-1.5"/>{error}</span> <button onClick={() => setError('')} className='text-lg font-bold opacity-70 hover:opacity-100'>×</button> </motion.div>)} </AnimatePresence>
            {/* Report Display Area */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[400px]">
                <div className="px-4 py-3 bg-gray-50 border-b flex justify-between items-center">
                     <h3 className="text-md font-semibold text-gray-700">{selectedClassName && selectedDate ? `Report for ${selectedClassName} on ${format(selectedDate, 'PPP')}`: 'Select class and date'}</h3>
                     {reportData.length > 0 && !isLoadingReport && (<button onClick={handleDownloadPdf} className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-indigo-600 bg-indigo-100 rounded-md hover:bg-indigo-200 transition shadow-sm border border-indigo-200"><FiDownload size={12}/> Download PDF</button>)}
                </div>
                 {isLoadingReport ? (<div className="p-10 flex justify-center"><FiLoader className="animate-spin text-2xl text-indigo-500"/></div>)
                 : !selectedClassId || !selectedDate ? (<div className="text-center p-12 text-gray-400 italic text-sm">Please select criteria and click "View Report".</div>)
                 : reportData.length === 0 ? (<div className="text-center py-12 px-6 text-gray-500 flex flex-col items-center"> <FiCalendar size={36}/> <p className="font-medium mt-2">No Records</p><p className='text-xs mt-1'>No attendance marked for this date/class.</p></div>)
                  : ( <div className="overflow-x-auto"> <table className="min-w-full divide-y divide-gray-200">
                         <thead className="bg-gray-100"><tr><th className="w-[40%] px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Student Name</th><th className="w-[40%] px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone Number</th><th className="w-[20%] px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th></tr></thead>
                         <tbody className="bg-white divide-y divide-gray-100">
                         {reportData.map((record) => (<tr key={record._id || record.student?._id} className="hover:bg-gray-50/70">
                             <td className="px-5 py-3 whitespace-nowrap align-middle"><p className="text-sm text-gray-800 font-medium">{record.student?.profile?.fullName || '(Name not found)'}</p><p className="text-xs text-gray-500">{record.student?.email || ''}</p></td>
                             {/* CORRECTED to access phone */}
                             <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-600 align-middle">{record.student?.profile?.phone || '-'}</td>
                             <td className="px-5 py-3 whitespace-nowrap text-sm text-center align-middle"><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold leading-none ${getStatusBadge(record.status)}`}>{getStatusIcon(record.status)}<span className='ml-0.5'>{record.status ? record.status.charAt(0).toUpperCase() + record.status.slice(1) : 'N/A'}</span></span></td>
                             </tr>))}
                         </tbody>
                      </table></div> )}
                  {/* Removed Download button from here, moved to header */}
            </div>
        </div>
    );
}

export default TeacherViewAttendanceReports;