// src/studentSide/StudentProfile.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiEdit, FiLoader, FiAlertCircle, FiUser, FiMail, FiPhone, FiCalendar, FiHome, FiAward, FiBook ,FiUsers} from 'react-icons/fi';
import api from '../services/api';

// Helper from TeacherMainProfile can be reused/shared
const formatDate = (dateString) => {
    if (!dateString) return "Not Set";
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "Invalid Date";
        const options = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' };
        return date.toLocaleDateString('en-US', options);
    } catch (e) { return "Error Formatting"; }
};

// Simple display item component
const ProfileDetailItem = ({ icon: Icon, label, value }) => (
    <div className="flex items-start py-2">
        <Icon className="w-4 h-4 text-indigo-500 mt-1 mr-3 flex-shrink-0" />
        <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
            <p className="text-sm text-gray-800">{value || <span className="italic text-gray-400">Not Set</span>}</p>
        </div>
    </div>
);


function StudentProfile() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null); // Start null
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Fetch profile data
    const fetchProfile = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await api.get('/student/profile');
            setProfile(response.data); // Store the whole user object
        } catch (err) {
            console.error("Error fetching student profile:", err);
            setError(err.response?.data?.message || "Could not load profile.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);


    if (isLoading) {
        return <div className="p-10 flex justify-center"><FiLoader className="animate-spin text-2xl text-indigo-500"/></div>;
    }

    if (error) {
         return ( <div className="m-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded text-sm"> <FiAlertCircle className="inline mr-2"/>{error} </div> );
    }

    if (!profile) {
        return <div className="p-10 text-center text-gray-500">Could not find profile information.</div>;
    }

    // Extract profile sub-object safely
    const p = profile.profile || {};

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
                <Link
                    to="/student/StudentEditProfile"
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-md shadow-sm hover:bg-indigo-700 transition"
                 >
                     <FiEdit size={14}/> Edit Profile
                 </Link>
            </div>

            <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                <div className="p-5 sm:p-6 space-y-5">
                    {/* Basic Info */}
                     <div className='border-b pb-4 mb-4'>
                          <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2"><FiUser/>Basic Information</h2>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4">
                             <ProfileDetailItem label="Full Name" value={p.fullName} icon={FiUser}/>
                             <ProfileDetailItem label="Email" value={profile.email} icon={FiMail}/>
                             <ProfileDetailItem label="Roll Number" value={p.rollNumber} icon={FiAward}/>
                              <ProfileDetailItem label="Date of Birth" value={formatDate(p.dob)} icon={FiCalendar}/>
                              <ProfileDetailItem label="Gender" value={p.gender} icon={FiUser}/>
                              <ProfileDetailItem label="Blood Group" value={p.bloodGroup} icon={FiAward}/>
                              <ProfileDetailItem label="Nationality" value={p.nationality} icon={FiAward}/>
                         </div>
                     </div>

                     {/* Contact Info */}
                      <div className='border-b pb-4 mb-4'>
                          <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2"><FiPhone/>Contact Details</h2>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4">
                              <ProfileDetailItem label="Phone" value={p.phone} icon={FiPhone}/>
                              <ProfileDetailItem label="Address" value={p.address} icon={FiHome}/>
                             <ProfileDetailItem label="City" value={p.city} icon={FiHome}/>
                             <ProfileDetailItem label="State" value={p.state} icon={FiHome}/>
                             <ProfileDetailItem label="ZIP Code" value={p.zipCode} icon={FiHome}/>
                             <ProfileDetailItem label="Country" value={p.country} icon={FiHome}/>
                          </div>
                      </div>

                       {/* Academic Info */}
                       <div className='border-b pb-4 mb-4'>
                           <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2"><FiBook/>Academic Information</h2>
                           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4">
                               <ProfileDetailItem label="Admission Date" value={formatDate(p.admissionDate)} icon={FiCalendar}/>
                               <ProfileDetailItem label="Current Grade" value={p.currentGrade} icon={FiAward}/>
                              <ProfileDetailItem label="Previous School" value={p.previousSchool} icon={FiBook}/>
                          </div>
                       </div>

                       {/* Parent Info */}
                        <div className='border-b pb-4 mb-4'>
                           <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2"><FiUsers/>Parent Information</h2>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                              {/* Father */}
                               <div>
                                   <h3 className="text-sm font-semibold text-gray-600 mb-1">Father</h3>
                                   <ProfileDetailItem label="Name" value={p.fatherName} icon={FiUser}/>
                                   <ProfileDetailItem label="Occupation" value={p.fatherOccupation} icon={FiUser}/>
                                  <ProfileDetailItem label="Phone" value={p.fatherPhone} icon={FiPhone}/>
                               </div>
                               {/* Mother */}
                                <div>
                                   <h3 className="text-sm font-semibold text-gray-600 mb-1">Mother</h3>
                                    <ProfileDetailItem label="Name" value={p.motherName} icon={FiUser}/>
                                    <ProfileDetailItem label="Occupation" value={p.motherOccupation} icon={FiUser}/>
                                   <ProfileDetailItem label="Phone" value={p.motherPhone} icon={FiPhone}/>
                                </div>
                           </div>
                           {/* Guardian */}
                            {(p.guardianName || p.guardianRelation || p.guardianPhone) && (
                               <div className="mt-4 pt-3 border-t border-gray-100">
                                  <h3 className="text-sm font-semibold text-gray-600 mb-1">Guardian</h3>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4">
                                    <ProfileDetailItem label="Name" value={p.guardianName} icon={FiUser}/>
                                     <ProfileDetailItem label="Relation" value={p.guardianRelation} icon={FiUser}/>
                                    <ProfileDetailItem label="Phone" value={p.guardianPhone} icon={FiPhone}/>
                                  </div>
                               </div>
                           )}
                        </div>

                        {/* Other sections (Medical, Services) similar structure */}
                        {/* ... */}

                 </div>
             </div>
         </div>
     );
 }

 export default StudentProfile;