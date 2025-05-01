import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  FiUploadCloud,
  FiFileText,
  FiTrash2,
  FiDownload,
  FiAlertTriangle,
  FiCheckCircle,
  FiLoader,
  FiArrowLeft,
  FiInbox,
  FiCalendar,
  FiEdit,
} from "react-icons/fi";
import { motion } from "framer-motion";
import api from "../services/api"; // Your configured Axios instance

// --- Helpers ---
const getBackendBaseUrl = () => {
  const apiUrl =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
  return apiUrl.replace(/\/api\/?$/, "");
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (e) {
    return "Invalid Date";
  }
};

// --- Component ---
function TeacherUploadSyllabus() {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);

  // --- State ---
  // IDs
  const [paramClassId, setParamClassId] = useState(null);
  const [paramSubjectId, setParamSubjectId] = useState(null);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");

  // Data
  const [allClasses, setAllClasses] = useState([]);
  const [subjectsForSelectedClass, setSubjectsForSelectedClass] = useState([]);
  const [syllabi, setSyllabi] = useState([]); // <-- CHANGED: Now an array for syllabus files
  const [className, setClassName] = useState("");
  const [subjectName, setSubjectName] = useState("");

  // UI State
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const [isLoadingSyllabi, setIsLoadingSyllabi] = useState(false); // <-- CHANGED: Loading syllabi list
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null); // Store syllabus ID being deleted
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const backendUrl = getBackendBaseUrl();

  // --- Determine Mode and Final IDs ---
  const needsSelection = !paramClassId || !paramSubjectId;
  const finalClassId = paramClassId || selectedClassId;
  const finalSubjectId = paramSubjectId || selectedSubjectId;

  // --- Effect to get IDs from URL ---
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cId = params.get("classId");
    const sId = params.get("subjectId");
    let paramsChanged = false;
    if (cId !== paramClassId) {
      setParamClassId(cId);
      paramsChanged = true;
    }
    if (sId !== paramSubjectId) {
      setParamSubjectId(sId);
      paramsChanged = true;
    }
    if (paramsChanged) {
      if (cId && sId) {
        setSelectedClassId("");
        setSelectedSubjectId("");
        setSubjectsForSelectedClass([]);
      }
      setIsLoadingInitialData(true);
      setError("");
      setSuccessMessage("");
      setSyllabi([]);
      setClassName("");
      setSubjectName("");
    }
  }, [location.search, paramClassId, paramSubjectId]);

  // --- Fetch ALL classes/subjects for dropdowns ---
  const fetchAllClassesAndSubjects = useCallback(async () => {
    if (!needsSelection || !isLoadingInitialData) {
      if (!needsSelection) setIsLoadingInitialData(false);
      return;
    }
    console.log("Fetching all classes/subjects for syllabus selection...");
    setError("");
    try {
      const response = await api.get("/teacher/classes");
      const fetchedClasses = response.data || [];
      const classesWithSubjects = fetchedClasses.filter(
        (cls) => cls.subjects && cls.subjects.length > 0
      );
      setAllClasses(classesWithSubjects);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load class list.");
      setAllClasses([]);
    } finally {
      setIsLoadingInitialData(false);
    }
  }, [needsSelection, isLoadingInitialData]);

  useEffect(() => {
    if (needsSelection) {
      fetchAllClassesAndSubjects();
    }
  }, [needsSelection, fetchAllClassesAndSubjects]);

  // --- Fetch list of syllabi for the selected subject ---
  const fetchSyllabiData = useCallback(async () => {
    // <-- RENAMED and logic changed
    if (!finalClassId || !finalSubjectId) {
      setSyllabi([]);
      setClassName("");
      setSubjectName("");
      return;
    }
    console.log(
      `Fetching syllabi list for Final Class: ${finalClassId}, Final Subject: ${finalSubjectId}`
    );
    setIsLoadingSyllabi(true);
    setError("");
    setSuccessMessage("");

    try {
      // Get Class/Subject names
      let targetClass = allClasses.find((c) => c._id === finalClassId);
      let targetSubject = targetClass?.subjects?.find(
        (s) => s._id === finalSubjectId
      );
      if (!targetClass && !needsSelection) {
        try {
          const classInfoResponse = await api.get(
            `/teacher/classes/${finalClassId}`
          );
          targetClass = classInfoResponse.data;
          targetSubject = targetClass?.subjects?.find(
            (s) => s._id === finalSubjectId
          );
        } catch (nameFetchError) {
          console.error("Could not fetch class/subject names", nameFetchError);
        }
      }
      setClassName(targetClass?.name || "Class");
      setSubjectName(targetSubject?.name || "Subject");

      // Fetch syllabi list
      const response = await api.get(
        `/teacher/classes/${finalClassId}/subjects/${finalSubjectId}/syllabi`
      ); // <-- Use new route
      console.log("Fetched syllabi list:", response.data);
      setSyllabi(response.data || []); // Set the array
    } catch (err) {
      console.error("Error fetching syllabi data:", err);
      setError(err.response?.data?.message || "Failed to load syllabus list.");
      setSyllabi([]);
    } finally {
      setIsLoadingSyllabi(false);
    }
  }, [finalClassId, finalSubjectId, allClasses, needsSelection]);

  useEffect(() => {
    fetchSyllabiData();
  }, [fetchSyllabiData]);

  // --- Update Subject Dropdown ---
  useEffect(() => {
    if (selectedClassId && needsSelection) {
      const selectedClassData = allClasses.find(
        (cls) => cls._id === selectedClassId
      );
      setSubjectsForSelectedClass(selectedClassData?.subjects || []);
      setSelectedSubjectId("");
      setSyllabi([]);
      setClassName(selectedClassData?.name || "");
      setSubjectName("");
    } else if (!selectedClassId && needsSelection) {
      setSubjectsForSelectedClass([]);
      setSelectedSubjectId("");
      setSyllabi([]);
      setClassName("");
      setSubjectName("");
    }
  }, [selectedClassId, allClasses, needsSelection]);

  // --- Handlers ---
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        // 10MB limit example
        setError("File size exceeds 10MB limit.");
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      const allowedTypes = [
        /* ... same as before ... */ "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ];
      if (!allowedTypes.includes(file.type)) {
        setError(
          `Invalid file type (${file.type}). Allowed: PDF, DOC(X), TXT, PPT(X).`
        );
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setError("");
      setSuccessMessage("");
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    // Changed: Now adds to list
    if (!selectedFile || !finalClassId || !finalSubjectId || isUploading)
      return;
    setIsUploading(true);
    setError("");
    setSuccessMessage("");
    const formData = new FormData();
    formData.append("syllabusFile", selectedFile); // Still use 'syllabusFile' key

    try {
      console.log(
        `Uploading syllabus file for Class: ${finalClassId}, Subject: ${finalSubjectId}`
      );
      const response = await api.post(
        `/teacher/classes/${finalClassId}/subjects/${finalSubjectId}/syllabi`, // Use new route
        formData
      );
      console.log("Upload response:", response.data);
      setSyllabi((prev) => [response.data.syllabus, ...prev]); // Add new syllabus to list
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setSuccessMessage(
        `Syllabus "${response.data.syllabus?.originalName}" uploaded!`
      );
    } catch (err) {
      console.error("Error uploading syllabus file:", err);
      setError(
        err.response?.data?.message || "Failed to upload syllabus file."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (syllabusId, syllabusName) => {
    // Changed: Takes syllabus ID
    if (!syllabusId || !finalClassId || !finalSubjectId || isDeleting) return;
    if (
      !window.confirm(
        `Are you sure you want to delete the syllabus file "${syllabusName}"?`
      )
    ) {
      return;
    }
    setIsDeleting(syllabusId);
    setError("");
    setSuccessMessage("");
    try {
      console.log(
        `Deleting syllabus file ${syllabusId} for Class: ${finalClassId}, Subject: ${finalSubjectId}`
      );
      await api.delete(
        `/teacher/classes/${finalClassId}/subjects/${finalSubjectId}/syllabi/${syllabusId}`
      ); // Use new route with ID
      console.log("Deletion successful");
      setSyllabi((prev) => prev.filter((s) => s._id !== syllabusId)); // Remove from list
      setSuccessMessage(`Syllabus "${syllabusName}" deleted!`);
    } catch (err) {
      console.error("Error deleting syllabus file:", err);
      setError(
        err.response?.data?.message || "Failed to delete syllabus file."
      );
    } finally {
      setIsDeleting(null);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Get download URL using the new route structure
  const getDownloadUrl = (syllabusId) => {
    return `/api/teacher/classes/${finalClassId}/subjects/${finalSubjectId}/syllabi/${syllabusId}/download`;
  };

  // --- Render Logic ---
  if (isLoadingInitialData && needsSelection) {
    /* ... loading classes spinner ... */
    return (
      <div className="p-6 min-h-[300px] flex justify-center items-center">
        {" "}
        <FiLoader className="animate-spin text-blue-500 text-3xl" />{" "}
        <span className="ml-3 text-gray-500">Loading classes...</span>{" "}
      </div>
    );
  }
  if (needsSelection && !isLoadingInitialData && allClasses.length === 0) {
    /* ... no classes message ... */
    return (
      <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col items-center justify-center text-center">
        {" "}
        <FiInbox size={60} className="text-gray-300 mb-4" />{" "}
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          No Subjects Found
        </h2>{" "}
        <p className="text-gray-500 mb-4 max-w-md">
          {" "}
          You need to create classes and add subjects before uploading syllabi.{" "}
        </p>{" "}
        <Link
          to="/teacher/TeacherViewSubjects"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg shadow hover:bg-blue-700 transition"
        >
          {" "}
          <FiEdit size={16} /> Go to Subject Management{" "}
        </Link>{" "}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <button
        onClick={() =>
          navigate(paramClassId ? -1 : "/teacher/TeacherViewSubjects")
        }
        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 mb-6 p-2 rounded-md hover:bg-blue-100/50 transition-colors"
      >
        <FiArrowLeft /> Back
      </button>

      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">Manage Syllabi</h1>
          <p className="text-gray-600 mt-1 text-sm">
            {finalClassId && finalSubjectId ? (
              <>
                For Subject:{" "}
                <strong className="text-blue-700">
                  {subjectName || "..."}
                </strong>{" "}
                in Class:{" "}
                <strong className="text-blue-700">{className || "..."}</strong>
              </>
            ) : (
              "Select a class and subject to manage syllabi."
            )}
          </p>
        </div>

        {/* --- Selection Dropdowns (Only if needed) --- */}
        {needsSelection && (
          <div className="p-6 border-b border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-blue-100 rounded-lg bg-blue-50/30">
              {/* Class Dropdown */}
              <div>
                <label
                  htmlFor="classSelectSyllabus"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  1. Select Class
                </label>
                <select
                  id="classSelectSyllabus"
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  disabled={isLoadingInitialData}
                >
                  <option value="">-- Select a Class --</option>
                  {allClasses.map((cls) => (
                    <option key={cls._id} value={cls._id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>
              {/* Subject Dropdown */}
              <div>
                <label
                  htmlFor="subjectSelectSyllabus"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  2. Select Subject
                </label>
                <select
                  id="subjectSelectSyllabus"
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  disabled={
                    !selectedClassId || subjectsForSelectedClass.length === 0
                  }
                >
                  <option value="">-- Select a Subject --</option>
                  {subjectsForSelectedClass.map((sub) => (
                    <option key={sub._id} value={sub._id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
                {!selectedClassId && (
                  <p className="text-xs text-gray-500 mt-1">
                    Select a class first.
                  </p>
                )}
                {selectedClassId && subjectsForSelectedClass.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    No subjects found.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- Main Interaction Area (Only if Class & Subject are Finalized) --- */}
        {finalClassId && finalSubjectId ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
            {/* Upload Section */}
            <div className="lg:col-span-1">
              {/* ... (Upload UI - Same as Materials essentially) ... */}
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                Upload New Syllabus File
              </h2>
              <div
                className={`flex flex-col items-center justify-center w-full p-6 border-2 ${
                  selectedFile ? "border-blue-400" : "border-gray-300"
                } border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition mb-4`}
                onClick={triggerFileInput}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFileChange({ target: e.dataTransfer });
                }}
                onDragOver={(e) => e.preventDefault()}
              >
                <FiUploadCloud
                  className={`w-10 h-10 mb-3 ${
                    selectedFile ? "text-blue-500" : "text-gray-400"
                  }`}
                />
                <p className="mb-2 text-sm text-center text-gray-500">
                  {selectedFile ? (
                    <span className="font-semibold text-blue-700 break-all">
                      {selectedFile.name}
                    </span>
                  ) : (
                    <>
                      <span className="font-semibold">Click to upload</span> or
                      drag & drop
                    </>
                  )}
                </p>
                <p className="text-xs text-gray-500">
                  PDF, DOCX, etc. (Max 10MB)
                </p>
                <input
                  id="syllabus-upload"
                  ref={fileInputRef}
                  name="syllabusFile"
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
                />
              </div>
              {selectedFile && (
                <div className="text-right">
                  {" "}
                  <button
                    onClick={handleUpload}
                    disabled={
                      isUploading || isDeleting !== null || !selectedFile
                    }
                    className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition inline-flex items-center gap-2"
                  >
                    {" "}
                    {isUploading ? (
                      <>
                        {" "}
                        <FiLoader className="animate-spin" /> Uploading...{" "}
                      </>
                    ) : (
                      <>
                        {" "}
                        <FiUploadCloud /> Upload Syllabus{" "}
                      </>
                    )}{" "}
                  </button>{" "}
                </div>
              )}
              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-md shadow-sm text-sm"
                  role="alert"
                >
                  {" "}
                  <div className="flex items-center">
                    {" "}
                    <FiAlertTriangle className="text-red-500 mr-2 flex-shrink-0" />{" "}
                    <span>{error}</span>{" "}
                    <button
                      onClick={() => setError("")}
                      className="ml-auto text-red-500 hover:text-red-700 text-lg font-bold"
                    >
                      ×
                    </button>{" "}
                  </div>{" "}
                </motion.div>
              )}
              {successMessage && !error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded-md shadow-sm text-sm"
                  role="alert"
                >
                  {" "}
                  <div className="flex items-center">
                    {" "}
                    <FiCheckCircle className="text-green-500 mr-2 flex-shrink-0" />{" "}
                    <span>{successMessage}</span>{" "}
                    <button
                      onClick={() => setSuccessMessage("")}
                      className="ml-auto text-green-500 hover:text-green-700 text-lg font-bold"
                    >
                      ×
                    </button>{" "}
                  </div>{" "}
                </motion.div>
              )}
            </div>

            {/* Syllabi List Section */}
            <div className="lg:col-span-2">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                Uploaded Syllabi ({syllabi.length})
              </h2>
              {isLoadingSyllabi ? (
                <div className="space-y-3">
                  {" "}
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="h-16 bg-gray-100 rounded-lg animate-pulse"
                    ></div>
                  ))}{" "}
                </div>
              ) : syllabi.length === 0 ? (
                <div className="text-center py-10 border border-gray-200 border-dashed rounded-lg bg-gray-50">
                  {" "}
                  <FiInbox
                    size={40}
                    className="mx-auto text-gray-300 mb-3"
                  />{" "}
                  <p className="text-sm text-gray-500">
                    No syllabi uploaded yet.
                  </p>{" "}
                </div>
              ) : (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 border-t border-gray-100 pt-4">
                  {syllabi.map((syllabus) => (
                    <motion.div
                      key={syllabus._id}
                      layout
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-grow">
                        <FiFileText className="text-blue-500 text-xl flex-shrink-0" />
                        <div className="min-w-0">
                          <p
                            className="text-sm text-gray-800 font-medium truncate"
                            title={syllabus.originalName}
                          >
                            {" "}
                            {syllabus.originalName}{" "}
                          </p>
                          <p className="text-xs text-gray-500 inline-flex items-center gap-1 mt-1">
                            {" "}
                            <FiCalendar size={12} /> Uploaded:{" "}
                            {formatDate(syllabus.uploadedAt)}{" "}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 mt-2 sm:mt-0 self-end sm:self-center">
                        {/* Use new download route */}
                        <a
                          href={getDownloadUrl(syllabus._id)}
                          className="p-2 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-md transition inline-flex items-center gap-1"
                          title="Download Syllabus"
                        >
                          {" "}
                          <FiDownload size={14} />{" "}
                        </a>
                        <button
                          onClick={() =>
                            handleDelete(syllabus._id, syllabus.originalName)
                          }
                          disabled={isDeleting === syllabus._id || isUploading}
                          className="p-2 text-xs text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded-md transition inline-flex items-center gap-1 disabled:opacity-50"
                          title="Delete Syllabus"
                        >
                          {" "}
                          {isDeleting === syllabus._id ? (
                            <FiLoader className="animate-spin" size={14} />
                          ) : (
                            <FiTrash2 size={14} />
                          )}{" "}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Placeholder if selection is needed but not complete */
          needsSelection &&
          !isLoadingInitialData &&
          allClasses.length > 0 && (
            <div className="text-center p-10 text-gray-500 italic">
              {" "}
              Please select a class and subject above to manage syllabi.{" "}
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default TeacherUploadSyllabus;
