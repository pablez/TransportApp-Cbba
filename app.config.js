import 'dotenv/config';

export default ({ config }) => {
  return {
    ...config,
    extra: {
      ...(config.extra || {}),
      ORS_API_KEY: process.env.ORS_API_KEY || null,
    }
  };
};
