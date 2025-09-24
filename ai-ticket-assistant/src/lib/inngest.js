const { Inngest } = require('inngest');

// This is the correct configuration for local development.
// By omitting the eventKey, the client automatically defaults
// to the Inngest Dev Server running on http://localhost:8288
const inngest = new Inngest({ id: 'ai-ticket-system' });

module.exports = { inngest };
