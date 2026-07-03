const RESPONSES = [
  {
    title: "Greeting - Service Desk",
    category: "General",
    description: "Opening message for chats or tickets.",
    text: "Hi, thank you for contacting the Service Desk. I will be assisting you with this request."
  },
  {
    title: "Request More Details",
    category: "General",
    description: "Ask user for missing information.",
    text: "Could you please provide more details about the issue, including any error message, affected application, and when it started?"
  },
  {
    title: "Troubleshooting Started",
    category: "ServiceNow",
    description: "Ticket work note.",
    text: "Troubleshooting has been started. I am reviewing the details provided and checking the possible cause of the issue."
  },
  {
    title: "User Not Available",
    category: "ServiceNow",
    description: "When user is unreachable.",
    text: "Attempted to contact the user but they were unavailable. Awaiting user response to continue troubleshooting."
  },
  {
    title: "Resolved Confirmation",
    category: "ServiceNow",
    description: "Ask user to confirm resolution.",
    text: "Could you please confirm if the issue is now resolved on your end?"
  },
  {
    title: "Closing Note",
    category: "ServiceNow",
    description: "Ticket closure note.",
    text: "Issue has been resolved and confirmed. Ticket will now be closed."
  },
  {
    title: "Password Reset Done",
    category: "Account",
    description: "After password reset.",
    text: "Your password has been reset. Please try signing in again and let us know if you still experience any issue."
  },
  {
    title: "Escalation Note",
    category: "Escalation",
    description: "Escalating to next team.",
    text: "This issue requires further investigation and has been escalated to the appropriate support team. We will update you once we receive feedback."
  }
];
