// src/studentSide/StudentEditProfile.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSave, FiLoader, FiAlertCircle, FiUser, FiPhone, FiMail, FiHome, FiBook, FiCalendar, FiAward, FiUserCheck, FiDollarSign } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

// Helper to get default structure
const getInitialProfileData = () => ({
     // Include fields the student can edit, match the structure sent/received from backend
     firstName: '', lastName: '', phone: '', dob: '', gender: '', bloodGroup: '', nationality: 'Indian',
     address: '', city: '', state: '', zipCode: '',requestedClassName: '',
     fatherName: '', fatherOccupation: '', fatherPhone: '',
     motherName: '', motherOccupation: '', motherPhone: '',
     guardianName: '', guardianRelation: '', guardianPhone: '',
     medicalConditions: '', allergies: '', regularMedications: '',
     transportRequired: false, transportRoute: '', hostelRequired: false,
     // Fields student usually CANNOT edit are omitted here (e.g., rollNumber, admissionDate, grade, email)
 });

const TeacherAddStudent = () => { // Rename component consistently
    const navigate = useNavigate();
    // No need for classId or studentId params here, uses logged-in user context

    const [formData, setFormData] = useState(getInitialProfileData());
    const [isLoading, setIsLoading] = useState(true); // Start true to load initial data
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [initialEmail, setInitialEmail] = useState(''); // To display read-only email

    // Fetch logged-in student's data
    const fetchProfile = useCallback(async () => {
        setIsLoading(true);
        setError('');
        setSuccessMessage('');
        try {
            const response = await api.get('/student/profile');
            const profileData = response.data.profile || {}; // Get the nested profile object
            const userData = response.data || {};

            // Format DOB for input type="date"
             const dobFormatted = profileData.dob ? new Date(profileData.dob).toISOString().split('T')[0] : "";

             // Set ONLY the editable fields into formData
            setFormData(prev => ({
                 ...getInitialProfileData(), // Start with default structure/keys
                 ...profileData, // Spread fetched profile data
                 dob: dobFormatted, // Overwrite DOB with formatted one
                 // Ensure boolean values are handled correctly if they come back as strings
                 transportRequired: profileData.transportRequired === true || profileData.transportRequired === 'true',
                 hostelRequired: profileData.hostelRequired === true || profileData.hostelRequired === 'true',
            }));
             setInitialEmail(userData.email || ''); // Store email separately for display

         } catch (err) {
            console.error("Error fetching student profile:", err);
            setError(err.response?.data?.message || "Could not load profile data.");
         } finally {
            setIsLoading(false);
         }
     }, []);

     useEffect(() => {
         fetchProfile();
     }, [fetchProfile]);


    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        setError(''); // Clear error on change
        setSuccessMessage('');
    };

     // Handle saving the profile data
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        // Basic Frontend Validations (add more as needed)
        if (!formData.firstName || !formData.lastName || !formData.phone || !formData.dob || !formData.gender || !formData.address || !formData.city || !formData.state || !formData.zipCode || !formData.fatherName || !formData.fatherPhone || !formData.motherName || !formData.motherPhone) {
             setError("Please fill in all required (*) personal, contact, and parent fields.");
             return;
         }
         // Ensure transportRoute is present if transportRequired is true
          if (formData.transportRequired && !formData.transportRoute) {
             setError("Transport Route is required if School Transport is selected.");
             return;
         }

        setIsSaving(true);

        // IMPORTANT: Prepare only the PROFILE sub-document data to send
        const profileDataToSend = { ...formData };
         // Remove fields not part of the editable profile if they accidentally got in
        // delete profileDataToSend.email; // Email shouldn't be in formData now anyway


        try {
            console.log("Submitting student profile update payload:", { profileData: profileDataToSend });
            // Send PUT request to the student's own profile endpoint
             const response = await api.put('/student/profile', { profileData: profileDataToSend });

             console.log("Profile update API response:", response.data);

             if (response.data.success) {
                 setSuccessMessage("Profile updated successfully!");
                 // Optionally update local state again with returned data, though refetch might be safer
                 // setFormData(response.data.user.profile || {}); // Adjust based on response structure
                 // fetchProfile(); // Refetch data to confirm changes
                  setTimeout(() => {
                       navigate('/student/StudentProfile'); // Navigate back to view profile page
                   }, 1500);
             } else {
                 setError(response.data.message || `Failed to update profile.`);
            }

         } catch (err) {
             const errorMsg = err.response?.data?.message || err.message || `An error occurred while saving.`;
             setError(errorMsg);
             console.error("Student Profile Update Error:", {
                 errorMessage: errorMsg,
                 status: err.response?.status,
                 responseData: err.response?.data,
             });
         } finally {
            setIsSaving(false);
         }
    };


  // --- Styling (copied from TeacherAddStudent, slightly adapted) ---
  const inputClass = "w-full px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out";
  const selectClass = `${inputClass} appearance-none`; // Removed custom background image for select
  const textareaClass = `${inputClass} min-h-[80px] resize-none`;
  const checkboxClass = "w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500";
  const labelClass = "block text-xs font-medium text-gray-600 mb-1";
  const sectionHeaderClass = "text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200 flex items-center gap-2";
  const requiredSpan = <span className="text-red-500 ml-0.5">*</span>;

  // Loading State
    if (isLoading) {
        return <div className="p-10 flex justify-center"><FiLoader className="animate-spin text-2xl text-indigo-500"/></div>;
    }

    return (
         <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
             <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">Edit My Profile</h1>

            {/* Display errors/success */}
             <AnimatePresence>
              {error && ( <motion.div initial={{ opacity: 0}} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded text-sm flex items-center justify-between"><span><FiAlertCircle className="inline mr-2"/>{error}</span> <button onClick={() => setError('')}>×</button> </motion.div> )}
              {successMessage && ( <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-3 rounded text-sm flex items-center justify-between"><span><FiUserCheck className="inline mr-2"/>{successMessage}</span> <button onClick={() => setSuccessMessage('')}>×</button> </motion.div> )}
             </AnimatePresence>


              {/* Reusing Form Structure - adapted field names if needed */}
             <motion.form
                  onSubmit={handleSubmit}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="bg-white rounded-lg shadow-md overflow-hidden divide-y divide-gray-200"
              >

                  {/* Personal Information */}
                  <div className="p-5 sm:p-6">
                     <h2 className={sectionHeaderClass}><FiUser/>Personal Information</h2>
                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          <div><label className={labelClass}>First Name {requiredSpan}</label><input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required className={inputClass} /></div>
                          <div><label className={labelClass}>Last Name {requiredSpan}</label><input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required className={inputClass} /></div>
                          <div><label className={labelClass}>Date of Birth {requiredSpan}</label><input type="date" name="dob" value={formData.dob} onChange={handleChange} required className={inputClass} /></div>
                          <div><label className={labelClass}>Gender {requiredSpan}</label><select name="gender" value={formData.gender} onChange={handleChange} required className={selectClass}><option value="">Select...</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select></div>
                          <div><label className={labelClass}>Blood Group</label><select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className={selectClass}><option value="">Select...</option><option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option><option value="AB+">AB+</option><option value="AB-">AB-</option><option value="O+">O+</option><option value="O-">O-</option></select></div>
                          <div><label className={labelClass}>Nationality</label><input type="text" name="nationality" value={formData.nationality} onChange={handleChange} className={inputClass} /></div>
                      </div>
                  </div>

                  {/* Contact Information */}
                   <div className="p-5 sm:p-6">
                      <h2 className={sectionHeaderClass}><FiPhone/>Contact Information</h2>
                       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                           <div>
                               <label className={labelClass}>Email (Read-only)</label>
                               <input type="email" value={initialEmail} readOnly className={`${inputClass} bg-gray-100 cursor-not-allowed`} />
                          </div>
                           <div><label className={labelClass}>Phone {requiredSpan}</label><input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className={inputClass} placeholder="+91 XXXXX XXXXX" /></div>
                           <div className="sm:col-span-2 md:col-span-1"><label className={labelClass}>Address {requiredSpan}</label><input type="text" name="address" value={formData.address} onChange={handleChange} required className={inputClass} placeholder="Street Address" /></div>
                           <div><label className={labelClass}>City {requiredSpan}</label><input type="text" name="city" value={formData.city} onChange={handleChange} required className={inputClass} /></div>
                           <div><label className={labelClass}>State {requiredSpan}</label><input type="text" name="state" value={formData.state} onChange={handleChange} required className={inputClass} /></div>
                           <div><label className={labelClass}>ZIP Code {requiredSpan}</label><input type="text" name="zipCode" value={formData.zipCode} onChange={handleChange} required className={inputClass} placeholder="6-digit PIN" /></div>
                      </div>
                  </div>

                   {/* Academic Info - Display Only */}
                   {/* Academic Info */}
       <div className="p-5 sm:p-6">
           <h2 className={sectionHeaderClass}><FiBook/>Academic Information</h2>
           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
               {/* Read Only fields */}
               {/* Optional: You can display these if needed from fetched data */}
               {/* <div><label className={labelClass}>Roll Number</label><input type="text" value={formData.rollNumber || 'N/A'} readOnly className={`${inputClass} bg-gray-100`} /></div> */}
               {/* <div><label className={labelClass}>Admission Date</label><input type="text" value={formatDate(formData.admissionDate)} readOnly className={`${inputClass} bg-gray-100`} /></div> */}
               {/* <div><label className={labelClass}>Current Grade/Level</label><input type="text" value={formData.currentGrade || 'N/A'} readOnly className={`${inputClass} bg-gray-100`} /></div> */}

               {/* --- ADD THIS DIV FOR REQUESTED CLASS NAME --- */}
                <div className="sm:col-span-2 md:col-span-1"> {/* Allow it to take full width or adjust */}
                    <label htmlFor='requestedClassName' className={labelClass}>
                        Your Class Section {requiredSpan}
                    </label>
                   <input
                        type="text"
                        id='requestedClassName'
                        name="requestedClassName" // Matches state key
                        value={formData.requestedClassName || ''} // Controlled input
                        onChange={handleChange} // Use the existing handler
                        required // Make it required
                         className={inputClass} // Use standard styling
                         placeholder="e.g., 11-A, 10-C, 12-B"
                     />
                     <p className='text-xs text-gray-500 mt-1'>Enter the class name provided by the school.</p>
                 </div>
                {/* ----------------------------------------------- */}

           </div>
       </div>

                  {/* Student usually doesn't edit Roll#, Admission Date, Grade via profile */}
                  {/* <div className="p-5 sm:p-6"> <h2 className={sectionHeaderClass}><FiBook/>Academic Information (Read-only)</h2> ... </div> */}

                   {/* Parent/Guardian Information */}
                  <div className="p-5 sm:p-6">
                     <h2 className={sectionHeaderClass}><FiUser/>Parent/Guardian Information</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                         <div><label className={labelClass}>Father's Name {requiredSpan}</label><input type="text" name="fatherName" value={formData.fatherName} onChange={handleChange} required className={inputClass} /></div>
                         <div><label className={labelClass}>Father's Occupation</label><input type="text" name="fatherOccupation" value={formData.fatherOccupation} onChange={handleChange} className={inputClass} /></div>
                         <div><label className={labelClass}>Father's Phone {requiredSpan}</label><input type="tel" name="fatherPhone" value={formData.fatherPhone} onChange={handleChange} required className={inputClass} /></div>
                         <div><label className={labelClass}>Mother's Name {requiredSpan}</label><input type="text" name="motherName" value={formData.motherName} onChange={handleChange} required className={inputClass} /></div>
                         <div><label className={labelClass}>Mother's Occupation</label><input type="text" name="motherOccupation" value={formData.motherOccupation} onChange={handleChange} className={inputClass} /></div>
                         <div><label className={labelClass}>Mother's Phone {requiredSpan}</label><input type="tel" name="motherPhone" value={formData.motherPhone} onChange={handleChange} required className={inputClass} /></div>
                         {/* Optional Guardian Info */}
                          <hr className="sm:col-span-2 md:col-span-3 my-2 border-gray-100"/>
                          <div><label className={labelClass}>Guardian Name (Optional)</label><input type="text" name="guardianName" value={formData.guardianName} onChange={handleChange} className={inputClass} /></div>
                          <div><label className={labelClass}>Guardian Relation</label><input type="text" name="guardianRelation" value={formData.guardianRelation} onChange={handleChange} className={inputClass} /></div>
                          <div><label className={labelClass}>Guardian Phone</label><input type="tel" name="guardianPhone" value={formData.guardianPhone} onChange={handleChange} className={inputClass} /></div>
                      </div>
                   </div>

                   {/* Medical Information */}
                    <div className="p-5 sm:p-6">
                       <h2 className={sectionHeaderClass}><FiAward/>Medical Information</h2>
                       <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="sm:col-span-1"><label className={labelClass}>Medical Conditions</label><textarea name="medicalConditions" rows={3} value={formData.medicalConditions} onChange={handleChange} className={textareaClass} placeholder="e.g., Asthma, None"/></div>
                          <div className="sm:col-span-1"><label className={labelClass}>Allergies</label><textarea name="allergies" rows={3} value={formData.allergies} onChange={handleChange} className={textareaClass} placeholder="e.g., Dust, Peanuts, None"/></div>
                          <div className="sm:col-span-1"><label className={labelClass}>Regular Medications</label><textarea name="regularMedications" rows={3} value={formData.regularMedications} onChange={handleChange} className={textareaClass} placeholder="e.g., Inhaler, None"/></div>
                       </div>
                    </div>

                    {/* Additional Services */}
                   <div className="p-5 sm:p-6">
                      <h2 className={sectionHeaderClass}><FiDollarSign/>Additional Services</h2>
                      <div className="space-y-4">
                         <div className="flex items-start gap-4 p-3 bg-gray-50/50 rounded-md border border-gray-200">
                              <input type="checkbox" name="transportRequired" checked={formData.transportRequired} onChange={handleChange} className={`${checkboxClass} mt-1`} id="transportCheckbox"/>
                              <div className='flex-1'>
                                  <label htmlFor="transportCheckbox" className="text-sm font-medium text-gray-700">School Transport Required</label>
                                 {formData.transportRequired && (
                                    <div className="mt-2">
                                        <label htmlFor="transportRoute" className={`${labelClass} text-xs`}>Transport Route {requiredSpan}</label>
                                         <input type="text" id="transportRoute" name="transportRoute" value={formData.transportRoute} onChange={handleChange} required className={`${inputClass} text-xs py-1.5`} placeholder="Enter route number/name" />
                                     </div>
                                 )}
                              </div>
                         </div>
                         <div className="flex items-center gap-4 p-3 bg-gray-50/50 rounded-md border border-gray-200">
                              <input type="checkbox" name="hostelRequired" checked={formData.hostelRequired} onChange={handleChange} className={checkboxClass} id="hostelCheckbox"/>
                             <label htmlFor="hostelCheckbox" className="text-sm font-medium text-gray-700">Hostel Accommodation Required</label>
                         </div>
                      </div>
                  </div>

                 {/* Submit Action */}
                 <div className="p-4 bg-gray-50 flex justify-end items-center gap-3">
                      <button type="button" onClick={() => navigate('/student/StudentProfile')} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-100 transition" > Cancel </button>
                      <button
                          type="submit"
                          disabled={isSaving || isLoading}
                          className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                     >
                          {isSaving ? <FiLoader className="animate-spin"/> : <FiSave/>} Save Changes
                      </button>
                 </div>
             </motion.form>
         </div>
     );
 };

 // Rename export consistently
 export default TeacherAddStudent; // Rename this to StudentEditProfile