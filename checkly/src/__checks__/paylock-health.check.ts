import { ApiCheck, AssertionBuilder } from 'checkly/constructs'

new ApiCheck('paylock-health', {
  name: 'PayLock Health Check',
  activated: true,
  frequency: 5,
  request: {
    method: 'GET',
    url: 'https://paylock-core-production.up.railway.app/v1/health',
  },
  assertions: [
    AssertionBuilder.statusCode().equals(200),
  ],
})