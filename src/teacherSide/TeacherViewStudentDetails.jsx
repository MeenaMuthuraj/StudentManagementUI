// src/teacherSide/TeacherViewStudentDetails.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FiLoader, FiAlertCircle, FiUser, FiMail, FiPhone, FiCalendar, FiHome, FiAward, FiBook, FiArrowLeft, FiUsers } from 'react-icons/fi'; // Added FiUsers for parent section

// Reusable detail item
const DetailItem = ({ icon: Icon, label, value }) => (
    <div className="flex items-start py-2.5 border-b border-gray-100">
        <Icon className="w-4 h-4 text-indigo-600 mt-1 mr-4 flex-shrink-0" />
        <div className="flex-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
            <p className="text-sm text-gray-900 break-words">{value || <span className="italic text-gray-400">Not Provided</span>}</p>
        </div>
    </div>
);

// Helper
const formatDate = (dateString) => { /* ... same as StudentProfile ... */
    if (!dateString) return "Not Set"; try { const date = new Date(dateString); if (isNaN(date.getTime())) return "Invalid Date"; const options = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }; return date.toLocaleDateString('en-US', options); } catch (e) { return "Error"; }
};

function TeacherViewStudentDetails() {
    const { studentId } = useParams(); // Get studentId from route parameter
    const navigate = useNavigate();
    const [student, setStudent] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchStudentProfile = useCallback(async () => {
        if (!studentId) {
            setError("Student ID is missing.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError('');
        try {
             // Call the specific teacher endpoint to view a student's profile
            const response = await api.get(`/api/teacher/students/${studentId}/profile`);
            setStudent(response.data);
        } catch (err) {
            console.error(`Error fetching student ${studentId} profile for teacher:`, err);
            setError(err.response?.data?.message || "Could not load student details or access denied.");
        } finally {
            setIsLoading(false);
        }
    }, [studentId]);

    useEffect(() => {
        fetchStudentProfile();
    }, [fetchStudentProfile]);

    if (isLoading) return <div className="p-10 flex justify-center"><FiLoader className="animate-spin text-2xl text-indigo-500"/></div>;
    if (error) return ( <div className="m-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded text-sm"> <FiAlertCircle className="inline mr-2"/>{error} <button onClick={() => navigate(-1)} className="ml-4 text-xs underline">(Go Back)</button></div> );
    if (!student) return <div className="p-10 text-center text-gray-500">Student details not found.</div>;

    const p = student.profile || {}; // Safe access to profile

    return (
         <div className="p-4 sm:p-6 space-y-6">
              {/* Back Button */}
              <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 mb-4" > <FiArrowLeft size={16}/> Back </button>

              <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                   <div className="p-5 sm:p-6 border-b border-gray-200">
                     <h1 className="text-xl font-bold text-gray-800">Student Profile Details</h1>
                      <p className="text-sm text-gray-500 mt-1">{p.fullName || student.email}</p>
                  </div>

                  {/* Split content display - similar to StudentProfile view */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 p-5 sm:p-6">

                        {/* Column 1 */}
                         <div className='space-y-2'>
                           <h3 className="text-md font-semibold text-gray-700 mb-2 flex items-center gap-2"><FiUser/>Basic Info</h3>
                            <DetailItem label="Full Name" value={p.fullName} icon={FiUser}/>
                             <DetailItem label="Email" value={student.email} icon={FiMail}/>
                             <DetailItem label="Roll Number" value={p.rollNumber} icon={FiAward}/>
                            <DetailItem label="Date of Birth" value={formatDate(p.dob)} icon={FiCalendar}/>
                            <DetailItem label="Gender" value={p.gender} icon={FiUser}/>
                           <DetailItem label="Blood Group" value={p.bloodGroup} icon={FiAward}/>
                            <DetailItem label="Nationality" value={p.nationality} icon={FiAward}/>
                         </div>

                          {/* Column 2 */}
                         <div className='space-y-2'>
                             <h3 className="text-md font-semibold text-gray-700 mb-2 flex items-center gap-2"><FiPhone/>Contact & Academic</h3>
                             <DetailItem label="Phone" value={p.phone} icon={FiPhone}/>
                             <DetailItem label="Address" value={p.address} icon={FiHome}/>
                            <DetailItem label="City" value={p.city} icon={FiHome}/>
                            <DetailItem label="State" value={p.state} icon={FiHome}/>
                             <DetailItem label="ZIP Code" value={p.zipCode} icon={FiHome}/>
                            <DetailItem label="Admission Date" value={formatDate(p.admissionDate)} icon={FiCalendar}/>
                             <DetailItem label="Current Grade" value={p.currentGrade} icon={FiBook}/>
                            {/* Add more read-only fields here */}
                         </div>

                         {/* Full Width Sections Below */}
                          <hr className="md:col-span-2 border-gray-100 my-2"/>
                         <div className="md:col-span-2 space-y-2">
                              <h3 className="text-md font-semibold text-gray-700 mb-2 flex items-center gap-2"><FiUsers/>Parent Info</h3>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                                  <div>
                                       <DetailItem label="Father's Name" value={p.fatherName} icon={FiUser}/>
                                      <DetailItem label="Father's Occupation" value={p.fatherOccupation} icon={FiUser}/>
                                      <DetailItem label="Father's Phone" value={p.fatherPhone} icon={FiPhone}/>
                                   </div>
                                   <div>
                                       <DetailItem label="Mother's Name" value={p.motherName} icon={FiUser}/>
                                      <DetailItem label="Mother's Occupation" value={p.motherOccupation} icon={FiUser}/>
                                       <DetailItem label="Mother's Phone" value={p.motherPhone} icon={FiPhone}/>
                                   </div>
                              </div>
                         </div>

                         {/* Add Medical, Additional Services display if needed */}

                   </div>
              </div>
         </div>
     );
}

export default TeacherViewStudentDetails;