// src/components/ConfirmationModal.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertTriangle, FiCheck, FiX, FiLoader } from 'react-icons/fi';

const ConfirmationModal = ({
    isOpen,
    onClose, // Function to close the modal
    onConfirm, // Async function to execute on confirmation
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    icon: Icon = FiAlertTriangle,
    iconColor = "text-red-600",
    bgColor = "bg-red-100",
    confirmButtonColor = "bg-red-600 hover:bg-red-700 focus:ring-red-500", // Default confirm style
    isProcessing = false, // Tracks if the onConfirm action is running
}) => {

    const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } };
    const modalVariants = {
        hidden: { scale: 0.9, opacity: 0, y: -30 },
        visible: { scale: 1, opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } },
        exit: { scale: 0.9, opacity: 0, y: -20, transition: { duration: 0.15 } }
    };

    // Handler for the confirmation button click
    const handleConfirm = async () => {
        if (onConfirm && !isProcessing) {
            await onConfirm(); // Execute the passed async action
        }
        // Note: Closing the modal is now handled within the executePublish/executeDelete functions' finally blocks
    };

    // Handler for the backdrop click
    const handleBackdropClick = () => {
        if (!isProcessing) { // Don't close if an action is processing
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="confirm-backdrop" variants={backdropVariants} initial="hidden" animate="visible" exit="exit"
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]" // Ensure high z-index
                    onClick={handleBackdropClick} // Use handler
                >
                    <motion.div
                        key="confirm-modal" variants={modalVariants}
                        className={`bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm text-center relative border border-gray-200 overflow-hidden`}
                        onClick={(e) => e.stopPropagation()} // Prevent backdrop click handler
                    >
                        {/* Icon */}
                        <div className={`mx-auto flex items-center justify-center h-14 w-14 rounded-full ${bgColor} mb-5`}>
                            <Icon className={`h-7 w-7 ${iconColor}`} />
                        </div>
                        {/* Title */}
                        <h3 className="text-xl font-semibold text-gray-800 mb-2"> {title} </h3>
                        {/* Message */}
                        <p className="text-sm text-gray-600 mb-6 whitespace-pre-wrap leading-relaxed"> {message} </p>
                        {/* Action Buttons */}
                        <div className="flex justify-center gap-3 sm:gap-4">
                            {/* Cancel Button */}
                            <motion.button type="button" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}
                                onClick={onClose} // Directly call onClose prop
                                disabled={isProcessing}
                                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white rounded-lg border border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400 disabled:opacity-50 shadow-sm transition"
                            > {cancelText} </motion.button>
                            {/* Confirm Button */}
                            <motion.button type="button" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}
                                onClick={handleConfirm} // Call internal handler
                                disabled={isProcessing}
                                className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 transition ${confirmButtonColor}`}
                            >
                                {isProcessing ? (<FiLoader className="animate-spin" size={16} />) : null}
                                {isProcessing ? 'Processing...' : confirmText}
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmationModal; // Ensure it's a default export if imported without {}
// OR use: export { ConfirmationModal }; // If imported with {}