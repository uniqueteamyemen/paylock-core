import { ApiCheck, AssertionBuilder } from 'checkly/constructs'

new ApiCheck('paylock-lifecycle', {
  name: 'PayLock Deterministic Lifecycle',
  activated: true,
  frequency: 10,

  request: {
    method: 'GET',
    url: 'https://paylock-core-production.up.railway.app/v1/health',
  },

  assertions: [
    AssertionBuilder.statusCode().equals(200),
  ],
})