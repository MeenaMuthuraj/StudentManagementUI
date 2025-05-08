// // src/chatbot/teacher/config.jsx
// import { createChatBotMessage } from 'react-chatbot-kit';
// import BotAvatar from './BotAvatar'; // We'll create this simple avatar component

// const botName = 'Teacher Helper';

// const config = {
//   botName: botName,
//   initialMessages: [
//     createChatBotMessage(`Hi! I'm the ${botName}. How can I help you navigate the teacher portal today?`),
//     createChatBotMessage(
//         "Try asking about: 'view classes', 'upload syllabus', 'upload material', 'mark attendance', 'view profile'",
//         {
//             widget: 'overview', // Optional: We can define custom widgets later if needed
//              delay: 500,
//          }
//      )
//   ],
//   customComponents: {
//      // Replace chat bot avatar component if you want a custom look
//      botAvatar: (props) => <BotAvatar {...props} />,
//      // userAvatar: (props) => <UserAvatar {...props} />, // Optional custom user avatar
//    },
//    // You can add custom styles, widgets, etc. here later
//    // state: { ... }, // If you need complex state within the bot
//    // widgets: [ ... ]
//  };

//  export default config;