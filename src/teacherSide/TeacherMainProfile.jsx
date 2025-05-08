// src/teacherSide/TeacherMainProfile.jsx
import React, { useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTeacherProfile } from '../context/TeacherProfileContext'; // <-- USE TEACHER CONTEXT HOOK
import bgImage from '../assets/Attractive.jpeg'; // Ensure this path is correct

// Import Icons
import {
    FiMail, FiPhone, FiCalendar, FiHome, FiAward, FiBook, FiLoader,
    FiAlertCircle, FiEdit, FiUser, FiMapPin, FiGlobe, FiBriefcase, FiZap
} from 'react-icons/fi';
import defaultAvatar from '../assets/user.jpg'; // Default avatar if context fails

// Helper: Format Date
const formatDate = (dateString) => {
    if (!dateString) return "Not Provided";
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "Invalid Date";
        const options = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' };
        return date.toLocaleDateString('en-US', options);
    } catch (e) { return "Error Formatting"; }
};

// Helper: Detail Item Component
const DetailItem = ({ icon: Icon, label, value, isLoading = false }) => {
    // Show skeleton only during initial context load
    if (isLoading) {
        return (
            <div className="flex items-start py-2.5 border-b border-gray-100 animate-pulse">
                <div className="w-4 h-4 bg-gray-200 rounded-full mr-4 mt-1 flex-shrink-0"></div>
                <div className="flex-1"> <div className="h-3 w-20 bg-gray-200 rounded mb-2"></div> <div className="h-4 w-32 bg-gray-200 rounded"></div> </div>
            </div>
        );
    }
    return (
        <div className="flex items-start py-2.5 border-b border-gray-100 last:border-b-0">
            <Icon className="w-4 h-4 text-indigo-600 mt-1 mr-4 flex-shrink-0" />
            <div className="flex-1 min-w-0"> {/* Ensure text wraps */}
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
                <p className="text-sm text-gray-900 break-words">
                    {value || <span className="italic text-gray-400">Not Provided</span>}
                </p>
            </div>
        </div>
    );
};

const TeacherMainProfile = () => {
    const navigate = useNavigate();
    const location = useLocation();
    // Use the TEACHER context hook
    const {
        teacherProfile,
        isLoadingTeacherProfile,
        teacherProfileError,
        refreshTeacherProfile, // Function to refetch
        getFullTeacherProfileImageUrl // Function to get image URL
    } = useTeacherProfile();

    // Effect to trigger context refetch if navigated with refresh=true state
    useEffect(() => {
        if (location.state?.refresh) {
            console.log("TeacherMainProfile: Refresh triggered via navigation state.");
            refreshTeacherProfile();
            navigate(location.pathname, { replace: true, state: {} }); // Clear state
        }
    }, [location.state?.refresh, refreshTeacherProfile, navigate, location.pathname]);

    // Calculate Profile Completion based on TEACHER context data
    const calculateProfileCompletion = () => {
        if (!teacherProfile?._id) return 0;

        const requiredFields = [ // Fields for Teacher profile completion
            'email', 'profile.fullName', 'profile.phone', 'profile.dob',
            'profile.gender', 'profile.address', 'profile.city', 'profile.state',
            'profile.country', 'profile.qualification', 'profile.experience',
            'profile.subjects', 'profile.schoolName', 'profile.designation', 'profile.skills',
            // 'profile.profilePic' // Optional
        ];
        let completedCount = 0;
        requiredFields.forEach(fieldPath => {
            const keys = fieldPath.split('.');
            let value = teacherProfile;
            for (const key of keys) {
                if (value && typeof value === 'object' && value.hasOwnProperty(key) && value[key] !== null && value[key] !== '') {
                    value = value[key];
                } else { value = undefined; break; }
            }
            if (value !== undefined) completedCount++;
        });
        const totalFields = requiredFields.length;
        return totalFields > 0 ? Math.round((completedCount / totalFields) * 100) : 0;
    };

    // --- Render Logic ---

    // Use teacher-specific loading state
    if (isLoadingTeacherProfile && !teacherProfile) {
        return <div className="min-h-screen flex items-center justify-center"><FiLoader className="animate-spin text-3xl text-blue-500" /></div>;
    }

    // Use teacher-specific error state
    if (teacherProfileError) {
        return (
            <div className="m-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow flex items-center">
                <FiAlertCircle className="inline mr-3 text-red-600" size={20}/>
                <div>
                    <p className="font-bold">Error Loading Teacher Profile</p>
                    <p className="text-sm">{teacherProfileError}</p>
                    <button onClick={refreshTeacherProfile} className='text-xs underline mt-1 text-red-800'>Try Again</button>
                </div>
            </div>
        );
    }

    if (!teacherProfile) {
        return <div className="p-10 text-center text-gray-500">Teacher profile data unavailable.</div>;
    }

    // Safe access to profile.profile
    const p = teacherProfile.profile || {};
    const profileImageUrl = getFullTeacherProfileImageUrl(); // Get URL via context helper

    // --- Main Profile Display ---
    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200/50">
                    {/* Header */}
                    <div className="h-64 relative bg-cover bg-center" style={{ backgroundImage: `url(${bgImage})` }}>
                        <div className="absolute inset-0 bg-gradient-to-t from-blue-800/50 via-blue-600/20 to-transparent"></div>
                        <div className="absolute -bottom-16 left-8 w-32 h-32 rounded-full border-4 border-white shadow-xl bg-white overflow-hidden flex items-center justify-center">
                            <img src={profileImageUrl} alt="Profile" className="w-full h-full object-cover"/>
                        </div>
                        <div className="absolute bottom-4 right-8">
                            <Link to="/teacher/TeacherEditProfile" className="flex items-center gap-2 bg-white text-indigo-700 hover:bg-indigo-50 px-4 py-2 rounded-lg shadow-md transition-all text-sm font-medium border border-indigo-100 hover:border-indigo-300">
                                <FiEdit size={14}/> Edit Profile
                            </Link>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="pt-20 pb-8 px-8">
                        {/* Top Info */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                             <div>
                                <h1 className="text-3xl font-bold text-gray-800">{p.fullName || teacherProfile.username || "Teacher Name"}</h1>
                                <p className="text-lg text-indigo-600 font-medium mt-1">{p.designation || <span className='italic text-gray-400'>Designation</span>}</p>
                                {p.schoolName && (<p className="text-gray-500 flex items-center mt-1.5 text-sm"><FiBriefcase className="h-4 w-4 mr-1.5 text-gray-400"/> {p.schoolName}</p>)}
                            </div>
                            {/* Profile Completion */}
                            <div className="mt-4 md:mt-0 w-full md:w-1/3 lg:w-1/4">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-medium text-gray-500">Profile Completion</span>
                                    <span className="text-xs font-bold text-indigo-600">{calculateProfileCompletion()}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500" style={{ width: `${calculateProfileCompletion()}%` }}></div>
                                </div>
                                {calculateProfileCompletion() < 80 && (<p className="text-xs text-gray-400 mt-1 text-right">Complete your profile.</p>)}
                            </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6 mt-8">
                            {/* Personal Details */}
                            <div className="bg-gradient-to-br from-indigo-50/40 via-white to-blue-50/30 p-6 rounded-xl border border-indigo-100 shadow-sm">
                                <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2"><FiUser className="text-indigo-600"/> Personal Information</h2>
                                <div className="space-y-1">
                                    {/* Use isLoadingTeacherProfile for skeleton state */}
                                    <DetailItem icon={FiMail} label="Email" value={teacherProfile.email} isLoading={isLoadingTeacherProfile} />
                                    <DetailItem icon={FiPhone} label="Phone" value={p.phone} isLoading={isLoadingTeacherProfile} />
                                    <DetailItem icon={FiCalendar} label="Date of Birth" value={formatDate(p.dob)} isLoading={isLoadingTeacherProfile} />
                                    <DetailItem icon={FiUser} label="Gender" value={p.gender} isLoading={isLoadingTeacherProfile} />
                                    <DetailItem icon={FiHome} label="Address" value={p.address} isLoading={isLoadingTeacherProfile} />
                                    <div className="grid grid-cols-2 gap-x-4 pt-2">
                                        <DetailItem icon={FiMapPin} label="City" value={p.city} isLoading={isLoadingTeacherProfile} />
                                        <DetailItem icon={FiMapPin} label="State" value={p.state} isLoading={isLoadingTeacherProfile} />
                                    </div>
                                    <DetailItem icon={FiGlobe} label="Country" value={p.country} isLoading={isLoadingTeacherProfile} />
                                </div>
                            </div>
                            {/* Professional Details */}
                            <div className="bg-gradient-to-br from-purple-50/40 via-white to-pink-50/30 p-6 rounded-xl border border-purple-100 shadow-sm">
                                <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2"><FiBriefcase className="text-purple-600"/> Professional Information</h2>
                                <div className="space-y-1">
                                    <DetailItem icon={FiAward} label="Qualification" value={p.qualification} isLoading={isLoadingTeacherProfile} />
                                    <DetailItem icon={FiCalendar} label="Experience" value={p.experience ? `${p.experience} years` : ""} isLoading={isLoadingTeacherProfile} />
                                    <DetailItem icon={FiBook} label="Subjects" value={p.subjects} isLoading={isLoadingTeacherProfile} />
                                    <DetailItem icon={FiUser} label="Designation" value={p.designation} isLoading={isLoadingTeacherProfile} />
                                    <DetailItem icon={FiBriefcase} label="School Name" value={p.schoolName} isLoading={isLoadingTeacherProfile} />
                                    <DetailItem icon={FiZap} label="Skills" value={p.skills} isLoading={isLoadingTeacherProfile} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeacherMainProfile;