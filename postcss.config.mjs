import { createRequire } from "module";
const require = createRequire(import.meta.url);

const plugins = { tailwindcss: {} };

try {
  require.resolve("autoprefixer");
  plugins.autoprefixer = {};
} catch (e) {
  // autoprefixer нет — продолжаем без него
}

export default { plugins };
