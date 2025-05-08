// src/studentSide/StudentEditProfile.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FiSave, FiLoader, FiAlertCircle, FiUser, FiPhone, FiMail, FiHome,FiUsers,
    FiBook, FiCalendar, FiAward, FiUserCheck, FiDollarSign, FiCamera, FiTrash2, FiHeart, FiGlobe, FiBriefcase, FiMapPin
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import defaultAvatar from '../assets/user.jpg';
import { useProfile } from '../context/ProfileContext'; // <-- IMPORT useProfile hook

// Helper to get default structure for the form data
const getInitialProfileData = () => ({
    firstName: '', lastName: '', phone: '', dob: '', gender: '', bloodGroup: '', nationality: 'Indian',
    address: '', city: '', state: '', zipCode: '', requestedClassName: '',
    fatherName: '', fatherOccupation: '', fatherPhone: '',
    motherName: '', motherOccupation: '', motherPhone: '',
    guardianName: '', guardianRelation: '', guardianPhone: '',
    medicalConditions: '', allergies: '', regularMedications: '',
    transportRequired: false, transportRoute: '', hostelRequired: false,
    profilePic: null // Include profilePic for local state management within the form
});

// Backend Base URL Helper
const getBackendBaseUrl = () => {
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    return apiUrl.replace(/\/api\/?$/, '');
};
const backendBaseUrl = getBackendBaseUrl();

const StudentEditProfile = () => {
    const navigate = useNavigate();
    // Use context to get profile data, loading status, and update function
    const { userProfile, isLoadingProfile, updateUserProfilePic } = useProfile();

    // Local state for the form, initialized with default structure
    const [formData, setFormData] = useState(getInitialProfileData());
    // Separate loading state for initial form population from context
    const [isLoadingFormData, setIsLoadingFormData] = useState(true);
    // State for API call statuses
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [isRemovingImage, setIsRemovingImage] = useState(false);
    // State for feedback messages
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    // State to store non-editable fields like email for display
    const [initialEmail, setInitialEmail] = useState('');

    // Effect to populate the form when the profile data from context is loaded/updated
    useEffect(() => {
        if (!isLoadingProfile && userProfile) {
            const profileData = userProfile.profile || {}; // Get nested profile object safely
            // Format date for the input field
            const dobFormatted = profileData.dob ? new Date(profileData.dob).toISOString().split('T')[0] : "";

            // Update the local form state with data from context
            setFormData({
                ...getInitialProfileData(), // Ensure all keys exist
                ...profileData, // Spread fetched profile data
                dob: dobFormatted, // Use formatted date
                profilePic: profileData.profilePic || null, // Get profile pic path from context
                // Ensure boolean values are correctly typed
                transportRequired: profileData.transportRequired === true || String(profileData.transportRequired) === 'true',
                hostelRequired: profileData.hostelRequired === true || String(profileData.hostelRequired) === 'true',
            });
            setInitialEmail(userProfile.email || ''); // Set display email
            setIsLoadingFormData(false); // Mark form population complete
        } else if (!isLoadingProfile && !userProfile) {
            // Handle case where context finished loading but no profile was found
            setError("Could not load profile data to edit.");
            setIsLoadingFormData(false);
        }
        // Dependency array: React to changes in context loading state and profile data
    }, [userProfile, isLoadingProfile]);

    // Handler for general form input changes
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value // Handle checkbox and other inputs
        }));
        // Clear feedback messages on input change
        setError('');
        setSuccessMessage('');
    };

    // --- Image Management Handlers ---

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Frontend file validation (type and size)
        if (!file.type.startsWith('image/')) {
            setError('Please select a valid image file (JPG, PNG, GIF).');
            setTimeout(() => setError(''), 3000); return;
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            setError('Image file size should not exceed 5MB.');
            setTimeout(() => setError(''), 3000); return;
        }

        setIsUploadingImage(true);
        setError('');
        setSuccessMessage('');
        const uploadFormData = new FormData();
        uploadFormData.append("profileImage", file); // Key must match backend route expectation

        try {
            // Call the student-specific image upload endpoint
            const response = await api.post("/student/profile/image", uploadFormData);

            if (response.data?.success && response.data?.profilePic) {
                const newPicPath = response.data.profilePic;
                // 1. Update the global context state
                updateUserProfilePic(newPicPath);
                // 2. Update the local form state for immediate preview
                setFormData(prev => ({ ...prev, profilePic: newPicPath }));
                setSuccessMessage("Profile picture updated!");
                setTimeout(() => setSuccessMessage(''), 3000); // Auto-clear success message
            } else {
                // Handle backend errors or unexpected responses
                throw new Error(response.data?.message || "Image path missing in API response.");
            }
        } catch (err) {
            console.error("Image Upload Error:", err);
            setError(err.response?.data?.message || err.message || "Failed to upload image. Please try again.");
            setTimeout(() => setError(''), 5000); // Auto-clear error message
        } finally {
            setIsUploadingImage(false);
            // Reset file input visually
            if (e?.target) e.target.value = null;
        }
    };

    const handleRemoveImage = async () => {
        // Check if there is an image to remove (based on form state)
        if (!formData.profilePic) return;

        if (!window.confirm("Are you sure you want to remove your profile picture?")) {
            return;
        }

        setIsRemovingImage(true);
        setError('');
        setSuccessMessage('');
        try {
            // Call the student-specific image delete endpoint
            await api.delete("/student/profile/image");

            // 1. Update the global context state
            updateUserProfilePic(null);
            // 2. Update the local form state
            setFormData(prev => ({ ...prev, profilePic: null }));
            setSuccessMessage("Profile picture removed.");
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            console.error("Image Removal Error:", err);
            setError(err.response?.data?.message || "Failed to remove image. Please try again.");
            setTimeout(() => setError(''), 5000);
        } finally {
            setIsRemovingImage(false);
        }
    };

    // --- Text Profile Data Submission ---

    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent default form submission
        setError('');
        setSuccessMessage('');

        // Frontend Validation (Example - expand as needed)
        if (!formData.firstName || !formData.lastName || !formData.phone || !formData.dob || !formData.gender || !formData.address || !formData.city || !formData.state || !formData.zipCode || !formData.fatherName || !formData.fatherPhone || !formData.motherName || !formData.motherPhone || !formData.requestedClassName) {
            setError("Please fill in all required (*) fields.");
            window.scrollTo(0, 0); // Scroll to top to show error
            return;
        }
        if (formData.transportRequired && !formData.transportRoute) {
            setError("Transport Route is required if School Transport is selected.");
            window.scrollTo(0, 0);
            return;
        }
        // Add other specific validations (phone format, zip code format, etc.)

        setIsSaving(true);

        // Prepare only the allowed profile fields for the PUT request payload
        // Exclude fields the student cannot change (like email, rollNumber, etc.)
        // Also exclude profilePic as it's managed by separate endpoints
        const { profilePic, email, rollNumber, admissionDate, currentGrade, ...profileDataToSend } = formData;

        try {
            // Call the student profile update endpoint
            const response = await api.put('/student/profile', { profileData: profileDataToSend });

            if (response.data.success) {
                setSuccessMessage("Profile details updated successfully!");
                // Optionally trigger context refresh if backend modifies other fields (like fullName)
                // refreshProfile(); // If refreshProfile is exposed by context

                // Navigate back to the profile view page after a short delay
                setTimeout(() => {
                    navigate('/student/StudentProfile');
                }, 1500);
            } else {
                // Handle specific backend validation errors or general failure
                setError(response.data.message || `Failed to update profile details.`);
            }

        } catch (err) {
            console.error("Profile Text Update Error:", err);
            const errorMsg = err.response?.data?.message || err.message || `An error occurred while saving details.`;
            setError(errorMsg);
            window.scrollTo(0, 0); // Scroll to top
        } finally {
            setIsSaving(false);
        }
    };

    // --- Styling Constants ---
    const inputClass = "w-full px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out disabled:bg-gray-100 disabled:cursor-not-allowed";
    const selectClass = `${inputClass} appearance-none`;
    const textareaClass = `${inputClass} min-h-[80px] resize-none`;
    const checkboxClass = "w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 disabled:opacity-50";
    const labelClass = "block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider";
    const sectionHeaderClass = "text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200 flex items-center gap-2";
    const requiredSpan = <span className="text-red-500 ml-0.5">*</span>;

    // Combined processing state for disabling elements
    const isProcessing = isSaving || isUploadingImage || isRemovingImage || isLoadingFormData;

    // Determine image source for preview (use local form state for immediate update)
    const profileImageUrl = formData.profilePic ? `${backendBaseUrl}${formData.profilePic}` : defaultAvatar;

    // Show loading spinner if waiting for initial profile data from context
    if (isLoadingFormData) {
        return (
            <div className="p-10 flex justify-center items-center min-h-[400px]">
                <FiLoader className="animate-spin text-3xl text-indigo-500"/>
            </div>
        );
    }

    // --- Render the Form ---
    return (
        <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">Edit My Profile</h1>

            {/* Feedback Messages Area */}
            <AnimatePresence>
                {error && (
                    <motion.div initial={{ opacity: 0}} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded text-sm flex items-center justify-between shadow-sm">
                        <span className='flex items-center'><FiAlertCircle className="inline mr-2 flex-shrink-0"/>{error}</span>
                        <button onClick={() => setError('')} className="ml-2 text-lg font-bold opacity-70 hover:opacity-100">×</button>
                    </motion.div>
                )}
                {successMessage && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-3 rounded text-sm flex items-center justify-between shadow-sm">
                        <span className='flex items-center'><FiUserCheck className="inline mr-2 flex-shrink-0"/>{successMessage}</span>
                        <button onClick={() => setSuccessMessage('')} className="ml-2 text-lg font-bold opacity-70 hover:opacity-100">×</button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Form Start */}
            <motion.form
                onSubmit={handleSubmit}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-white rounded-lg shadow-md overflow-hidden divide-y divide-gray-200 border border-gray-200/80"
            >
                {/* Profile Picture Section */}
                <div className="p-5 sm:p-6">
                    <h2 className={sectionHeaderClass}><FiCamera/>Profile Picture</h2>
                    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                        <img
                            src={profileImageUrl} // Use derived URL
                            alt="Profile Preview"
                            className="w-24 h-24 rounded-full border-2 border-gray-200 object-cover bg-gray-100 flex-shrink-0"
                            onError={(e) => { if (e.target.src !== defaultAvatar) { e.target.src = defaultAvatar; } }}
                        />
                        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                            <label className={`cursor-pointer w-full sm:w-auto text-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                <input
                                    type="file"
                                    className="hidden"
                                    onChange={handleImageUpload}
                                    accept="image/png, image/jpeg, image/gif"
                                    disabled={isProcessing}
                                />
                                {isUploadingImage ? <FiLoader className="animate-spin inline mr-1"/> : <FiCamera className="inline -mt-px mr-1" size={14}/>}
                                Change Image
                            </label>
                            <button
                                type="button"
                                onClick={handleRemoveImage}
                                disabled={isProcessing || !formData.profilePic} // Disable if no pic or processing
                                className={`flex items-center justify-center w-full sm:w-auto gap-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md text-sm font-medium transition-colors ${isProcessing || !formData.profilePic ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isRemovingImage ? <FiLoader className="animate-spin"/> : <FiTrash2 size={14} />}
                                Remove
                            </button>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-3">Max 5MB. Allowed: JPG, PNG, GIF.</p>
                </div>

                {/* Personal Information Section */}
                <div className="p-5 sm:p-6">
                    <h2 className={sectionHeaderClass}><FiUser/>Personal Information</h2>
                    {/* Grid layout for inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-4">
                        <div><label className={labelClass}>First Name {requiredSpan}</label><input type="text" name="firstName" value={formData.firstName || ''} onChange={handleChange} required disabled={isProcessing} className={inputClass} /></div>
                        <div><label className={labelClass}>Last Name {requiredSpan}</label><input type="text" name="lastName" value={formData.lastName || ''} onChange={handleChange} required disabled={isProcessing} className={inputClass} /></div>
                        <div><label className={labelClass}>Date of Birth {requiredSpan}</label><input type="date" name="dob" value={formData.dob || ''} onChange={handleChange} required disabled={isProcessing} className={inputClass} max={new Date().toISOString().split("T")[0]} /></div>
                        <div><label className={labelClass}>Gender {requiredSpan}</label><select name="gender" value={formData.gender || ''} onChange={handleChange} required disabled={isProcessing} className={selectClass}><option value="">Select Gender...</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select></div>
                        <div><label className={labelClass}>Blood Group</label><select name="bloodGroup" value={formData.bloodGroup || ''} onChange={handleChange} disabled={isProcessing} className={selectClass}><option value="">Select Blood Group...</option><option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option><option value="AB+">AB+</option><option value="AB-">AB-</option><option value="O+">O+</option><option value="O-">O-</option></select></div>
                        <div><label className={labelClass}>Nationality</label><input type="text" name="nationality" value={formData.nationality || ''} onChange={handleChange} disabled={isProcessing} className={inputClass} /></div>
                    </div>
                </div>

                {/* Contact Information Section */}
                <div className="p-5 sm:p-6">
                    <h2 className={sectionHeaderClass}><FiPhone/>Contact Information</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-4">
                        <div>
                            <label className={labelClass}>Email (Read-only)</label>
                            <input type="email" value={initialEmail} readOnly className={`${inputClass} bg-gray-100 cursor-not-allowed`} />
                        </div>
                        <div><label className={labelClass}>Phone {requiredSpan}</label><input type="tel" name="phone" value={formData.phone || ''} onChange={handleChange} required disabled={isProcessing} className={inputClass} placeholder="e.g., +91 XXXXXXXXXX" /></div>
                        <div className="sm:col-span-2 md:col-span-1"><label className={labelClass}>Address {requiredSpan}</label><input type="text" name="address" value={formData.address || ''} onChange={handleChange} required disabled={isProcessing} className={inputClass} placeholder="House No, Street" /></div>
                        <div><label className={labelClass}>City {requiredSpan}</label><input type="text" name="city" value={formData.city || ''} onChange={handleChange} required disabled={isProcessing} className={inputClass} /></div>
                        <div><label className={labelClass}>State {requiredSpan}</label><input type="text" name="state" value={formData.state || ''} onChange={handleChange} required disabled={isProcessing} className={inputClass} /></div>
                        <div><label className={labelClass}>ZIP Code {requiredSpan}</label><input type="text" name="zipCode" value={formData.zipCode || ''} onChange={handleChange} required disabled={isProcessing} className={inputClass} placeholder="e.g., 110011" /></div>
                    </div>
                </div>

                {/* Class Information Section */}
                <div className="p-5 sm:p-6">
                    <h2 className={sectionHeaderClass}><FiBook/>Class Information</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-4">
                        <div className="sm:col-span-1"> {/* Adjust span as needed */}
                            <label htmlFor='requestedClassName' className={labelClass}>
                                Your Current/Requested Class Section {requiredSpan}
                            </label>
                            <input
                                type="text" id='requestedClassName' name="requestedClassName"
                                value={formData.requestedClassName || ''} onChange={handleChange}
                                required disabled={isProcessing} className={inputClass}
                                placeholder="e.g., 10-B, 11-Science A"
                            />
                            <p className='text-xs text-gray-500 mt-1'>Enter the specific class and section assigned by the school.</p>
                        </div>
                        {/* Add placeholders for read-only fields if desired */}
                        {/* <div><label className={labelClass}>Roll Number</label><input value={userProfile?.profile?.rollNumber || 'N/A'} readOnly className={`${inputClass} bg-gray-100 cursor-not-allowed`} /></div> */}
                        {/* <div><label className={labelClass}>Admission Date</label><input value={formatDate(userProfile?.profile?.admissionDate)} readOnly className={`${inputClass} bg-gray-100 cursor-not-allowed`} /></div> */}
                    </div>
                </div>

                {/* Parent/Guardian Information Section */}
                <div className="p-5 sm:p-6">
                    <h2 className={sectionHeaderClass}><FiUsers/>Parent/Guardian Information</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-4">
                        <div><label className={labelClass}>Father's Name {requiredSpan}</label><input type="text" name="fatherName" value={formData.fatherName || ''} onChange={handleChange} required disabled={isProcessing} className={inputClass} /></div>
                        <div><label className={labelClass}>Father's Occupation</label><input type="text" name="fatherOccupation" value={formData.fatherOccupation || ''} onChange={handleChange} disabled={isProcessing} className={inputClass} /></div>
                        <div><label className={labelClass}>Father's Phone {requiredSpan}</label><input type="tel" name="fatherPhone" value={formData.fatherPhone || ''} onChange={handleChange} required disabled={isProcessing} className={inputClass} /></div>
                        <div><label className={labelClass}>Mother's Name {requiredSpan}</label><input type="text" name="motherName" value={formData.motherName || ''} onChange={handleChange} required disabled={isProcessing} className={inputClass} /></div>
                        <div><label className={labelClass}>Mother's Occupation</label><input type="text" name="motherOccupation" value={formData.motherOccupation || ''} onChange={handleChange} disabled={isProcessing} className={inputClass} /></div>
                        <div><label className={labelClass}>Mother's Phone {requiredSpan}</label><input type="tel" name="motherPhone" value={formData.motherPhone || ''} onChange={handleChange} required disabled={isProcessing} className={inputClass} /></div>
                        {/* Optional Guardian Info */}
                        <hr className="sm:col-span-2 md:col-span-3 my-2 border-t border-gray-100"/>
                        <div><label className={labelClass}>Guardian Name (Optional)</label><input type="text" name="guardianName" value={formData.guardianName || ''} onChange={handleChange} disabled={isProcessing} className={inputClass} /></div>
                        <div><label className={labelClass}>Guardian Relation</label><input type="text" name="guardianRelation" value={formData.guardianRelation || ''} onChange={handleChange} disabled={isProcessing} className={inputClass} /></div>
                        <div><label className={labelClass}>Guardian Phone</label><input type="tel" name="guardianPhone" value={formData.guardianPhone || ''} onChange={handleChange} disabled={isProcessing} className={inputClass} /></div>
                    </div>
                </div>

                {/* Medical Information Section */}
                <div className="p-5 sm:p-6">
                    <h2 className={sectionHeaderClass}><FiHeart/>Medical Information</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-5 gap-y-4">
                        <div className="sm:col-span-1"><label className={labelClass}>Medical Conditions</label><textarea name="medicalConditions" rows={3} value={formData.medicalConditions || ''} onChange={handleChange} disabled={isProcessing} className={textareaClass} placeholder="e.g., Asthma, None"/></div>
                        <div className="sm:col-span-1"><label className={labelClass}>Allergies</label><textarea name="allergies" rows={3} value={formData.allergies || ''} onChange={handleChange} disabled={isProcessing} className={textareaClass} placeholder="e.g., Dust, Peanuts, None"/></div>
                        <div className="sm:col-span-1"><label className={labelClass}>Regular Medications</label><textarea name="regularMedications" rows={3} value={formData.regularMedications || ''} onChange={handleChange} disabled={isProcessing} className={textareaClass} placeholder="e.g., Inhaler, None"/></div>
                    </div>
                </div>

                {/* Additional Services Section */}
                <div className="p-5 sm:p-6">
                    <h2 className={sectionHeaderClass}><FiDollarSign/>Additional Services</h2>
                    <div className="space-y-4">
                        {/* Transport */}
                        <div className="flex items-start gap-4 p-3 bg-gray-50/70 rounded-md border border-gray-200/80">
                            <input
                                type="checkbox" name="transportRequired"
                                checked={!!formData.transportRequired} // Ensure boolean value
                                onChange={handleChange} disabled={isProcessing}
                                className={`${checkboxClass} mt-1`} id="transportCheckbox"
                            />
                            <div className='flex-1'>
                                <label htmlFor="transportCheckbox" className="text-sm font-medium text-gray-700 cursor-pointer">School Transport Required</label>
                                {formData.transportRequired && (
                                    <div className="mt-2">
                                        <label htmlFor="transportRoute" className={`${labelClass} text-xs`}>Transport Route {requiredSpan}</label>
                                        <input
                                            type="text" id="transportRoute" name="transportRoute"
                                            value={formData.transportRoute || ''} onChange={handleChange}
                                            required={formData.transportRequired} // Required only if checkbox is checked
                                            disabled={isProcessing}
                                            className={`${inputClass} text-xs py-1.5`} placeholder="Enter route number/name"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Hostel */}
                        <div className="flex items-center gap-4 p-3 bg-gray-50/70 rounded-md border border-gray-200/80">
                            <input
                                type="checkbox" name="hostelRequired"
                                checked={!!formData.hostelRequired} // Ensure boolean value
                                onChange={handleChange} disabled={isProcessing}
                                className={checkboxClass} id="hostelCheckbox"
                            />
                            <label htmlFor="hostelCheckbox" className="text-sm font-medium text-gray-700 cursor-pointer">Hostel Accommodation Required</label>
                        </div>
                    </div>
                </div>

                {/* Submit/Cancel Actions */}
                <div className="p-4 bg-gray-50 flex justify-end items-center gap-3 sticky bottom-0 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={() => navigate('/student/StudentProfile')}
                        disabled={isProcessing}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isProcessing || isLoadingFormData} // Disable if loading initial data too
                        className="inline-flex items-center gap-2 px-5 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? <FiLoader className="animate-spin"/> : <FiSave/>}
                        Save Changes
                    </button>
                </div>
            </motion.form>
            {/* Form End */}
        </div>
    );
};

export default StudentEditProfile;