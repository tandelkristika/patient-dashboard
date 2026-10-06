const mockProvider = require('./mockProvider');

const providers = {
  mock: mockProvider,
};

const getProvider = () => {
  const name = (process.env.AI_PROVIDER || 'mock').toLowerCase();

  const provider = providers[name];

  if (!provider) {
    throw new Error(`Unknown AI_PROVIDER "${name}"`);
  }

  return provider;
};

module.exports = { getProvider };