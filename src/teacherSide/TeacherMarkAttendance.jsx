// src/teacherSide/TeacherMarkAttendance.jsx

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  FiCalendar,
  FiUsers,
  FiCheckSquare,
  FiXSquare,
  FiClock,
  FiSave,
  FiLoader,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

// --- Component ---
function TeacherMarkAttendance() {
  const navigate = useNavigate();

  // --- State ---
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  // REMOVED: Subject and Period state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedClassName, setSelectedClassName] = useState(""); // For display

  // --- Constants ---
  const STATUS_OPTIONS = [
    {
      value: "present",
      label: "Present",
      icon: FiCheckSquare,
      color: "text-green-600",
      ringColor: "ring-green-300",
      bgColor: "bg-green-50",
    },
    {
      value: "absent",
      label: "Absent",
      icon: FiXSquare,
      color: "text-red-600",
      ringColor: "ring-red-300",
      bgColor: "bg-red-50",
    },
    {
      value: "late",
      label: "Late",
      icon: FiClock,
      color: "text-orange-500",
      ringColor: "ring-orange-300",
      bgColor: "bg-orange-50",
    },
  ];
  const DEFAULT_STATUS_ON_LOAD = ""; // Mark explicitly

  // --- Fetch Teacher's Classes ---
  const fetchClasses = useCallback(async () => {
    setIsLoadingClasses(true);
    setError("");
    try {
      const response = await api.get("/teacher/classes");
      setClasses(response.data || []);
    } catch (err) {
      setError("Failed to load classes.");
      console.error("Error fetching classes:", err);
    } finally {
      setIsLoadingClasses(false);
    }
  }, []); // Empty array - runs once on mount
  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  // --- Update Class Name & Reset Data on Class Change ---
  useEffect(() => {
    setStudents([]);
    setAttendanceData({});
    setSelectedClassName("");
    if (selectedClassId) {
      const selClass = classes.find((c) => c._id === selectedClassId);
      setSelectedClassName(selClass?.name || "");
    }
  }, [selectedClassId, classes]);

  // --- Fetch Students & Existing Attendance (depends only on Class and Date) ---
  const fetchAttendanceForDate = useCallback(async () => {
    if (!selectedClassId || !selectedDate) {
      setStudents([]);
      setAttendanceData({});
      return; // Don't fetch if class/date not selected
    }
    setIsLoadingAttendance(true);
    setError("");
    setSuccessMessage(""); // Clear messages on new fetch
    const formattedDate = format(selectedDate, "yyyy-MM-dd");
    console.log(
      `Fetching attendance data for Class: ${selectedClassId}, Date: ${formattedDate}`
    );

    try {
      // Fetch students and attendance statuses in parallel
      const [studentsResponse, attendanceResponse] = await Promise.all([
        api.get(`/teacher/classes/${selectedClassId}/students`),
        // Assuming backend endpoint is GET /api/teacher/attendance
        api.get("/teacher/attendance", {
          params: {
            classId: selectedClassId,
            date: formattedDate,
          },
        }),
      ]);

      const actualStudents = studentsResponse.data || [];
      setStudents(actualStudents); // Set student list

      // Extract the attendance status map (assuming backend returns { students: [...], attendanceStatus: {...} } or just the status map)
      const attendanceStatusMap =
        attendanceResponse.data?.attendanceStatus ||
        attendanceResponse.data ||
        {}; // Handle both possible response structures
      console.log("Fetched students:", actualStudents);
      console.log("Fetched Status Map:", attendanceStatusMap);

      // Initialize local attendance state
      const initialAttendance = {};
      (actualStudents || []).forEach((student) => {
        initialAttendance[student._id] =
          attendanceStatusMap[student._id] || DEFAULT_STATUS_ON_LOAD;
      });
      setAttendanceData(initialAttendance);
    } catch (err) {
      console.error("Error fetching attendance/student data:", err);
      // Set a more user-friendly error based on what failed
      setError(
        err.response?.data?.message ||
          "Failed to load student or attendance data."
      );
      setStudents([]); // Clear on error
      setAttendanceData({});
    } finally {
      setIsLoadingAttendance(false);
    }
  }, [selectedClassId, selectedDate]); // Only trigger when classId or selectedDate changes

  // useEffect hook to call the fetch function
  useEffect(() => {
    fetchAttendanceForDate();
  }, [fetchAttendanceForDate]); // Depends on the memoized fetch function

  // --- Handle Status Change ---
  const handleStatusChange = (studentId, status) => {
    setAttendanceData((prevData) => ({ ...prevData, [studentId]: status })); // Create new object reference
    setSuccessMessage("");
    setError("");
  };

  // --- Handle Mark All As Present ---
  const markAllPresent = () => {
    if (students.length === 0) return;
    const allPresentData = students.reduce((acc, student) => {
      acc[student._id] = "present";
      return acc;
    }, {});
    setAttendanceData(allPresentData); // Set the new object
    setError("");
    setSuccessMessage(
      `All ${students.length} students marked as Present (unsaved).`
    );
  };

  // --- Handle Saving Attendance (No change needed here) ---
  const handleSaveAttendance = async () => {
    if (
      !selectedClassId ||
      !selectedDate ||
      Object.keys(attendanceData).length === 0
    ) {
      setError("Select class, date, and mark.");
      return;
    }
    const unmarked = students.filter(
      (s) =>
        !attendanceData[s._id] ||
        !STATUS_OPTIONS.some((opt) => opt.value === attendanceData[s._id])
    );
    if (unmarked.length > 0) {
      setError(`Mark attendance for all ${students.length} students.`);
      return;
    }
    setIsSaving(true);
    setError("");
    setSuccessMessage("");
    const formattedDate = format(selectedDate, "yyyy-MM-dd");
    const payload = {
      classId: selectedClassId,
      date: formattedDate,
      attendance: attendanceData,
    };
    try {
      const response = await api.post("/teacher/attendance", payload); // Use simplified endpoint
      setSuccessMessage(
        response.data.message || "Attendance recorded successfully!"
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-white">
      <h1 className="text-2xl font-bold text-gray-800 pb-4 border-b border-gray-200 mb-2">
        Mark Daily Attendance
      </h1>

      {/* Selection Controls Card */}
      <motion.div
        layout
        className="p-4 sm:p-5 bg-white rounded-xl border border-gray-200 shadow-sm"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 items-end">
          {/* Class Selector */}
          <div>
            {" "}
            <label
              htmlFor="classSelectAtt"
              className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider"
            >
              Class
            </label>{" "}
            <select
              id="classSelectAtt"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0iY3VycmVudENvbG9yIiB2aWV3Qm94PSIwIDAgMTYgMTYiPiA8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xLjYzNiA1LjIzMWEuNzUuNzUgMCAwIDEtMS4wNjEtMS4wNjFsNC41LTQuNWEuNzUuNzUgMCAwIDEgMS4wNjEgMGw0LjUgNC41YS43NS43NSAwIDAgMS0xLjA2MSAxLjA2MUw4LjUgMS43ODEgMy4yODIgNi45NWwtMS40My0xLjQzMS0uMjE1LjIxNmEuNzUuNzUgMCAwIDEgMCAwbDEuNDE0LTEuNDE0ek0xNC4zNjQgMTAuNzY5YS43NS43NSAwIDEgMSAxLjA2MSAxLjA2MWwtNC41IDQuNWEuNzUuNzUgMCAwIDEtMS4wNjEgMEw1LjUgMTEuODM3YS43NS43NSAwIDEgMSAxLjA2MS0xLjA2MWwzLjIxNyAzLjIxN2w0LjU4Ni00LjU4NkExOS42MzEgMTkuNjMxIDE0LjM2NCAxMC43N3oiIGNsaXAtcnVsZT0iZXZlbm9kZCIvIDwvc3ZnPg==')] bg-no-repeat bg-[center_right_0.5rem]"
              disabled={isLoadingClasses}
            >
              {" "}
              <option value="">-- Select Class --</option>{" "}
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.name}
                </option>
              ))}{" "}
            </select>{" "}
          </div>
          {/* Date Selector */}
          <div>
            {" "}
            <label
              htmlFor="dateSelectAtt"
              className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider"
            >
              Date
            </label>{" "}
            <div className="relative">
              {" "}
              <DatePicker
                id="dateSelectAtt"
                selected={selectedDate}
                onChange={(date) => setSelectedDate(date || new Date())}
                dateFormat="yyyy-MM-dd"
                className="w-full pl-3 pr-9 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                maxDate={new Date()}
              />{" "}
              <FiCalendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />{" "}
            </div>{" "}
          </div>
        </div>
      </motion.div>

      {/* Feedback Area */}
      <AnimatePresence>
        {" "}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-2.5 rounded text-sm flex items-center justify-between shadow-sm"
          >
            <span>
              <FiAlertCircle className="inline mr-1.5" />
              {error}
            </span>{" "}
            <button
              onClick={() => setError("")}
              className="text-lg font-bold opacity-70 hover:opacity-100"
            >
              ×
            </button>{" "}
          </motion.div>
        )}{" "}
      </AnimatePresence>
      <AnimatePresence>
        {" "}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-green-100 border-l-4 border-green-500 text-green-700 px-4 py-2.5 rounded text-sm flex items-center justify-between shadow-sm"
          >
            <span>
              <FiCheckCircle className="inline mr-1.5" />
              {successMessage}
            </span>{" "}
            <button
              onClick={() => setSuccessMessage("")}
              className="text-lg font-bold opacity-70 hover:opacity-100"
            >
              ×
            </button>{" "}
          </motion.div>
        )}{" "}
      </AnimatePresence>

      {/* Attendance Table/List Area */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[400px]">
        {/* Conditional Rendering Logic */}
        {isLoadingClasses ? (
          <div className="p-10 text-center text-gray-500 text-sm">
            Loading classes...
          </div>
        ) : !selectedClassId ? (
          <div className="p-10 text-center text-gray-400 italic text-sm">
            Please select a class to mark attendance.
          </div>
        ) : isLoadingAttendance ? (
          <div className="p-10 flex justify-center items-center text-gray-500 text-sm">
            <FiLoader className="animate-spin mr-3" />
            Loading students...
          </div>
        ) : students.length === 0 ? (
          <div className="text-center p-10 text-gray-500">
            <FiUsers className="mx-auto text-4xl text-gray-300 mb-2" />
            <p className="text-sm font-medium">
              No students found in{" "}
              <span className="font-semibold">{selectedClassName}</span>.
            </p>
          </div>
        ) : (
          /* Render table */
          <>
            <div className="px-4 py-3 border-b bg-gray-50 flex flex-wrap justify-between items-center gap-2 sticky top-0 z-10">
              {" "}
              <p className="text-sm font-semibold text-gray-700">
                {" "}
                Students in{" "}
                <span className="text-indigo-600">{selectedClassName}</span> (
                <span className="text-indigo-600">
                  {format(selectedDate, "PPP")}
                </span>
                ){" "}
              </p>{" "}
              <button
                onClick={markAllPresent}
                className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 transition shadow-sm border border-green-200"
              >
                Mark All Present
              </button>{" "}
            </div>
            <div className="overflow-x-auto">
              {" "}
              <table className="min-w-full divide-y divide-gray-200">
                {" "}
                <thead className="bg-gray-100 top-[49px]">
                  <tr>
                    <th className="w-[50%] px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>{" "}
                <tbody className="bg-white divide-y divide-gray-100">
                  {students.map((student) => (
                    <tr
                      key={student._id}
                      className="hover:bg-indigo-50/30 transition duration-100 ease-in-out"
                    >
                      <td className="px-4 sm:px-6 py-3 whitespace-nowrap align-middle">
                        {" "}
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {student.profile?.fullName || student.email || "N/A"}
                        </p>
                      </td>
                      <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-center align-middle">
                        {" "}
                        <div className="flex justify-center items-center space-x-1.5 sm:space-x-2">
                          {" "}
                          {STATUS_OPTIONS.map((statusOption) => {
                            const isChecked =
                              attendanceData[student._id] ===
                              statusOption.value;
                            return (
                              <button
                                type="button"
                                key={statusOption.value}
                                onClick={() =>
                                  handleStatusChange(
                                    student._id,
                                    statusOption.value
                                  )
                                }
                                title={statusOption.label}
                                className={`flex items-center justify-center gap-1.5 sm:gap-2 p-1.5 sm:w-24 text-xs rounded-full border transition-all duration-150 ${
                                  isChecked
                                    ? `text-white font-semibold shadow ${
                                        statusOption.value === "present"
                                          ? "bg-green-500 border-green-600"
                                          : statusOption.value === "absent"
                                          ? "bg-red-500 border-red-600"
                                          : "bg-orange-500 border-orange-600"
                                      }`
                                    : "bg-white border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700 hover:shadow-sm"
                                }`}
                              >
                                {" "}
                                <statusOption.icon
                                  className={`w-4 h-4 flex-shrink-0 ${
                                    isChecked ? "text-white" : ""
                                  }`}
                                />{" "}
                                <span
                                  className={`hidden sm:inline ${
                                    isChecked ? "font-semibold" : ""
                                  }`}
                                >
                                  {statusOption.label}
                                </span>{" "}
                              </button>
                            );
                          })}{" "}
                        </div>{" "}
                      </td>
                    </tr>
                  ))}
                </tbody>{" "}
              </table>{" "}
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-200 text-right sticky bottom-0 z-10">
              {" "}
              <motion.button
                onClick={handleSaveAttendance}
                disabled={
                  isSaving || isLoadingAttendance || students.length === 0
                }
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 px-5 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {" "}
                {isSaving ? (
                  <FiLoader className="animate-spin -ml-1 mr-2 h-5 w-5" />
                ) : (
                  <FiSave className="-ml-1 mr-2 h-5 w-5" />
                )}{" "}
                Save Attendance{" "}
              </motion.button>{" "}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default TeacherMarkAttendance;
