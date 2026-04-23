const axios = require('axios');

const DIRECTUS_URL = 'https://directus.neevios.com';
const ADMIN_TOKEN = 'KYe03vXlzO8-P1ec00OzGNJpFSHmyYj3'; // Using the token from .env

const api = axios.create({
  baseURL: DIRECTUS_URL,
  headers: {
    Authorization: `Bearer ${ADMIN_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

async function setup() {
  console.log('Starting Directus Schema Setup...');

  try {
    // 1. Create health_records collection
    console.log('Creating health_records collection...');
    await api.post('/collections', {
      collection: 'health_records',
      schema: {},
      meta: {
        display_template: '{{record_type}}: {{value}} {{unit}}',
        show_by_default: true,
        icon: 'medical_services'
      }
    });

    // Add fields to health_records
    const healthFields = [
      { field: 'user_id', type: 'integer', meta: { interface: 'input' } },
      { field: 'child_id', type: 'integer', meta: { interface: 'input' } },
      { field: 'record_type', type: 'string', meta: { interface: 'input' } },
      { field: 'value', type: 'string', meta: { interface: 'input' } },
      { field: 'unit', type: 'string', meta: { interface: 'input' } },
      { field: 'sub_value', type: 'string', meta: { interface: 'input' } },
      { field: 'date', type: 'timestamp', meta: { interface: 'datetime' } },
      { field: 'notes', type: 'text', meta: { interface: 'input-multiline' } }
    ];

    for (const f of healthFields) {
      await api.post('/fields/health_records', f);
    }

    // 2. Create user_milestones collection
    console.log('Creating user_milestones collection...');
    await api.post('/collections', {
      collection: 'user_milestones',
      schema: {},
      meta: {
        display_template: 'Milestone {{milestone_id}} - {{status}}',
        show_by_default: true,
        icon: 'stars'
      }
    });

    // Add fields to user_milestones
    const milestoneFields = [
      { field: 'user_id', type: 'integer', meta: { interface: 'input' } },
      { field: 'milestone_id', type: 'integer', meta: { interface: 'input' } },
      { field: 'status', type: 'string', meta: { interface: 'select', options: { choices: [{text: 'Achieved', value: 'achieved'}, {text: 'In Progress', value: 'in_progress'}] } } },
      { field: 'achieved_date', type: 'date', meta: { interface: 'datetime' } }
    ];

    for (const f of milestoneFields) {
      await api.post('/fields/user_milestones', f);
    }

    console.log('Schema setup complete!');
  } catch (error) {
    console.error('Setup failed:', error.response?.data || error.message);
  }
}

setup();
