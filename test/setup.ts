const projectId = 'test-project';

// Set environment variables
process.env.NODE_ENV = 'test';
process.env.GCLOUD_PROJECT = projectId;

// Set global variables
(global as any).projectId = projectId;
