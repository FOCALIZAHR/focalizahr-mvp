// scripts/test-apis.js
// Testing script para validar APIs básicas
const API_BASE = process.env.API_BASE || 'http://localhost:3000'

class APITester {
  constructor() {
    this.results = []
    this.authToken = null
  }

  async log(message, type = 'info') {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}`
    console.log(logMessage)
    this.results.push({ timestamp, type, message })
  }

  async makeRequest(method, endpoint, data = null, requiresAuth = false) {
    const url = `${API_BASE}${endpoint}`
    const headers = {
      'Content-Type': 'application/json'
    }

    if (requiresAuth && this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`
    }

    const options = {
      method,
      headers,
      body: data ? JSON.stringify(data) : null
    }

    try {
      const response = await fetch(url, options)
      const responseData = await response.json()
      
      return {
        success: response.ok,
        status: response.status,
        data: responseData
      }
    } catch (error) {
      return {
        success: false,
        status: 0,
        error: error.message
      }
    }
  }

  async testHealthCheck() {
    await this.log('Testing health check endpoint...')
    
    const result = await this.makeRequest('GET', '/api/health')
    
    if (result.success) {
      await this.log('✅ Health check passed', 'success')
      return true
    } else {
      await this.log(`❌ Health check failed: ${result.error}`, 'error')
      return false
    }
  }

  async testAuthentication() {
    await this.log('Testing authentication...')
    
    // Test login with demo credentials
    const loginData = {
      email: 'test@focalizahr.cl',
      password: 'TestPass123'
    }

    const result = await this.makeRequest('POST', '/api/auth/login', loginData)
    
    if (result.success && result.data.token) {
      this.authToken = result.data.token
      await this.log('✅ Authentication successful', 'success')
      return true
    } else {
      await this.log(`❌ Authentication failed: ${result.data?.error || 'Unknown error'}`, 'error')
      return false
    }
  }

  async testCampaignTypes() {
    await this.log('Testing campaign types endpoint...')
    
    const result = await this.makeRequest('GET', '/api/campaign-types')
    
    if (result.success) {
      const types = result.data.campaignTypes || []
      await this.log(`✅ Found ${types.length} campaign types`, 'success')
      
      // Validate expected types
      const expectedSlugs = ['pulso-express', 'experiencia-full']
      const foundSlugs = types.map(t => t.slug)
      
      for (const expectedSlug of expectedSlugs) {
        if (foundSlugs.includes(expectedSlug)) {
          await this.log(`✅ Found expected type: ${expectedSlug}`, 'success')
        } else {
          await this.log(`❌ Missing expected type: ${expectedSlug}`, 'error')
          return false
        }
      }
      
      return true
    } else {
      await this.log(`❌ Campaign types test failed: ${result.data?.error}`, 'error')
      return false
    }
  }

  async testCampaignCRUD() {
    await this.log('Testing campaign CRUD operations...')
    
    if (!this.authToken) {
      await this.log('❌ No auth token available for campaign tests', 'error')
      return false
    }

    // First, get campaign types to use valid ID
    const typesResult = await this.makeRequest('GET', '/api/campaign-types')
    if (!typesResult.success || !typesResult.data.campaignTypes?.length) {
      await this.log('❌ Cannot get campaign types for testing', 'error')
      return false
    }

    const campaignTypeId = typesResult.data.campaignTypes[0].id

    // Test CREATE campaign
    const startDate = new Date()
    const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now

    const campaignData = {
      name: `Test Campaign ${Date.now()}`,
      description: 'Campaña de prueba para testing de APIs',
      campaignTypeId,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      sendReminders: true,
      anonymousResults: true
    }

    const createResult = await this.makeRequest('POST', '/api/campaigns', campaignData, true)
    
    if (!createResult.success) {
      await this.log(`❌ Campaign creation failed: ${createResult.data?.error}`, 'error')
      return false
    }

    const campaignId = createResult.data.campaign.id
    await this.log(`✅ Campaign created successfully: ${campaignId}`, 'success')

    // Test GET campaign
    const getResult = await this.makeRequest('GET', `/api/campaigns/${campaignId}`, null, true)
    
    if (!getResult.success) {
      await this.log(`❌ Campaign retrieval failed: ${getResult.data?.error}`, 'error')
      return false
    }

    await this.log(`✅ Campaign retrieved successfully`, 'success')

    // Test LIST campaigns
    const listResult = await this.makeRequest('GET', '/api/campaigns', null, true)
    
    if (!listResult.success) {
      await this.log(`❌ Campaign listing failed: ${listResult.data?.error}`, 'error')
      return false
    }

    const campaigns = listResult.data.campaigns || []
    await this.log(`✅ Listed ${campaigns.length} campaigns`, 'success')

    return true
  }

  async testMetrics() {
    await this.log('Testing metrics endpoint...')
    
    if (!this.authToken) {
      await this.log('❌ No auth token available for metrics test', 'error')
      return false
    }

    const result = await this.makeRequest('GET', '/api/campaigns/metrics', null, true)
    
    if (result.success) {
      const metrics = result.data.overview || {}
      await this.log(`✅ Metrics retrieved: ${metrics.totalCampaigns || 0} campaigns`, 'success')
      return true
    } else {
      await this.log(`❌ Metrics test failed: ${result.data?.error}`, 'error')
      return false
    }
  }

  async testValidations() {
    await this.log('Testing validation scenarios...')
    
    if (!this.authToken) {
      await this.log('❌ No auth token available for validation tests', 'error')
      return false
    }

    // Test invalid campaign data
    const invalidData = {
      name: '', // Empty name should fail
      campaignTypeId: 'invalid-id',
      startDate: '2023-01-01', // Past date should fail
      endDate: '2023-01-02'
    }

    const validationResult = await this.makeRequest('POST', '/api/campaigns', invalidData, true)
    
    if (!validationResult.success && validationResult.status === 400) {
      await this.log('✅ Validation working correctly - invalid data rejected', 'success')
      return true
    } else {
      await this.log('❌ Validation not working - invalid data accepted', 'error')
      return false
    }
  }

  async runAllTests() {
    await this.log('🚀 Starting FocalizaHR API Testing Suite')
    await this.log(`Testing against: ${API_BASE}`)
    
    const tests = [
      { name: 'Health Check', fn: () => this.testHealthCheck() },
      { name: 'Authentication', fn: () => this.testAuthentication() },
      { name: 'Campaign Types', fn: () => this.testCampaignTypes() },
      { name: 'Campaign CRUD', fn: () => this.testCampaignCRUD() },
      { name: 'Metrics', fn: () => this.testMetrics() },
      { name: 'Validations', fn: () => this.testValidations() }
    ]

    const results = []
    
    for (const test of tests) {
      try {
        const passed = await test.fn()
        results.push({ name: test.name, passed })
        
        if (passed) {
          await this.log(`✅ ${test.name} - PASSED`, 'success')
        } else {
          await this.log(`❌ ${test.name} - FAILED`, 'error')
        }
      } catch (error) {
        results.push({ name: test.name, passed: false, error: error.message })
        await this.log(`❌ ${test.name} - ERROR: ${error.message}`, 'error')
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    // Summary
    const passed = results.filter(r => r.passed).length
    const total = results.length
    const percentage = Math.round((passed / total) * 100)

    await this.log('', 'info')
    await this.log('📊 TEST SUMMARY', 'info')
    await this.log(`Passed: ${passed}/${total} (${percentage}%)`, 'info')
    
    if (percentage === 100) {
      await this.log('🎉 ALL TESTS PASSED!', 'success')
    } else if (percentage >= 80) {
      await this.log('⚠️  Most tests passed - minor issues detected', 'warn')
    } else {
      await this.log('❌ Multiple test failures - requires attention', 'error')
    }

    return { passed, total, percentage, details: results }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new APITester()
  tester.runAllTests()
    .then(results => {
      process.exit(results.percentage === 100 ? 0 : 1)
    })
    .catch(error => {
      console.error('Test suite failed:', error)
      process.exit(1)
    })
}

module.exports = APITester