import axios from 'axios';

const DEPLOYMENT_URL = 'https://dev-stream1.vercel.app';

async function testDeployment() {
  console.log(`Testing deployment at: ${DEPLOYMENT_URL}`);

  // Test 1: Health Check
  try {
    const healthResponse = await axios.get(`${DEPLOYMENT_URL}/health`);
    console.log('✅ Health Check: Success', healthResponse.data);
  } catch (error) {
    console.error('❌ Health Check: Failed', error.message);
  }

  // Test 2: User Sync (POST)
  try {
    const syncResponse = await axios.post(`${DEPLOYMENT_URL}/api/users/sync`);
    console.log('❓ Sync Response:', syncResponse.status, syncResponse.data);
  } catch (error) {
    if (error.response) {
      console.log(`❓ Sync Failed with status ${error.response.status}`);
      console.log('Response body:', error.response.data);
    } else {
      console.error('❌ API Reachability: Failed', error.message);
    }
  }
}

testDeployment();
