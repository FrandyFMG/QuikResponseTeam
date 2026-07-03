// Edit this file to add, remove, or change canned responses.
// Format: id, title, category, text
// Tip: keep each id unique. Example id: "sap-password-reset".

window.RESPONSES = [
  {
    id: "password-reset-done",
    title: "Password Reset Done",
    category: "Accounts",
    text: "Hi,\n\nYour password has been reset. Please wait a few minutes before trying to sign in again.\n\nRegards,\nFrandy"
  },
  {
    id: "account-unlocked",
    title: "Account Unlocked",
    category: "Accounts",
    text: "Hi,\n\nYour account has been unlocked. Please try signing in again and let us know if you still have issues.\n\nRegards,\nFrandy"
  },
  {
    id: "mfa-reregistration",
    title: "MFA Re-registration",
    category: "MFA",
    text: "Hi,\n\nWe have reset your MFA registration. Please sign in again and follow the prompts to set up Microsoft Authenticator.\n\nRegards,\nFrandy"
  },
  {
    id: "ticket-update-request",
    title: "Ticket Update Request",
    category: "ServiceNow",
    text: "Hi,\n\nWe are checking this ticket and will provide an update as soon as possible.\n\nRegards,\nFrandy"
  },
  {
    id: "need-more-information",
    title: "Need More Information",
    category: "ServiceNow",
    text: "Hi,\n\nCould you please provide more details or a screenshot of the error so we can investigate further?\n\nRegards,\nFrandy"
  },
  {
    id: "resolved-closing-note",
    title: "Resolved Closing Note",
    category: "ServiceNow",
    text: "Issue has been resolved. Closing this ticket. Please reopen or submit a new ticket if further assistance is needed."
  },
  {
    id: "sap-password-reset",
    title: "SAP Password Reset",
    category: "SAP",
    text: "Hi,\n\nYour SAP password has been reset. Please wait 15 minutes before attempting to log in again.\n\nRegards,\nFrandy"
  },
  {
    id: "teams-cache-basic-step",
    title: "Teams Cache Basic Step",
    category: "Teams",
    text: "Hi,\n\nPlease try signing out of Microsoft Teams, close the app completely, then open Teams again and sign back in.\n\nRegards,\nFrandy"
  },
  {
    id: "outlook-web-workaround",
    title: "Outlook Web Workaround",
    category: "Office 365",
    text: "Hi,\n\nAs a workaround, please use Outlook on the web while we continue checking the Outlook desktop app issue.\n\nRegards,\nFrandy"
  },
  {
    id: "thank-you",
    title: "Thank You",
    category: "General",
    text: "Thank you for confirming. We will proceed accordingly.\n\nRegards,\nFrandy"
  }
];
