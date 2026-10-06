module.exports = {
  name: 'mock',

  async generate() {
    return JSON.stringify({
      summary:
        'Mock analysis: the reported symptoms may warrant clinician review. This is placeholder output from the mock provider.',
      riskLevel: 'Medium',
      warningFlags: ['Mock warning flag'],
      considerations: ['Review symptom duration and progression'],
    });
  },
};