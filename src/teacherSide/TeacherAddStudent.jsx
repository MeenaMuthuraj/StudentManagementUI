// src/teacherSide/TeacherAddStudent.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation,  useParams } from 'react-router-dom';
import { FiSave, FiArrowLeft, FiCheckCircle, FiUser, FiPhone, FiMail, FiHome, FiBook, FiDollarSign, FiCalendar, FiAward, FiLock } from 'react-icons/fi'; // <-- Added FiLock here
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
const TeacherAddStudent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const classId = queryParams.get('classId');
  const studentId = queryParams.get('studentId');
  // --- >>> ADD THIS LINE <<< ---
  console.log("TeacherAddStudent - classId read from URL:", classId);
  // -----------------------------

  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    dob: '',
    gender: '',
    bloodGroup: '',
    nationality: 'Indian',
    
    // Contact Information
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    
    // Academic Information
    rollNumber: '',
    admissionDate: '',
    currentGrade: '',
    previousSchool: '',
    
    // Parent/Guardian Information
    fatherName: '',
    fatherOccupation: '',
    fatherPhone: '',
    motherName: '',
    motherOccupation: '',
    motherPhone: '',
    guardianName: '',
    guardianRelation: '',
    guardianPhone: '',
    
    // Medical Information
    medicalConditions: '',
    allergies: '',
    regularMedications: '',
    
    // Additional Information
    transportRequired: false,
    transportRoute: '',
    hostelRequired: false,
    password: '',
    confirmPassword: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [error, setError] = useState(''); // State variable for form errors
  useEffect(() => {
    if (studentId) {
      setIsEditMode(true);
      // Mock data - replace with actual API call
      setFormData({
        firstName: 'Rahul',
        lastName: 'Sharma',
        dob: '2010-05-15',
        gender: 'Male',
        bloodGroup: 'B+',
        nationality: 'Indian',
        email: 'rahul.sharma@example.com',
        phone: '+919876543210',
        address: '45 Gandhi Nagar',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400001',
        rollNumber: '2023-105',
        admissionDate: '2023-06-01',
        currentGrade: '10',
        previousSchool: 'Delhi Public School',
        fatherName: 'Rajesh Sharma',
        fatherOccupation: 'Engineer',
        fatherPhone: '+919876543211',
        motherName: 'Priya Sharma',
        motherOccupation: 'Doctor',
        motherPhone: '+919876543212',
        medicalConditions: 'None',
        allergies: 'Dust',
        regularMedications: 'None',
        transportRequired: true,
        transportRoute: 'Route 4',
        hostelRequired: false
      });
    }
  }, [studentId]);

  const handleChange = (e) => {
    // ... (handleChange logic - make sure it calls setError('') on change) ...
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
     setError(''); // Clear error on input change
  };

    // Inside TeacherAddStudent component

    const handleSubmit = async (e) => {
      e.preventDefault();
      setError(''); // Clear previous errors
  
      // --- Frontend Validations ---
      if (!isEditMode && formData.password !== formData.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (!isEditMode && formData.password.length < 6) {
          setError("Password must be at least 6 characters long.");
          return;
      }
      if (!classId && !isEditMode) { // Ensure classId exists if adding
          setError("Target class information is missing. Cannot add student.");
          console.error("Missing classId for add operation."); // Log for debugging
          return;
      }
      // Add any other crucial frontend checks here...
  
      setIsLoading(true); // Start loading indicator
  
      try {
        // Prepare payload
        const { confirmPassword, ...studentDataToSend } = formData;
        let response;

        if (isEditMode) {
            // --- PUT Request for Editing ---
            const updatePayload = { studentData: studentDataToSend };
            console.log(`Calling API to update student ${studentId}...`);
            console.log("Submitting student update payload:", updatePayload);
            response = await api.put(`/teacher/students/${studentId}`, updatePayload); // <<< API CALL (Replace endpoint if different)
            console.log("Student update API response:", response.data);
        } else {
            // --- POST Request for Adding ---
            const addPayload = {
                studentData: studentDataToSend, // Includes password
                classId: classId // Make sure classId is valid!
            };
            console.log(`Calling API to add new student to class ${classId}...`);
            console.log("Submitting student add payload:", addPayload);
            response = await api.post('/teacher/students', addPayload); // <<< API CALL
            console.log("Student add API response:", response.data);
        }

        // Check backend response
        if (response.data.success) {
            setIsSuccess(true);
            setTimeout(() => {
                // Navigate back, pass classId in state to re-select class
                 const targetClassId = isEditMode ? classId : response.data.classId || classId; // Use ID from response if available
                 navigate(`/teacher/TeacherClasses`, { state: { updatedClassId: targetClassId } });
            }, 1500);
        } else {
            setError(response.data.message || `Failed to ${isEditMode ? 'update' : 'register'} student.`);
        }

      } catch (err) {
        const errorMsg = err.response?.data?.message || err.message || `An error occurred.`;
        setError(errorMsg);
 
        // --- MODIFY THIS LOG ---
        console.error("Student Submit Error Details:", {
             errorMessage: errorMsg,
             status: err.response?.status,
             responseData: err.response?.data, // Log the whole backend response data
             configData: err.config?.data, // Log the data sent *from* frontend
             fullError: err // Log the full Axios error object if needed
         });
        // ----------------------
    } finally {
        setIsLoading(false);
    }
    };


  // Field styling configuration
  const inputClass = "w-full px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm";
  const selectClass = `${inputClass} appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9Ii82Yjc1OGQiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNNiA5bDYgNiA2LTYiLz48L3N2Zz4=')] bg-no-repeat bg-[center_right_1rem]`;
  const textareaClass = `${inputClass} min-h-[100px] resize-none`;
  const checkboxClass = "w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500";

  return (
    <div className="p-4 sm:p-6 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(`/teacher/TeacherClasses`)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition"
        >
          <FiArrowLeft className="text-lg" />
          <span className="font-medium">Back to Classes</span>
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          {isEditMode ? 'Edit Student Record' : 'Register New Student'}
        </h1>
      </div>

      {/* Form Container */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white rounded-xl shadow-md overflow-hidden"
      >
        <form onSubmit={handleSubmit} className="divide-y divide-gray-200">
          
          {/* Section 1: Personal Information */}
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FiUser className="text-blue-600 text-xl" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Personal Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name*</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className={inputClass}
                  placeholder="Enter first name"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name*</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className={inputClass}
                  placeholder="Enter last name"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth*</label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender*</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                  className={selectClass}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                <select
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                  className={selectClass}
                >
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                <input
                  type="text"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Enter nationality"
                />
              </div>
            </div>
          </div>

                    {/* Section 2.5: Set Initial Credentials (Only in Add Mode) */}
                    {!isEditMode && (
               <div className="p-6">
                 <div className="flex items-center gap-3 mb-6">
                   <div className="p-2 bg-blue-100 rounded-lg"><FiLock className="text-blue-600 text-xl" /></div>
                   <h2 className="text-xl font-semibold text-gray-800">Set Initial Password</h2>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                   <div className="space-y-1">
                     <label className="block text-sm font-medium text-gray-700 mb-1">Password*</label>
                     <input
                       type="password"
                       name="password"
                       value={formData.password}
                       onChange={handleChange}
                       required
                       minLength="6" // Enforce minimum length
                       className={inputClass} // Use your defined input class
                       placeholder="Min. 6 characters"
                     />
                   </div>
                   <div className="space-y-1">
                     <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password*</label>
                     <input
                       type="password"
                       name="confirmPassword"
                       value={formData.confirmPassword}
                       onChange={handleChange}
                       required
                       className={inputClass}
                       placeholder="Re-enter password"
                     />
                   </div>
                 </div>
              </div>
          )}
          {/* --- End Password Section --- */}

          {/* Section 2: Contact Information */}
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FiPhone className="text-blue-600 text-xl" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Contact Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email*</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <FiMail className="h-5 w-5" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className={`${inputClass} pl-10`}
                    placeholder="student@example.com"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone*</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <FiPhone className="h-5 w-5" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className={`${inputClass} pl-10`}
                    placeholder="+91 9876543210"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address*</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  className={inputClass}
                  placeholder="Full address"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">City*</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className={inputClass}
                  placeholder="City name"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">State*</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  required
                  className={inputClass}
                  placeholder="State name"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code*</label>
                <input
                  type="text"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  required
                  className={inputClass}
                  placeholder="PIN code"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Academic Information */}
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FiBook className="text-blue-600 text-xl" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Academic Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number*</label>
                <input
                  type="text"
                  name="rollNumber"
                  value={formData.rollNumber}
                  onChange={handleChange}
                  required
                  className={inputClass}
                  placeholder="School roll number"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Admission Date*</label>
                <input
                  type="date"
                  name="admissionDate"
                  value={formData.admissionDate}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>

            <div className="space-y-1">
               <label className="block text-sm font-medium text-gray-700 mb-1">Current Grade*</label>
               <select
                 name="currentGrade"
                 value={formData.currentGrade}
                 onChange={handleChange}
                 required
                 className={selectClass}
               >
                 <option value="">Select Grade</option>
                 <option value="O">Grade O</option>
                 <option value="A+">Grade A+</option>
                 <option value="A">Grade A</option>
                 <option value="B+">Grade B+</option>
                 <option value="B">Grade B</option>
                 <option value="C+">Grade C+</option>
                 <option value="C">Grade C</option>
                 <option value="FAIL">FAIL</option>
               </select>
            </div>

              <div className="md:col-span-2 space-y-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Previous School</label>
                <input
                  type="text"
                  name="previousSchool"
                  value={formData.previousSchool}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Name of previous school"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Parent/Guardian Information */}
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FiUser className="text-blue-600 text-xl" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Parent/Guardian Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Father's Name*</label>
                <input
                  type="text"
                  name="fatherName"
                  value={formData.fatherName}
                  onChange={handleChange}
                  required
                  className={inputClass}
                  placeholder="Father's full name"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Father's Occupation</label>
                <input
                  type="text"
                  name="fatherOccupation"
                  value={formData.fatherOccupation}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Father's profession"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Father's Phone*</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 text-gray-500 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg">+91</span>
                  <input
                    type="tel"
                    name="fatherPhone"
                    value={formData.fatherPhone}
                    onChange={handleChange}
                    required
                    className={`${inputClass} rounded-l-none`}
                    placeholder="9876543210"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Mother's Name*</label>
                <input
                  type="text"
                  name="motherName"
                  value={formData.motherName}
                  onChange={handleChange}
                  required
                  className={inputClass}
                  placeholder="Mother's full name"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Mother's Occupation</label>
                <input
                  type="text"
                  name="motherOccupation"
                  value={formData.motherOccupation}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Mother's profession"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Mother's Phone*</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 text-gray-500 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg">+91</span>
                  <input
                    type="tel"
                    name="motherPhone"
                    value={formData.motherPhone}
                    onChange={handleChange}
                    required
                    className={`${inputClass} rounded-l-none`}
                    placeholder="9876543210"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Medical Information */}
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FiAward className="text-blue-600 text-xl" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Medical Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Medical Conditions</label>
                <textarea
                  name="medicalConditions"
                  rows={3}
                  value={formData.medicalConditions}
                  onChange={handleChange}
                  className={textareaClass}
                  placeholder="Any existing medical conditions"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
                <textarea
                  name="allergies"
                  rows={3}
                  value={formData.allergies}
                  onChange={handleChange}
                  className={textareaClass}
                  placeholder="Any known allergies"
                />
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Regular Medications</label>
                <textarea
                  name="regularMedications"
                  rows={3}
                  value={formData.regularMedications}
                  onChange={handleChange}
                  className={textareaClass}
                  placeholder="Any regular medications"
                />
              </div>
            </div>
          </div>

          {/* Section 6: Additional Information */}
                   <div className="p-6 border-t border-gray-200">
           <div className="flex items-center gap-3 mb-6">
             <div className="p-2 bg-blue-100 rounded-lg">
               <FiDollarSign className="text-blue-600 text-xl" />
             </div>
             <h2 className="text-xl font-semibold text-gray-800">Additional Services</h2>
           </div>
           
           <div className="space-y-6">
             {/* School Transport Section */}
             <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-gray-50 rounded-lg">
               <div className="flex items-center">
                 <input
                   type="checkbox"
                   name="transportRequired"
                   checked={formData.transportRequired}
                   onChange={handleChange}
                   className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                   id="transportCheckbox"
                 />
                 <label 
                   htmlFor="transportCheckbox" 
                   className="ml-3 text-sm font-medium text-gray-700 cursor-pointer"
                 >
                   School Transport Required
                 </label>
               </div>
               
               {formData.transportRequired && (
                 <div className="flex-1 min-w-[200px]">
                   <label 
                     htmlFor="transportRoute" 
                     className="block text-sm font-medium text-gray-700 mb-1"
                   >
                     Transport Route*
                   </label>
                   <div className="relative">
                     <input
                       type="text"
                       id="transportRoute"
                       name="transportRoute"
                       value={formData.transportRoute}
                       onChange={handleChange}
                       required
                       className="w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg 
                                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                       placeholder="Enter route number/name"
                     />
                     <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                       <FiHome className="text-gray-400" />
                     </div>
                   </div>
                 </div>
               )}
             </div>
          
             {/* Hostel Accommodation Section */}
             <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
               <input
                 type="checkbox"
                 name="hostelRequired"
                 checked={formData.hostelRequired}
                 onChange={handleChange}
                 className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                 id="hostelCheckbox"
               />
               <label 
                 htmlFor="hostelCheckbox" 
                 className="text-sm font-medium text-gray-700 cursor-pointer"
               >
                 Hostel Accommodation Required
               </label>
             </div>
           </div>
        </div>
          {/* Form Actions */}
          <div className="p-6 bg-gray-50 flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition font-medium"
            >
              Cancel
            </button>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              disabled={isLoading}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white ${
                isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
              } transition shadow-md`}
            >
              {isLoading ? (
                'Processing...'
              ) : (
                <>
                  <FiSave /> {isEditMode ? 'Update Student' : 'Register Student'}
                </>
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>

      {/* Success Modal */}
      <AnimatePresence>
        {isSuccess && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center"
            >
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <FiCheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {isEditMode ? 'Update Successful!' : 'Registration Successful!'}
              </h3>
              <p className="text-gray-600 mb-6">
                {formData.firstName} {formData.lastName}'s record has been {isEditMode ? 'updated' : 'created'}.
              </p>
              <div className="flex justify-center">
                <button
                  onClick={() => navigate(`/teacher/classes`)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
                >
                  Return to Class
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TeacherAddStudent;