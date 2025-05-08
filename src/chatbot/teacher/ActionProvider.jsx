// // src/chatbot/teacher/ActionProvider.jsx
// import React from 'react';
// import { createClientMessage, createChatBotMessage } from 'react-chatbot-kit';

// const ActionProvider = ({ createChatBotMessage, setState, children }) => {

//     // --- Our Simple FAQ Logic ---
//     const handleTeacherQuery = (message) => {
//         let botMessage = '';

//         if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
//             botMessage = createChatBotMessage('Hello there! How can I assist you with the teacher portal?');
//         } else if (message.includes('class') || message.includes('subject') || message.includes('view classes')) {
//             botMessage = createChatBotMessage(
//                 "You can view and manage your classes and subjects by clicking on 'My Classes' or 'Subjects' in the sidebar."
//             );
//         } else if (message.includes('upload syllabus') || message.includes('syllabus')) {
//              botMessage = createChatBotMessage(
//                 "To upload a syllabus, go to 'Subjects', select your class, find the subject, and click the 'Syllabus' link next to it. You can then upload files on that page."
//             );
//          } else if (message.includes('upload material') || message.includes('materials') || message.includes('notes') || message.includes('resource')) {
//              botMessage = createChatBotMessage(
//                 "To upload study materials, navigate to 'Subjects', choose the class and subject, then click the 'Materials' link. You can upload multiple files there."
//              );
//          } else if (message.includes('attendance') || message.includes('mark attendance')) {
//             botMessage = createChatBotMessage(
//                 "Use the 'Mark Attendance' link in the sidebar. Select the Class and Date, then mark each student's status and click Save."
//              );
//         } else if (message.includes('profile') || message.includes('edit profile') || message.includes('password')) {
//             botMessage = createChatBotMessage(
//                 "You can view your profile information using the 'My Profile' link in the sidebar. Click 'Edit Profile' on that page to make changes or update your password."
//             );
//         } else if (message.includes('students') || message.includes('view students')) {
//             botMessage = createChatBotMessage(
//                 "To see students enrolled in a specific class, go to 'My Classes' and click on the desired class card to view the student list below it."
//             );
//         } else {
//              // Default fallback message
//              botMessage = createChatBotMessage(
//                  "Sorry, I can only answer basic questions about viewing classes/subjects, uploads, attendance, or profiles. Please try phrasing your question differently."
//             );
//          }

//         // Update the chat state with the bot's response
//         addMessageToState(botMessage);
//     };
//     // ---------------------------

//     const addMessageToState = (botMessage) => {
//          setState((prev) => ({
//             ...prev,
//             messages: [...prev.messages, botMessage],
//         }));
//      };


//      // Put the handleTeacherQuery function into the actions object passed to the MessageParser
//      return (
//          <div>
//              {React.Children.map(children, (child) => {
//                  return React.cloneElement(child, {
//                     actions: {
//                          handleTeacherQuery, // Make the handler available
//                      },
//                  });
//              })}
//          </div>
//      );
//  };

//  export default ActionProvider;