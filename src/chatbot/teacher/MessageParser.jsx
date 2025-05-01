// src/chatbot/teacher/MessageParser.jsx
import React from 'react';

const MessageParser = ({ children, actions }) => {
  const parse = (message) => {
    console.log('User message:', message); // Log user input
    // Simple pass-through to ActionProvider for now
     actions.handleTeacherQuery(message.toLowerCase()); // Convert to lowercase for matching
  };

  return (
    <div>
      {React.Children.map(children, (child) => {
        return React.cloneElement(child, {
          parse: parse,
          actions,
        });
      })}
    </div>
  );
};

export default MessageParser;