module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Desactivado temporalmente para depuración
    // plugins: ['nativewind/babel'],
  };
};
