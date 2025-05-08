import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FiEdit, FiLoader, FiAlertCircle, FiUser, FiMail, 
  FiPhone, FiCalendar, FiHome, FiAward, FiBook, 
  FiUsers, FiMapPin, FiHeart, FiGlobe, FiBriefcase 
} from 'react-icons/fi';
import api from '../services/api';
import defaultAvatar from '../assets/user.jpg';

// Helper to get base URL
const getBackendBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  return apiUrl.replace(/\/api\/?$/, '');
};
const backendBaseUrl = getBackendBaseUrl();

// Date formatting helper
const formatDate = (dateString) => {
  if (!dateString) return "Not Provided";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";
    const options = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' };
    return date.toLocaleDateString('en-US', options);
  } catch (e) { 
    return "Error Formatting"; 
  }
};

// Reusable Detail Item Component
const ProfileDetailItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start py-3 border-b border-gray-100 last:border-b-0">
    <Icon className="w-4 h-4 text-indigo-500 mt-1 mr-3.5 flex-shrink-0" />
    <div className="flex-1">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-sm text-gray-800 break-words">
        {value || <span className="italic text-gray-400">Not Provided</span>}
      </p>
    </div>
  </div>
);

function StudentProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch profile data
  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.get('/student/profile');
      setProfile(response.data);
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

  // Loading state
  if (isLoading) {
    return (
      <div className="p-10 flex justify-center items-center min-h-[400px]">
        <FiLoader className="animate-spin text-3xl text-indigo-500"/>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="m-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow flex items-center">
        <FiAlertCircle className="inline mr-3 text-red-600" size={20}/> 
        <div>
          <p className="font-bold">Error</p>
          <p className="text-sm">{error}</p>
          <button 
            onClick={fetchProfile} 
            className='text-xs underline mt-1 text-red-800'
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No profile state
  if (!profile) {
    return (
      <div className="p-10 text-center text-gray-500">
        Could not find profile information.
      </div>
    );
  }

  // Extract profile data
  const p = profile.profile || {};
  const profileImageUrl = p.profilePic ? `${backendBaseUrl}${p.profilePic}` : defaultAvatar;

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Main Profile Card */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200/80">
        {/* Header Section with Gradient Background */}
        <div className="h-48 relative bg-gradient-to-r from-cyan-500 to-blue-600">
          {/* Profile Picture */}
          <div className="absolute -bottom-12 left-6 sm:left-8 w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white shadow-lg bg-white overflow-hidden flex items-center justify-center">
            <img
              src={profileImageUrl}
              alt="Profile"
              className="w-full h-full object-cover"
              onError={(e) => { 
                if (e.target.src !== defaultAvatar) { 
                  e.target.src = defaultAvatar; 
                } 
              }}
            />
          </div>
          
          {/* Edit Button */}
          <div className="absolute top-4 right-4">
            <Link
              to="/student/StudentEditProfile"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/90 text-blue-700 text-xs font-semibold rounded-md shadow hover:bg-white transition"
              title="Edit Profile"
            >
              <FiEdit size={12}/> Edit
            </Link>
          </div>
        </div>

        {/* Content Section */}
        <div className="pt-16 pb-6 px-6 sm:px-8">
          {/* Name and Basic Info */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              {p.fullName || profile.username || "Student Name"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {p.rollNumber && `Roll No: ${p.rollNumber}`}
              {p.rollNumber && p.currentGrade && ' | '}
              {p.currentGrade && `Grade: ${p.currentGrade}`}
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {/* Personal Info Section */}
            <section>
              <h2 className="text-base font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200 flex items-center gap-2">
                <FiUser className="text-indigo-500"/>Personal Details
              </h2>
              <div className="space-y-1">
                <ProfileDetailItem label="Full Name" value={p.fullName} icon={FiUser}/>
                <ProfileDetailItem label="Date of Birth" value={formatDate(p.dob)} icon={FiCalendar}/>
                <ProfileDetailItem label="Gender" value={p.gender} icon={FiUser}/>
                <ProfileDetailItem label="Blood Group" value={p.bloodGroup} icon={FiHeart}/>
                <ProfileDetailItem label="Nationality" value={p.nationality} icon={FiGlobe}/>
              </div>
            </section>

            {/* Contact Info Section */}
            <section>
              <h2 className="text-base font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200 flex items-center gap-2">
                <FiPhone className="text-cyan-500"/>Contact Details
              </h2>
              <div className="space-y-1">
                <ProfileDetailItem label="Email" value={profile.email} icon={FiMail}/>
                <ProfileDetailItem label="Phone" value={p.phone} icon={FiPhone}/>
                <ProfileDetailItem label="Address" value={p.address} icon={FiHome}/>
                <div className="grid grid-cols-3 gap-x-2 pt-2">
                  <ProfileDetailItem label="City" value={p.city} icon={FiMapPin}/>
                  <ProfileDetailItem label="State" value={p.state} icon={FiMapPin}/>
                  <ProfileDetailItem label="ZIP" value={p.zipCode} icon={FiMapPin}/>
                </div>
              </div>
            </section>

            {/* Academic Info Section */}
            <section>
              <h2 className="text-base font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200 flex items-center gap-2">
                <FiBook className="text-purple-500"/>Academic Details
              </h2>
              <div className="space-y-1">
                <ProfileDetailItem label="Roll Number" value={p.rollNumber} icon={FiAward}/>
                <ProfileDetailItem label="Admission Date" value={formatDate(p.admissionDate)} icon={FiCalendar}/>
                <ProfileDetailItem label="Current Grade" value={p.currentGrade} icon={FiAward}/>
                <ProfileDetailItem label="Previous School" value={p.previousSchool} icon={FiBook}/>
              </div>
            </section>

            {/* Parent Info Section */}
            <section>
              <h2 className="text-base font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200 flex items-center gap-2">
                <FiUsers className="text-green-500"/>Parent Details
              </h2>
              {/* Father */}
              <div className='mb-3'>
                <h3 className="text-xs font-bold text-gray-600 mb-1">Father</h3>
                <ProfileDetailItem label="Name" value={p.fatherName} icon={FiUser}/>
                <ProfileDetailItem label="Occupation" value={p.fatherOccupation} icon={FiBriefcase}/>
                <ProfileDetailItem label="Phone" value={p.fatherPhone} icon={FiPhone}/>
              </div>
              {/* Mother */}
              <div className='border-t border-gray-100 pt-3'>
                <h3 className="text-xs font-bold text-gray-600 mb-1">Mother</h3>
                <ProfileDetailItem label="Name" value={p.motherName} icon={FiUser}/>
                <ProfileDetailItem label="Occupation" value={p.motherOccupation} icon={FiBriefcase}/>
                <ProfileDetailItem label="Phone" value={p.motherPhone} icon={FiPhone}/>
              </div>
              {/* Guardian */}
              {(p.guardianName || p.guardianRelation || p.guardianPhone) && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <h3 className="text-xs font-bold text-gray-600 mb-1">Guardian</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                    <ProfileDetailItem label="Name" value={p.guardianName} icon={FiUser}/>
                    <ProfileDetailItem label="Relation" value={p.guardianRelation} icon={FiUser}/>
                  </div>
                  <ProfileDetailItem label="Phone" value={p.guardianPhone} icon={FiPhone}/>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentProfile;