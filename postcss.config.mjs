import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const plugins = { tailwindcss: {} };

try {
  require.resolve('autoprefixer');
  plugins.autoprefixer = {};
} catch {
  // autoprefixer is optional in this environment
}

export default { plugins };
