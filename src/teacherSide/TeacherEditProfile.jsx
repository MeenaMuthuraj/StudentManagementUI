// src/teacherSide/TeacherEditProfile.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FiSave, FiLoader, FiAlertCircle, FiCamera, FiTrash2, FiUser, FiMail,
    FiPhone, FiCalendar, FiHome, FiMapPin, FiGlobe, FiAward, FiBook,
    FiBriefcase, FiZap // Added necessary icons
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { useTeacherProfile } from '../context/TeacherProfileContext'; // <-- USE TEACHER CONTEXT HOOK
import defaultAvatar from '../assets/user.jpg'; // Default avatar if context fails

// Helper to get base URL
const getBackendBaseUrl = () => {
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    return apiUrl.replace(/\/api\/?$/, '');
};
const backendBaseUrl = getBackendBaseUrl();

// Define initial form structure matching Teacher profile fields
const getInitialTeacherFormData = () => ({
    fullName: '', phone: '', dob: '', gender: '', address: '', city: '',
    state: '', country: 'India', qualification: '', experience: '',
    subjects: '', schoolName: '', designation: '', skills: '',
    // profilePic is handled separately via context/API
});

const TeacherEditProfile = () => {
    const navigate = useNavigate();
    // Use the TEACHER context hook
    const {
        teacherProfile,
        isLoadingTeacherProfile,
        teacherProfileError,
        updateTeacherProfilePic, // Context function to update pic path state
        refreshTeacherProfile, // Context function to refetch profile
        getFullTeacherProfileImageUrl // Context function to get image URL
    } = useTeacherProfile();

    const [activeTab, setActiveTab] = useState("personal");
    // Local state for the form, initialized from context
    const [formData, setFormData] = useState(getInitialTeacherFormData());
    // Local state for component actions/feedback
    const [isLoadingFormData, setIsLoadingFormData] = useState(true);
    const [isSavingText, setIsSavingText] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [isRemovingImage, setIsRemovingImage] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
    const [localError, setLocalError] = useState(null);
    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState("");

    // Effect to initialize/sync local form data when context profile loads/changes
    useEffect(() => {
        if (!isLoadingTeacherProfile && teacherProfile) {
            const profileData = teacherProfile.profile || {};
            const dobFormatted = profileData.dob ? new Date(profileData.dob).toISOString().split('T')[0] : "";

            setFormData({ // Populate local form state
                fullName: profileData.fullName || '',
                phone: profileData.phone || '',
                dob: dobFormatted,
                gender: profileData.gender || '',
                address: profileData.address || '',
                city: profileData.city || '',
                state: profileData.state || '',
                country: profileData.country || 'India',
                qualification: profileData.qualification || '',
                experience: profileData.experience || '',
                subjects: profileData.subjects || '',
                schoolName: profileData.schoolName || '',
                designation: profileData.designation || '',
                skills: profileData.skills || '',
            });
            setIsLoadingFormData(false);
        } else if (!isLoadingTeacherProfile && !teacherProfile) {
            // Handle case where context loaded but no profile (maybe fetch error)
             if (teacherProfileError) {
                 setLocalError(`Failed to load profile: ${teacherProfileError}`);
             } else {
                 setLocalError("Could not load teacher profile data to edit.");
             }
            setIsLoadingFormData(false);
        }
        // Rerun if context loading state or profile data changes
    }, [teacherProfile, isLoadingTeacherProfile, teacherProfileError]);

    // --- Handlers ---

    // Update local form state on input change
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({ ...prevData, [name]: value }));
        setLocalError(null); // Clear errors on change
    };

    // Update local password state
    const handlePasswordChange = (e) => {
        setPasswords(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setLocalError(null);
    };

    // Upload Image -> calls API, updates Context
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        // Validation
        if (!file.type.startsWith('image/')) { setLocalError('Invalid image file type.'); setTimeout(()=>setLocalError(null), 3000); return; }
        if (file.size > 5 * 1024 * 1024) { setLocalError('Image size exceeds 5MB.'); setTimeout(()=>setLocalError(null), 3000); return; }

        setIsUploadingImage(true); setLocalError(null);
        const uploadFormData = new FormData();
        uploadFormData.append("profileImage", file);

        try {
            const response = await api.post("/teacher/profile/image", uploadFormData); // Use TEACHER endpoint
            if (response.data?.profilePic) {
                updateTeacherProfilePic(response.data.profilePic); // UPDATE CONTEXT STATE
                setPopupMessage("Picture updated!"); setShowPopup(true); setTimeout(() => setShowPopup(false), 2000);
            } else { throw new Error("API Error: Missing profilePic."); }
        } catch (err) { setLocalError(err.response?.data?.message || err.message || "Upload failed."); setTimeout(() => setLocalError(null), 3000); }
        finally { setIsUploadingImage(false); if (e?.target) e.target.value = null; }
    };

    // Remove Image -> calls API, updates Context
    const handleRemoveImage = async () => {
        if (!teacherProfile?.profile?.profilePic) return; // Check context for pic
        if (!window.confirm("Remove profile picture?")) return;

        setIsRemovingImage(true); setLocalError(null);
        try {
            await api.delete("/teacher/profile/image"); // Use TEACHER endpoint
            updateTeacherProfilePic(null); // UPDATE CONTEXT STATE
            setPopupMessage("Picture removed."); setShowPopup(true); setTimeout(() => setShowPopup(false), 2000);
        } catch (err) { setLocalError(err.response?.data?.message || "Removal failed."); setTimeout(() => setLocalError(null), 3000); }
        finally { setIsRemovingImage(false); }
    };

    // Change Password -> calls API
    const handleChangePassword = async () => {
        setLocalError(null);
        // Validation
        if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) { setLocalError("Fill all password fields."); setTimeout(() => setLocalError(null), 3000); return; }
        if (passwords.newPassword !== passwords.confirmPassword) { setLocalError("New passwords don't match."); setTimeout(() => setLocalError(null), 3000); return; }
        if (passwords.newPassword.length < 6) { setLocalError("New password > 6 chars."); setTimeout(() => setLocalError(null), 3000); return; }

        setIsChangingPassword(true);
        try {
            await api.post("/teacher/change-password", { // Use TEACHER endpoint
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword,
            });
            setPopupMessage("Password updated!"); setShowPopup(true); setTimeout(() => setShowPopup(false), 3000);
            setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" }); // Clear fields
        } catch (err) { setLocalError(err.response?.data?.message || "Password update failed."); setTimeout(() => setLocalError(null), 3000); }
        finally { setIsChangingPassword(false); }
    };

    // Save Text Data -> uses LOCAL formData, calls API, triggers CONTEXT refresh
    const handleSave = async () => {
        setIsSavingText(true); setLocalError(null);
        try {
            // Send the current local formData. Backend expects these fields directly for teacher.
            await api.put("/teacher/profile", formData);

            // Trigger a refresh of the profile data in the context AFTER successful save
            await refreshTeacherProfile();

            setPopupMessage("Profile details saved!"); setShowPopup(true);
            setTimeout(() => {
                setShowPopup(false);
                navigate("/teacher/TeacherMainProfile"); // Navigate back to view
            }, 1500);

        } catch (err) { setLocalError(err.response?.data?.message || "Save failed."); setTimeout(() => setLocalError(null), 3000); }
        finally { setIsSavingText(false); }
    };

    // --- Styling & Derived State ---
    const isProcessing = isSavingText || isUploadingImage || isRemovingImage || isChangingPassword || isLoadingFormData;
    const profileImageUrl = getFullTeacherProfileImageUrl(); // Get image URL from context helper

    // --- Render ---
    // Use form loading state for initial spinner
    if (isLoadingFormData) {
        return <div className="min-h-screen flex items-center justify-center"><FiLoader className="animate-spin text-3xl text-blue-500"/></div>;
    }

    // Display context error if initial load failed
    if (!isLoadingTeacherProfile && teacherProfileError) { // Check after initial load attempt
        return <div className="m-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">{`Error loading profile: ${teacherProfileError}`}</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Action Loading Overlay */}
            {(isSavingText || isUploadingImage || isRemovingImage || isChangingPassword) && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-30 flex items-center justify-center z-50">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white"></div>
                </div>
            )}

            {/* Action Errors */}
            <AnimatePresence>
                {localError && (
                    <motion.div initial={{ opacity: 0}} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 relative rounded shadow" role="alert">
                        <p className="font-bold">Error</p><p>{localError}</p>
                        <button onClick={() => setLocalError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3" aria-label="Close error"><span className="text-red-500 text-xl font-bold align-middle">×</span></button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Card */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 relative overflow-hidden">
                {/* Tabs */}
                <div className="flex space-x-1 border-b border-gray-200 mb-6">
                    <button className={`px-6 py-3 font-medium text-sm rounded-t-lg transition-colors ${activeTab === "personal" ? "bg-white text-blue-600 border-b-2 border-blue-500" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`} onClick={() => setActiveTab("personal")}> Personal Details </button>
                    <button className={`px-6 py-3 font-medium text-sm rounded-t-lg transition-colors ${activeTab === "professional" ? "bg-white text-blue-600 border-b-2 border-blue-500" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`} onClick={() => setActiveTab("professional")}> Professional Details </button>
                </div>

                {/* Top Section: Image & Password */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Profile Upload */}
                    <div className="border border-gray-200 p-6 rounded-xl bg-gray-50/50 shadow-sm flex flex-col">
                        <h2 className="font-semibold text-lg text-gray-800 mb-1">Profile Picture</h2>
                        <p className="text-gray-500 text-sm mb-5">Update or remove picture</p>
                        <div className="flex-grow flex flex-col items-center justify-center">
                            <img key={profileImageUrl} /* Use key to force re-render */ src={profileImageUrl} alt="Preview" className="w-24 h-24 rounded-full border-2 border-gray-200 object-cover bg-gray-100 mb-4"/>
                             <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full justify-center pt-2">
                                <label className={`w-full sm:w-auto cursor-pointer text-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" disabled={isProcessing} />
                                    {isUploadingImage ? <FiLoader className='animate-spin inline mr-1'/> : <FiCamera size={14} className='inline -mt-px mr-1'/>} Change
                                </label>
                                <button onClick={handleRemoveImage} disabled={isProcessing || !teacherProfile?.profile?.profilePic} className={`w-full sm:w-auto flex items-center justify-center gap-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-sm font-medium transition-colors ${isProcessing || !teacherProfile?.profile?.profilePic ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    {isRemovingImage ? <FiLoader className='animate-spin'/> : <FiTrash2 size={14} />} Remove
                                </button>
                            </div>
                        </div>
                    </div>
                    {/* Change Password */}
                    <div className="border border-gray-200 p-6 rounded-xl bg-gray-50/50 shadow-sm">
                        <h2 className="font-semibold text-lg text-gray-800">Change Password</h2>
                        <p className="text-gray-500 text-sm mt-1">Update account password</p>
                        <div className="mt-5 space-y-4">
                            {/* Password Inputs */}
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label><input type="password" name="currentPassword" value={passwords.currentPassword} onChange={handlePasswordChange} className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg" disabled={isProcessing} required /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">New Password</label><input type="password" name="newPassword" value={passwords.newPassword} onChange={handlePasswordChange} className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg" disabled={isProcessing} required placeholder='Min. 6 characters' /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label><input type="password" name="confirmPassword" value={passwords.confirmPassword} onChange={handlePasswordChange} className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg" disabled={isProcessing} required /></div>
                            {/* Submit Password */}
                             <button onClick={handleChangePassword} disabled={isProcessing || !passwords.currentPassword || !passwords.newPassword || passwords.newPassword.length < 6 || passwords.newPassword !== passwords.confirmPassword} className={`mt-2 w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}>
                                 {isChangingPassword ? <FiLoader className="animate-spin"/> : null} Update Password
                             </button>
                         </div>
                     </div>
                </div>

                {/* --- Tab Content Sections (using local formData) --- */}
                 {activeTab === "personal" && (
                    <div className="border border-gray-200 p-8 rounded-xl mt-6 bg-white shadow-inner">
                        <h2 className="font-semibold text-xl text-gray-800 mb-6">Personal Details</h2>
                        <div className="space-y-6">
                             {/* Inputs use local formData state */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label><input name="fullName" value={formData.fullName || ''} onChange={handleChange} disabled={isProcessing} className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg"/></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Email (Read-only)</label><input type="email" value={teacherProfile?.email || ''} readOnly className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"/></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input name="phone" value={formData.phone || ''} onChange={handleChange} disabled={isProcessing} className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg"/></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label><input type="date" name="dob" value={formData.dob || ''} onChange={handleChange} disabled={isProcessing} className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg"/></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Gender</label><select name="gender" value={formData.gender || ''} onChange={handleChange} disabled={isProcessing} className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg"><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><input name="address" value={formData.address || ''} onChange={handleChange} disabled={isProcessing} className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg"/></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">City</label><input name="city" value={formData.city || ''} onChange={handleChange} disabled={isProcessing} className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg"/></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">State</label><input name="state" value={formData.state || ''} onChange={handleChange} disabled={isProcessing} className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg"/></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Country</label><input name="country" value={formData.country || ''} onChange={handleChange} disabled={isProcessing} className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg"/></div>
                            </div>
                            {/* Save Button */}
                             <button onClick={handleSave} disabled={isProcessing} className={`mt-6 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`} >
                                {isSavingText ? <FiLoader className="animate-spin"/> : <FiSave />} Save Personal Details
                            </button>
                        </div>
                    </div>
                )}

                 {activeTab === "professional" && (
                    <div className="border border-gray-200 p-8 rounded-xl mt-6 bg-white shadow-inner">
                        <h2 className="font-semibold text-xl text-gray-800 mb-6">Professional Details</h2>
                         <div className="space-y-6">
                            {/* Inputs use local formData state */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label><input name="qualification" value={formData.qualification || ''} onChange={handleChange} disabled={isProcessing} className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg"/></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Experience (Years)</label><input name="experience" value={formData.experience || ''} onChange={handleChange} disabled={isProcessing} className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg"/></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Subjects Taught</label><input name="subjects" value={formData.subjects || ''} onChange={handleChange} disabled={isProcessing} className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg"/></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">School Name</label><input name="schoolName" value={formData.schoolName || ''} onChange={handleChange} disabled={isProcessing} className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg"/></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Designation</label><input name="designation" value={formData.designation || ''} onChange={handleChange} disabled={isProcessing} className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg"/></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Skills</label><input name="skills" value={formData.skills || ''} onChange={handleChange} disabled={isProcessing} className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg"/></div>
                            </div>
                             {/* Save Button */}
                             <button onClick={handleSave} disabled={isProcessing} className={`mt-6 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`} >
                                {isSavingText ? <FiLoader className="animate-spin"/> : <FiSave />} Save Professional Details
                            </button>
                        </div>
                    </div>
                )}
            </div> {/* End Main Card */}

            {/* Success Popup */}
            <AnimatePresence>
                {showPopup && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-green-600 text-white shadow-lg px-6 py-3 rounded-lg flex items-center z-50">
                         {/* Checkmark Icon */}
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"> <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /> </svg>
                         {popupMessage}
                     </motion.div>
                 )}
             </AnimatePresence>

        </div> // End Container
    );
};

export default TeacherEditProfile;