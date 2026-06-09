import { writeFileSync } from 'fs';

const apiUrl = process.env.API_URL || 'http://localhost:8080/api';
const dashboardUrl = process.env.DASHBOARD_URL || apiUrl.replace('/api', '');

if (process.env.API_URL) {
  writeFileSync(
    'src/utils/config.ts',
    `export const API_URL = '${apiUrl}';\nexport const DASHBOARD_URL = '${dashboardUrl}';\n`
  );
  console.log(`Config generated: API_URL=${apiUrl}  DASHBOARD_URL=${dashboardUrl}`);
}
