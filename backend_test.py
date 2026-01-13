import requests
import sys
import time
import json
from datetime import datetime

class V0CloneAPITester:
    def __init__(self, base_url="https://ui-generator"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.results = []

    def run_test(self, name, method, endpoint, expected_status, data=None, timeout=30):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=timeout)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                except:
                    print(f"   Response: {response.text[:200]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")

            self.results.append({
                "test": name,
                "success": success,
                "status_code": response.status_code,
                "expected_status": expected_status,
                "response_preview": response.text[:100] if response.text else ""
            })

            return success, response.json() if success and response.text else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.results.append({
                "test": name,
                "success": False,
                "error": str(e)
            })
            return False, {}

    def test_health_check(self):
        """Test health check endpoint"""
        return self.run_test("Health Check", "GET", "api/health", 200)

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root Endpoint", "GET", "api/", 200)

    def test_generate_ui(self):
        """Test UI generation endpoint"""
        test_prompt = "Create a simple button component with blue background"
        success, response = self.run_test(
            "Generate UI",
            "POST",
            "api/generate",
            200,
            data={"prompt": test_prompt}
        )
        return success, response

    def test_job_status(self, job_id):
        """Test job status endpoint"""
        return self.run_test(
            "Job Status",
            "GET",
            f"api/jobs/{job_id}",
            200
        )

    def test_history(self):
        """Test history endpoint"""
        return self.run_test("History", "GET", "api/history", 200)

def main():
    print("🚀 Starting V0 Clone API Tests")
    print("=" * 50)
    
    tester = V0CloneAPITester()
    
    # Test 1: Health Check
    health_success, _ = tester.test_health_check()
    if not health_success:
        print("❌ Health check failed - API may be down")
        return 1

    # Test 2: Root endpoint
    tester.test_root_endpoint()

    # Test 3: Generate UI
    generate_success, generate_response = tester.test_generate_ui()
    job_id = None
    if generate_success and 'job_id' in generate_response:
        job_id = generate_response['job_id']
        print(f"   Generated job ID: {job_id}")
        
        # Wait a bit for job processing
        print("   Waiting 5 seconds for job processing...")
        time.sleep(5)
        
        # Test 4: Job Status
        tester.test_job_status(job_id)

    # Test 5: History
    tester.test_history()

    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.tests_passed == tester.tests_run:
        print("✅ All tests passed!")
        return 0
    else:
        print("❌ Some tests failed")
        print("\nFailed tests:")
        for result in tester.results:
            if not result.get('success', False):
                print(f"  - {result['test']}: {result.get('error', 'Status code mismatch')}")
        return 1

if __name__ == "__main__":
    sys.exit(main())