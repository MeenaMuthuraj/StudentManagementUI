// src/chatbot/teacher/BotAvatar.jsx
import React from 'react';
import { FiHelpCircle } from 'react-icons/fi'; // Use an appropriate icon

const BotAvatar = () => {
  return (
    <div className="react-chatbot-kit-chat-bot-avatar">
      <div className="react-chatbot-kit-chat-bot-avatar-container bg-indigo-500 rounded-full p-1.5">
        <FiHelpCircle className="react-chatbot-kit-chat-bot-avatar-icon text-white w-5 h-5" />
      </div>
    </div>
  );
};

export default BotAvatar;