import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import user from "../assets/user.jpg"; // Your default placeholder image
import api from "../services/api"; // Your configured Axios instance
// import { AuthContext } from '../context/AuthContext'; // Uncomment if using Auth context for logout

// Helper function to define the initial state structure consistently
const getInitialProfileState = () => ({
    _id: null,
    username: '',
    email: '',
    userType: '',
    profile: { // Nested profile object matching backend schema
        fullName: "",
        profilePic: null, // Initialize as null, will fallback to defaultImage in JSX
        phone: "",
        dob: "", // Use empty string for date input
        gender: "",
        address: "",
        city: "",
        state: "",
        country: "",
        qualification: "",
        experience: "",
        subjects: "",
        schoolName: "",
        designation: "",
        skills: "",
    },
    createdAt: null,
});

const TeacherEditProfile = () => {
    const [activeTab, setActiveTab] = useState("personal");
    const navigate = useNavigate();
    // const { logout } = useContext(AuthContext); // Example context usage
    const defaultImage = user; // Path to the imported default image

    // --- Calculate Backend Base URL ---
    // Ensure VITE_API_BASE_URL is set in your .env (e.g., VITE_API_BASE_URL=http://localhost:5000/api)
    const backendUrlRaw = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    // Remove the trailing '/api' part (and optional slash) to get the actual server root URL
    const backendBaseUrl = backendUrlRaw.replace(/\/api\/?$/, ''); // Should result in http://localhost:5000
    // ---------------------------------

    const [isLoading, setIsLoading] = useState(false); // For API call loading state
    const [error, setError] = useState(null); // For displaying errors
    const [profile, setProfile] = useState(getInitialProfileState); // Use helper for initial state

    const [passwords, setPasswords] = useState({ // State for password fields
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const [showPopup, setShowPopup] = useState(false); // Controls visibility of success popup
    const [popupMessage, setPopupMessage] = useState(""); // Message for the popup

    // --- Effect to Fetch initial profile data ---
    useEffect(() => {
        let isMounted = true; // Prevent state update if component unmounts
        const fetchProfile = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await api.get("/teacher/profile"); // Fetch user data
                if (!isMounted) return;

                const fetchedUserData = response.data;
                console.log("Fetched Profile Data:", fetchedUserData);

                // Set state using nested structure, formatting DOB
                setProfile(prev => {
                    const baseState = getInitialProfileState();
                    const dobFormatted = fetchedUserData.profile?.dob
                        ? new Date(fetchedUserData.profile.dob).toISOString().split('T')[0]
                        : "";

                    return {
                        ...baseState, // Start with default structure
                        ...fetchedUserData, // Overwrite top-level fields (_id, email etc)
                        profile: { // Merge profile sub-object
                            ...(baseState.profile), // Ensure all keys exist
                            ...(fetchedUserData.profile || {}), // Add fetched profile data
                            profilePic: fetchedUserData.profile?.profilePic || null, // Use fetched path or null
                            dob: dobFormatted, // Use formatted DOB
                        }
                    };
                });

            } catch (err) {
                if (!isMounted) return;
                const errorMsg = err.response?.data?.message || "Failed to load profile data. Please refresh.";
                setError(errorMsg);
                console.error("Error fetching profile:", err.response || err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchProfile();

        // Cleanup function runs when component unmounts
        return () => { isMounted = false; };
    }, []); // Empty dependency array means run only once on mount

    // --- Handler for Text Input Changes ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        const profileSubFields = [ // Fields belonging to the nested profile object
            'fullName', 'phone', 'dob', 'gender', 'address', 'city', 'state',
            'country', 'qualification', 'experience', 'subjects', 'schoolName',
            'designation', 'skills'
        ];

        setProfile(prevProfile => {
            if (profileSubFields.includes(name)) {
                // Update field inside the nested profile object
                return { ...prevProfile, profile: { ...prevProfile.profile, [name]: value } };
            } else {
                // Update top-level field (only if needed, e.g., editable username)
                return { ...prevProfile, [name]: value };
            }
        });
    };

    // --- Handler for Password Input Changes ---
    const handlePasswordChange = (e) => {
        setPasswords(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    // --- Handler for Image Upload ---
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        console.log("Selected file:", file);
        if (!file) return;

        // Client-side validation
        if (!file.type.startsWith('image/')) { setError('Please select a valid image file.'); setTimeout(() => setError(null), 3000); return; }
        if (file.size > 5 * 1024 * 1024) { setError('Image file size should not exceed 5MB.'); setTimeout(() => setError(null), 3000); return; }

        setIsLoading(true);
        setError(null);
        const formData = new FormData();
        formData.append("profileImage", file); // Key must match backend

        try {
            const response = await api.post("/teacher/profile/image", formData); // Send FormData
            console.log("Image upload successful, API response:", response.data);

            if (response.data?.profilePic) {
                // Correctly update NESTED state
                setProfile(prev => ({
                    ...prev,
                    profile: { ...prev.profile, profilePic: response.data.profilePic }
                }));
                console.log("Frontend state updated. New profilePic path:", response.data.profilePic);
                setPopupMessage("Profile picture updated!");
                setShowPopup(true);
                setTimeout(() => setShowPopup(false), 2000);
            } else {
                 console.error("Backend response missing expected profilePic path:", response.data);
                 setError("Image uploaded, but failed to get updated path from server.");
                 setTimeout(() => setError(null), 3000);
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || "Failed to upload image";
            setError(errorMessage);
            console.error("Error uploading image:", err.response || err);
            setTimeout(() => setError(null), 3000);
        } finally {
            setIsLoading(false);
            if (e?.target) e.target.value = null; // Reset file input
        }
    };

    // --- Handler for Image Removal ---
    const handleRemoveImage = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await api.delete("/teacher/profile/image"); // Call DELETE endpoint
            console.log("Image removal request successful.");
            // Correctly update NESTED state to null (image tag will use default)
            setProfile(prev => ({
                ...prev,
                profile: { ...prev.profile, profilePic: null } // Set path to null
            }));
            setPopupMessage("Profile picture removed.");
            setShowPopup(true);
            setTimeout(() => setShowPopup(false), 2000);
        } catch (err) {
            const errorMessage = err.response?.data?.message || "Failed to remove image";
            setError(errorMessage);
            console.error("Error removing image:", err.response || err);
            setTimeout(() => setError(null), 3000);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Handler for Password Update ---
    const handleChangePassword = async () => {
        setError(null); // Clear previous error messages
        // Frontend Validations
        if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) { setError("Please fill in all password fields."); setTimeout(() => setError(null), 3000); return; }
        if (passwords.newPassword !== passwords.confirmPassword) { setError("New passwords do not match!"); setTimeout(() => setError(null), 3000); return; }
        if (passwords.newPassword.length < 6) { setError("New password must be at least 6 characters long."); setTimeout(() => setError(null), 3000); return; }
        if (passwords.newPassword === passwords.currentPassword) { setError("New password cannot be the same as the current one."); setTimeout(() => setError(null), 3000); return; }


        setIsLoading(true);
        try {
            // Send POST request to the backend endpoint
            const response = await api.post("/teacher/change-password", {
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword,
            });
            console.log("Password change response:", response.data);

            setPopupMessage("Password updated successfully!"); // Set success message
            setShowPopup(true); // Show popup
            setTimeout(() => setShowPopup(false), 3000); // Hide after 3s
            setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" }); // Clear password fields

        } catch (err) {
            // Handle errors from backend (e.g., incorrect current password)
            const errorMessage = err.response?.data?.message || "Failed to update password";
            setError(errorMessage);
            console.error("Error updating password:", err.response || err);
            setTimeout(() => setError(null), 3000); // Auto-clear error
        } finally {
            setIsLoading(false);
        }
    };

    // --- Handler for Saving Text Profile Data ---
    const handleSave = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const endpoint = "/teacher/profile";
            // Construct payload ONLY with fields from the NESTED profile object
            const profileDataToSend = {
                fullName: profile.profile.fullName,
                phone: profile.profile.phone,
                dob: profile.profile.dob || null,
                gender: profile.profile.gender,
                address: profile.profile.address,
                city: profile.profile.city,
                state: profile.profile.state,
                country: profile.profile.country,
                qualification: profile.profile.qualification,
                experience: profile.profile.experience, // Send as string or convert if backend expects number
                subjects: profile.profile.subjects,
                schoolName: profile.profile.schoolName,
                designation: profile.profile.designation,
                skills: profile.profile.skills,
                // NOTE: Do NOT send profilePic here - it's managed separately
            };

            console.log("Attempting to save profile TEXT data to:", endpoint);
            console.log("TEXT Data being sent:", JSON.stringify(profileDataToSend, null, 2));

            // Send PUT request with the text data
            const response = await api.put(endpoint, profileDataToSend);
            console.log("Save text successful, API response:", response.data);

            // Update NESTED state with the profile data returned from backend
            setProfile(prev => ({
                ...prev, // Keep top-level fields (_id, email etc.)
                profile: { // Merge updated profile data
                    ...(prev.profile || {}), // Keep existing structure
                    ...response.data // Overwrite with data returned from PUT
                }
            }));

            setPopupMessage("Profile details saved successfully!");
            setShowPopup(true);
            // Navigate back to main profile page after showing popup
            setTimeout(() => {
                setShowPopup(false);
                navigate("/teacher/TeacherMainProfile", { state: { refresh: true } }); // Navigate back
            }, 1500);

        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || "Failed to save profile";
            setError(errorMessage);
            console.error("Error saving profile text data:", err.response || err);
            setTimeout(() => setError(null), 3000);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Component Render ---
    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Loading Overlay */}
            {isLoading && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50" aria-busy="true" aria-label="Loading">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                </div>
            )}

            {/* Error Display Banner */}
            {error && (
                <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 relative rounded" role="alert">
                    <p className="font-bold">Error</p>
                    <p>{error}</p>
                    <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3" aria-label="Close error">
                        <span className="text-red-500 text-xl font-bold align-middle">×</span>
                    </button>
                </div>
            )}

            {/* Main Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 relative overflow-hidden"> {/* Added overflow-hidden */}
                {/* Tabs */}
                <div className="flex space-x-1 border-b border-gray-200 mb-6">
                    <button
                        className={`px-6 py-3 font-medium text-sm rounded-t-lg transition-colors ${activeTab === "personal" ? "bg-white text-blue-600 border-b-2 border-blue-500" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
                        onClick={() => setActiveTab("personal")}
                    >
                        Personal Details
                    </button>
                    <button
                        className={`px-6 py-3 font-medium text-sm rounded-t-lg transition-colors ${activeTab === "professional" ? "bg-white text-blue-600 border-b-2 border-blue-500" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
                        onClick={() => setActiveTab("professional")}
                    >
                        Professional Details
                    </button>
                </div>

                {/* Top Section: Profile Image & Password Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Profile Upload Card */}
                    <div className="border border-gray-200 p-6 rounded-xl bg-white shadow-lg flex flex-col"> {/* Use flex-col */}
                        <h2 className="font-semibold text-lg text-gray-800 mb-1">Profile Picture</h2>
                        <p className="text-gray-500 text-sm mb-5">Update or remove your profile picture</p>
                        <div className="flex-grow flex flex-col items-center justify-center"> {/* Center content */}
                            <div className="p-2 rounded-xl flex flex-col items-center space-y-4 w-full">
                                {/* --- Corrected Image Preview --- */}
                                <img
                                    key={profile.profile?.profilePic || defaultImage} // Force re-render on change
                                    src={
                                        profile.profile?.profilePic
                                        ? `${backendBaseUrl}${profile.profile.profilePic}` // Prepend Backend URL
                                        : defaultImage // Use imported default
                                    }
                                    alt="Profile Preview"
                                    className="w-24 h-24 rounded-full border-2 border-gray-200 object-cover bg-gray-100"
                                    onError={(e) => { // Fallback if constructed URL fails
                                        if (e.target.src !== defaultImage) {
                                            console.warn(`Error loading image: ${e.target.src}. Falling back to default.`);
                                            e.target.src = defaultImage;
                                        }
                                    }}
                                />
                                {/* Buttons */}
                                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full justify-center pt-2">
                                    <label className={`w-full sm:w-auto cursor-pointer text-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                        <input type="file" className="hidden" onChange={handleImageUpload} accept="image/png, image/jpeg, image/gif" disabled={isLoading} />
                                        Edit Image
                                    </label>
                                    <button
                                        onClick={handleRemoveImage}
                                        disabled={isLoading || !profile.profile?.profilePic} // Disable if no pic to remove
                                        className={`w-full sm:w-auto px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-sm font-medium transition-colors ${isLoading || !profile.profile?.profilePic ? 'opacity-50 cursor-not-allowed' : ''}`} >
                                        Remove Image
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Change Password Card */}
                    <div className="border border-gray-200 p-6 rounded-xl bg-white shadow-lg">
                        <h2 className="font-semibold text-lg text-gray-800">Change Password</h2>
                        <p className="text-gray-500 text-sm mt-1">Update your account password</p>
                        <div className="mt-5 space-y-4">
                            {/* Inputs and button using `passwords` state */}
                            <div>
                                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                                <input id="currentPassword" type="password" name="currentPassword" placeholder="Enter Current Password" value={passwords.currentPassword} className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" onChange={handlePasswordChange} disabled={isLoading} required />
                            </div>
                            <div>
                                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                <input id="newPassword" type="password" name="newPassword" placeholder="Min. 6 characters" value={passwords.newPassword} className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" onChange={handlePasswordChange} disabled={isLoading} required />
                            </div>
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                                <input id="confirmPassword" type="password" name="confirmPassword" placeholder="Confirm New Password" value={passwords.confirmPassword} className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" onChange={handlePasswordChange} disabled={isLoading} required />
                            </div>
                            <button
                                disabled={isLoading || !passwords.currentPassword || !passwords.newPassword || passwords.newPassword.length < 6 || passwords.newPassword !== passwords.confirmPassword}
                                className={`mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                                onClick={handleChangePassword}
                            >
                                Update Password
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- Tab Content Sections --- */}
                {/* Personal Details Form */}
                {activeTab === "personal" && (
                    <div className="border border-gray-200 p-8 rounded-xl mt-6 bg-white shadow-lg">
                        <h2 className="font-semibold text-xl text-gray-800 mb-6">Personal Details</h2>
                        <div className="space-y-6">
                            {/* Grid for inputs - Ensure 'value' reads from nested state */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <input id="fullName" type="text" name="fullName" value={profile.profile?.fullName || ''} onChange={handleChange} disabled={isLoading} placeholder="Enter your full name" className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100" />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input id="email" type="email" name="email" value={profile.email || ''} readOnly className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                    <input id="phone" type="tel" name="phone" value={profile.profile?.phone || ''} onChange={handleChange} disabled={isLoading} placeholder="Enter phone number" className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100" />
                                </div>
                                <div>
                                    <label htmlFor="dob" className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                                    <input id="dob" type="date" name="dob" value={profile.profile?.dob || ''} onChange={handleChange} disabled={isLoading} className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100" max={new Date().toISOString().split('T')[0]} />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                                    <select id="gender" name="gender" value={profile.profile?.gender || ''} onChange={handleChange} disabled={isLoading} className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100">
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                    <input id="address" type="text" name="address" value={profile.profile?.address || ''} onChange={handleChange} disabled={isLoading} placeholder="Enter address" className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                    <input id="city" type="text" name="city" value={profile.profile?.city || ''} onChange={handleChange} disabled={isLoading} placeholder="Enter city" className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100" />
                                </div>
                                <div>
                                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">State</label>
                                    <input id="state" type="text" name="state" value={profile.profile?.state || ''} onChange={handleChange} disabled={isLoading} placeholder="Enter state" className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100" />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                                <input id="country" type="text" name="country" value={profile.profile?.country || ''} onChange={handleChange} disabled={isLoading} placeholder="Enter country" className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100" />
                            </div>
                            {/* Save Button */}
                            <button
                                className={`mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                                onClick={handleSave}
                                disabled={isLoading} >
                                Save Personal Details
                            </button>
                        </div>
                    </div>
                )}

                {/* Professional Details Form */}
                {activeTab === "professional" && (
                    <div className="border border-gray-200 p-8 rounded-xl mt-6 bg-white shadow-lg">
                        <h2 className="font-semibold text-xl text-gray-800 mb-6">Professional Details</h2>
                        <div className="space-y-6">
                            {/* Inputs - Ensure 'value' reads from nested state */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="qualification" className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
                                    <input id="qualification" type="text" name="qualification" value={profile.profile?.qualification || ''} onChange={handleChange} disabled={isLoading} placeholder="Enter your qualification" className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"/>
                                </div>
                                <div>
                                    <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-1">Experience (Years)</label>
                                    <input id="experience" type="text" name="experience" value={profile.profile?.experience || ''} onChange={handleChange} disabled={isLoading} placeholder="Enter years of experience" className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"/>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="subjects" className="block text-sm font-medium text-gray-700 mb-1">Subjects Taught</label>
                                    <input id="subjects" type="text" name="subjects" value={profile.profile?.subjects || ''} onChange={handleChange} disabled={isLoading} placeholder="Enter subjects you teach" className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"/>
                                </div>
                                <div>
                                    <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
                                    <input id="schoolName" type="text" name="schoolName" value={profile.profile?.schoolName || ''} onChange={handleChange} disabled={isLoading} placeholder="Enter your school name" className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"/>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="designation" className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                                    <input id="designation" type="text" name="designation" value={profile.profile?.designation || ''} onChange={handleChange} disabled={isLoading} placeholder="Enter your designation" className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"/>
                                </div>
                                <div>
                                    <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
                                    <input id="skills" type="text" name="skills" value={profile.profile?.skills || ''} onChange={handleChange} disabled={isLoading} placeholder="Enter your skills" className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"/>
                                </div>
                            </div>
                            {/* Save Button */}
                            <button
                                className={`mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                                onClick={handleSave}
                                disabled={isLoading} >
                                Save Professional Details
                            </button>
                        </div>
                    </div>
                )}

            </div>

            {/* Success Popup */}
            {showPopup && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-green-600 text-white shadow-lg px-6 py-3 rounded-lg flex items-center z-40 animate-bounce"> {/* Added simple animation */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"> <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /> </svg>
                    {popupMessage}
                </div>
            )}

        </div>
    );
};

export default TeacherEditProfile;