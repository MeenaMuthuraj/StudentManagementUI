import { useState, useEffect, useRef } from "react"; // Add useRef
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import bgImage from '../assets/Attractive.jpeg'; // Ensure this path is correct

// --- Helper: Default Profile Structure (Matches backend User model) ---
const getDefaultProfileState = () => ({
  _id: null,
  username: '',
  email: '',
  userType: '',
  profile: { // Nested profile object
    fullName: "Guest User",
    profilePic: "/profile.jpg", // Default placeholder image
    phone: "",
    dob: null, // Store as null or formatted string if needed
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
    // Add socialLinks if they are part of the 'profile' subdocument in User model
    // socialLinks: { linkedIn: '', twitter: '', website: '' }
  },
  createdAt: null,
  // Add other top-level fields from your User model if needed (excluding password)
});


const TeacherMainProfile = () => {
  // Use the helper function for a structured initial state
  const [profile, setProfile] = useState(getDefaultProfileState());
  const [isLoading, setIsLoading] = useState(true); // For initial load
  const [isRefreshing, setIsRefreshing] = useState(false); // For background refresh
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Ref to track if this is the very first load vs. a refresh
  const isInitialMount = useRef(true);

  useEffect(() => {
    const fetchProfile = async () => {
      // Use different loading states for initial load vs refresh
      if (isInitialMount.current) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true); // Indicate background refresh
      }
      setError(null);
      console.log("TeacherMainProfile: Fetching profile data...");

      try {
        const response = await api.get('/teacher/profile');
        console.log("TeacherMainProfile: Raw data fetched:", response.data);

        // --- Process fetched data before setting state ---
        const fetchedUserData = response.data;

        // Ensure there's a profile object, create empty if missing
        if (!fetchedUserData.profile) {
            fetchedUserData.profile = {};
            console.warn("TeacherMainProfile: Fetched data missing 'profile' object.");
        }

        // Format DOB if it exists and needs formatting for display consistency
        // Note: Keep raw date object if DetailItem/formatDate handles it
        // if (fetchedUserData.profile.dob) {
        //   try {
        //      // Example: Keep as YYYY-MM-DD string if needed by formatDate
        //      fetchedUserData.profile.dob = new Date(fetchedUserData.profile.dob).toISOString().split('T')[0];
        //   } catch (dateError) {
        //      console.error("Error parsing DOB:", dateError);
        //      fetchedUserData.profile.dob = null; // Set to null if parsing fails
        //   }
        // }

        // --- Single setProfile call with processed data ---
        // Merge with default state to ensure all keys exist, preventing errors
        // if backend omits some null/empty fields
        setProfile(currentProfile => ({
           ...getDefaultProfileState(), // Start with default structure
           ...currentProfile,           // Keep any existing non-fetched data if needed (less likely here)
           ...fetchedUserData,          // Overwrite with fetched top-level data (email, username)
           profile: {                  // Deep merge the profile sub-object
              ...getDefaultProfileState().profile, // Ensure all profile keys exist
              ...(currentProfile.profile || {}),   // Keep existing profile data momentarily
              ...(fetchedUserData.profile || {}),  // Overwrite with new profile data
           }
        }));
        console.log("TeacherMainProfile: Profile state updated.");

      } catch (error) {
        setError("Failed to load profile data.");
        console.error("Error fetching profile:", error.response || error);
        // Consider removing localStorage fallback if API is reliable
        // const savedProfile = JSON.parse(localStorage.getItem("teacherProfile"));
        // if (savedProfile) setProfile(savedProfile);
      } finally {
        setIsLoading(false); // Turn off initial loading spinner
        setIsRefreshing(false); // Turn off background refresh indicator
        isInitialMount.current = false; // Mark initial mount as complete
      }
    };

    fetchProfile();
    // Dependency array: refetch when location state indicates a refresh
  }, [location.state?.refresh]); // Keep this dependency

  // --- Recalculate Completion based on NESTED profile data ---
  const calculateProfileCompletion = () => {
    // List fields that are expected INSIDE the 'profile' object
    const profileFields = [
      'fullName', 'phone', 'dob', 'gender', 'address',
      'qualification', 'experience', 'subjects', 'designation'
      // Add/remove fields as per your definition of "complete"
    ];
    // Also check top-level fields like email if they count
    let completedCount = 0;
    if (profile.email) completedCount++; // Example: Check top-level email

    // Check nested fields
    profileFields.forEach(field => {
      if (profile.profile && profile.profile[field]) { // Check existence within profile obj
        completedCount++;
      }
    });

    // Total fields considered for completion
    const totalFields = profileFields.length + 1; // +1 for email example
    return totalFields > 0 ? Math.round((completedCount / totalFields) * 100) : 0;
  };

  const handleEditProfile = () => {
    // Navigate to the edit page
    navigate("/teacher/TeacherEditProfile");
  };

  // --- Format Date (ensure input is valid) ---
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
        // Handles ISO strings (like from DB) or Date objects
        const date = new Date(dateString);
        // Check if the date is valid after parsing
        if (isNaN(date.getTime())) {
            return "-"; // Return '-' for invalid dates
        }
        const options = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }; // Added UTC timezone hint
        return date.toLocaleDateString('en-US', options);
    } catch (e) {
        console.error("Error formatting date:", dateString, e);
        return "-"; // Fallback for any unexpected error
    }
  };

  // --- Initial Loading Spinner ---
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {/* Keep the spinner for the very first load */}
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // --- Main Profile Display ---
  // Add a subtle indicator for background refresh if desired
  // Or just let content update seamlessly
  return (
    <div className={`min-h-screen transition-opacity duration-300 ${isRefreshing ? 'opacity-75' : 'opacity-100'}`}>
      {/* Keep Error display */}
      {error && (
         <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 mx-4 sm:mx-6 lg:mx-8 rounded">
          <div className="flex justify-between items-center">
            <p>{error}</p>
            <button onClick={() => setError(null)} className="text-red-700 font-bold">
              ×
            </button>
          </div>
        </div>
      )}

      {/* --- Profile Card --- */}
      {/* Use optional chaining (?.) extensively for nested data */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1">
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          {/* Header */}
          <div
            className="h-64 relative bg-cover bg-center"
            style={{
              backgroundImage: `url(${bgImage})`,
              backgroundPosition: "center center"
            }}
          >
            <div className="absolute inset-0 bg-blue-600/20"></div>
            {/* Profile Picture (Access nested profilePic) */}
            <div className="absolute -bottom-16 left-8 w-32 h-32 rounded-full border-4 border-white shadow-xl bg-white overflow-hidden flex items-center justify-center">
               {/* Show placeholder if loading fails or path is invalid */}
                <img
                  // Use profile.profile.profilePic, fallback to default
                  src={profile.profile?.profilePic || getDefaultProfileState().profile.profilePic}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  // More robust error handling for images
                  onError={(e) => {
                      console.warn(`Failed to load profile image: ${e.target.src}`);
                      e.target.onerror = null; // Prevent infinite loop if default also fails
                      e.target.src = getDefaultProfileState().profile.profilePic; // Set to default placeholder
                  }}
                />
            </div>
            {/* Edit button */}
            <div className="absolute bottom-4 right-8">
              <button
                onClick={handleEditProfile}
                disabled={isRefreshing} // Optionally disable button during refresh
                className={`flex items-center gap-2 bg-white text-indigo-600 hover:bg-gray-50 px-4 py-2 rounded-lg shadow-md transition-all hover:shadow-lg ${isRefreshing ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                Edit Profile
              </button>
            </div>
          </div>

          {/* Profile content */}
          <div className="pt-20 pb-8 px-8">
            {/* Top Info */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8">
              <div>
                {/* Access nested fullName, fallback to username */}
                <h1 className="text-3xl font-bold text-gray-800">{profile.profile?.fullName || profile.username || "Teacher"}</h1>
                {/* Access nested designation */}
                <p className="text-lg text-indigo-600 font-medium">{profile.profile?.designation || "Teacher Role"}</p>
                {/* Access nested schoolName */}
                {profile.profile?.schoolName && (
                  <p className="text-gray-500 flex items-center mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                       <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm5 6h2a1 1 0 110 2H9a1 1 0 110-2zm-1-4a1 1 0 10-2 0v2a1 1 0 102 0V6zm6 0a1 1 0 10-2 0v2a1 1 0 102 0V6z" clipRule="evenodd" />
                    </svg>
                    {profile.profile.schoolName}
                  </p>
                )}
                 {/* Profile Completion */}
                 <div className="mt-4">
                   {/* ... (completion logic uses updated calculateProfileCompletion) ... */}
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-500 mr-2">
                        Profile Completion: {calculateProfileCompletion()}%
                      </span>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full transition-width duration-500" // Added transition
                          style={{ width: `${calculateProfileCompletion()}%` }}
                        ></div>
                      </div>
                    </div>
                    {calculateProfileCompletion() < 80 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Complete your profile to improve visibility
                      </p>
                    )}
                  </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Personal details Card */}
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm">
                {/* ... Card Header ... */}
                 <div className="flex items-center mb-4">
                   <div className="bg-indigo-100 p-2 rounded-full mr-3">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                   </div>
                   <h2 className="text-xl font-semibold text-gray-800">Personal Information</h2>
                 </div>
                {/* Access data correctly for DetailItem */}
                <div className="space-y-4 pl-11">
                  {/* Top-level email */}
                  <DetailItem icon="mail" label="Email" value={profile.email} isLoading={isRefreshing} />
                  {/* Nested profile fields */}
                  <DetailItem icon="phone" label="Phone" value={profile.profile?.phone} isLoading={isRefreshing} />
                  <DetailItem icon="calendar" label="Date of Birth" value={formatDate(profile.profile?.dob)} isLoading={isRefreshing} />
                  <DetailItem icon="gender" label="Gender" value={profile.profile?.gender} isLoading={isRefreshing} />
                  <DetailItem icon="location" label="Address" value={profile.profile?.address} isLoading={isRefreshing} />
                  <div className="grid grid-cols-2 gap-4">
                    <DetailItem icon="city" label="City" value={profile.profile?.city} isLoading={isRefreshing} />
                    <DetailItem icon="region" label="State" value={profile.profile?.state} isLoading={isRefreshing} />
                    <DetailItem icon="country" label="Country" value={profile.profile?.country} isLoading={isRefreshing} />
                  </div>
                  {/* Social Links (Ensure socialLinks are part of profile subdoc if displayed here) */}
                  {/* ... (Your social links JSX - check paths like profile.profile?.socialLinks?.linkedIn) ... */}
                </div>
              </div>

              {/* Professional details Card */}
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm">
                 {/* ... Card Header ... */}
                  <div className="flex items-center mb-4">
                   <div className="bg-indigo-100 p-2 rounded-full mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    </div>
                   <h2 className="text-xl font-semibold text-gray-800">Professional Information</h2>
                  </div>
                {/* Access nested profile fields correctly */}
                <div className="space-y-4 pl-11">
                  <DetailItem icon="academic" label="Qualification" value={profile.profile?.qualification} isLoading={isRefreshing} />
                  <DetailItem icon="experience" label="Experience" value={profile.profile?.experience ? `${profile.profile.experience} years` : ""} isLoading={isRefreshing} />
                  <DetailItem icon="book" label="Subjects" value={profile.profile?.subjects} isLoading={isRefreshing} />
                  <DetailItem icon="badge" label="Designation" value={profile.profile?.designation} isLoading={isRefreshing} />
                  <DetailItem icon="skills" label="Skills" value={profile.profile?.skills} isLoading={isRefreshing} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- DetailItem Component (Minor Change) ---
// Pass isRefreshing instead of isLoading to prevent skeleton placeholders on refresh
const DetailItem = ({ icon, label, value, isLoading = false }) => {
  const getIcon = () => {
     // ... (your existing icon logic - no changes needed here) ...
      switch (icon) {
      case 'mail':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
          </svg>
        );
      case 'phone':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
          </svg>
        );
      case 'calendar':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
        );
      case 'gender':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        );
      case 'location':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
        );
      case 'city':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1zm-5 8.274a2 2 0 102 0 2 2 0 00-2 0zm10 0a2 2 0 102 0 2 2 0 00-2 0z" />
          </svg>
        );
      case 'region':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
          </svg>
        );
      case 'country':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
          </svg>
        );
      case 'academic':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
          </svg>
        );
      case 'experience':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
        );
      case 'book':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
          </svg>
        );
      case 'badge':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'skills':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  // Use the isLoading prop for the skeleton only, not the actual display text
  if (isLoading) {
    // This is the skeleton loading state for the DetailItem itself
    return (
      <div className="flex items-start">
        <div className="flex-shrink-0 mt-1 mr-3">
          <div className="h-5 w-5 bg-gray-200 rounded-full animate-pulse"></div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="h-4 w-24 bg-gray-200 rounded mb-2 animate-pulse"></div>
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  // Actual content display
  return (
    <div className="flex items-start">
      <div className="flex-shrink-0 mt-1 mr-3">
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-500 truncate">{label}</p>
        {/* Display the actual value. The parent component handles the refresh */}
        <p className="text-md text-gray-800">{value || "-"}</p>
      </div>
    </div>
  );
};


export default TeacherMainProfile;