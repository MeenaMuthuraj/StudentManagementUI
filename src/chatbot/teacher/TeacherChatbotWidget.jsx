// src/chatbot/teacher/TeacherChatbotWidget.jsx
import React, { useState, useRef, useEffect } from 'react';
import { FiSend, FiLoader, FiUser, FiCpu, FiAlertCircle } from 'react-icons/fi'; // Added Alert Icon
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api'; // <--- Use your configured Axios instance

// Named export is assumed based on the previous error
export function TeacherChatbotWidget() { // <--- NAMED EXPORT
    const [messages, setMessages] = useState([
        { sender: 'bot', text: 'Hi Teacher! How can I help you today?' } // More helpful initial message
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const messagesEndRef = useRef(null);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleInputChange = (event) => {
        setInput(event.target.value);
        setError('');
    };

    const handleSend = async () => {
        const userQuery = input.trim();
        if (!userQuery || isLoading) return;

        const newUserMessage = { sender: 'user', text: userQuery };
        setMessages(prevMessages => [...prevMessages, newUserMessage]);
        setInput('');
        setIsLoading(true);
        setError('');

        try {
            console.log(`Sending query to Node backend for AI: ${userQuery}`);

            // Use your configured Axios 'api' instance to call YOUR backend
            const response = await api.post('/ai-chatbot/ask', {
                query: userQuery
            });

            console.log("AI Chatbot Response from Node Backend:", response.data);

            const botMessage = {
                sender: 'bot',
                text: response.data?.answer || "Sorry, I couldn't get a response.",
            };
            setMessages(prevMessages => [...prevMessages, botMessage]);

        } catch (err) {
            console.error("Error calling chatbot backend API:", err);
            const errorMsg = err.response?.data?.answer || err.response?.data?.message || err.message || "Failed to connect to the chatbot service.";
            setError(errorMsg); // Set error state to display message
            // Add error message to chat history for visibility
            const errorMessage = { sender: 'bot', text: `Sorry, an error occurred: ${errorMsg}`};
            setMessages(prevMessages => [...prevMessages, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Enter key
    const handleKeyPress = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSend();
        }
    };

    // --- Render Logic ---
    return (
        <div className="flex flex-col h-full bg-white"> {/* Changed background */}
            {/* Header */}
            <div className="flex-shrink-0 p-3 bg-gradient-to-r from-indigo-600 to-blue-700 text-white flex items-center gap-2 shadow-sm">
                <FiCpu size={18} />
                <h3 className="text-sm font-semibold">Teacher Assistance Bot</h3>
            </div>

            {/* Messages Area */}
            <div className="flex-grow p-3 space-y-3 overflow-y-auto custom-scrollbar bg-gradient-to-br from-gray-50 via-white to-indigo-50/50">
                <AnimatePresence>
                    {messages.map((msg, index) => (
                        <motion.div
                            key={index} // Use index safely as key here as messages only append
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`flex items-end max-w-[85%] gap-1.5`}>
                                {msg.sender === 'bot' && <FiCpu className="text-indigo-500 mb-1 flex-shrink-0 self-start" size={16}/>}
                                <div className={`px-3 py-1.5 rounded-xl text-sm shadow-md ${
                                    msg.sender === 'user'
                                        ? 'bg-blue-500 text-white rounded-br-lg'
                                        : 'bg-white text-gray-800 border border-gray-200 rounded-bl-lg'
                                }`}>
                                    {/* Render text preserving line breaks */}
                                    {msg.text.split('\n').map((line, i, arr) => (<React.Fragment key={i}>{line}{i < arr.length - 1 && <br />}</React.Fragment>))}
                                </div>
                                {msg.sender === 'user' && <FiUser className="text-blue-200 mb-1 flex-shrink-0 self-start" size={16}/>}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {/* Scroll target */}
                <div ref={messagesEndRef} style={{ height: '1px' }} />
            </div>

             {/* Loading Indicator */}
             {isLoading && ( <div className="px-3 py-1 text-xs text-gray-500 italic flex items-center justify-center gap-1 border-t border-gray-100"> <FiLoader className="animate-spin" size={12}/> Bot is thinking... </div> )}

            {/* Error Display */}
            <AnimatePresence>
                {error && (
                    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="p-2 text-xs text-red-600 bg-red-50 border-t border-red-200 flex items-center gap-1">
                        <FiAlertCircle size={14} className='flex-shrink-0'/>
                        <span className="flex-1">{error}</span>
                        <button onClick={() => setError('')} className='font-bold text-base opacity-70 hover:opacity-100 ml-1'>×</button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Input Area */}
            <div className="flex-shrink-0 p-2 border-t border-gray-200 bg-white">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={handleInputChange}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask a question..."
                        className="flex-grow px-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="p-2.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 transition shadow focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500"
                        title="Send message"
                    >
                        <FiSend size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}

// Make sure this named export matches the import in TeacherLayout.jsx
// export default TeacherChatbotWidget; // Incorrect if Layout uses named import