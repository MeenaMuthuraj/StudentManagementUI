// src/chatbot/teacher/TeacherChatbotWidget.jsx
import React from 'react';
import Chatbot from 'react-chatbot-kit';
import 'react-chatbot-kit/build/main.css'; // Import default styles

import config from './config.jsx';
import MessageParser from './MessageParser.jsx';
import ActionProvider from './ActionProvider.jsx';

const TeacherChatbotWidget = () => {
  return (
    <div className="teacher-chatbot-container"> {/* Optional wrapper */}
        <Chatbot
          config={config}
          messageParser={MessageParser}
          actionProvider={ActionProvider}
          // You can optionally add headerText or placeholderText props
          // headerText='Teacher Helper Bot'
          // placeholderText='Ask something...'
         />
     </div>
  );
};

export default TeacherChatbotWidget;