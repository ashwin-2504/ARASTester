// ARAS Domain Defaults
// Default values for ARAS connection and operations

export const ARAS_DEFAULTS = {
  // Default credentials (for development/testing)
  username: 'admin',
  password: 'innovator',

  // Common database names
  database: '',

  // Server URL template
  urlTemplate: 'https://<server>/InnovatorServer/Server/InnovatorServer.aspx'
};

export const ARAS_ACTION_CATEGORIES = {
  CONNECTION: 'Connection',
  CRUD: 'Item Operations',
  LIFECYCLE: 'Lifecycle',
  ASSERTIONS: 'Assertions',
  ADVANCED: 'Advanced'
};
