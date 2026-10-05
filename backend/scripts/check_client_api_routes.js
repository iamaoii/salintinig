const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');

const routeMounts = {
  'auth.routes.js': '/api/auth',
  'student.routes.js': '/api/students',
  'admin.routes.js': '/api/admin',
  'super_admin.routes.js': '/api/super-admin',
  'teacher.routes.js': '/api/teacher',
  'notification.routes.js': '/api/notifications',
  'tts.routes.js': '/api/tts',
};

function walk(dir, exts) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'build' || entry.name === 'dist') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, exts));
    else if (exts.includes(path.extname(entry.name))) out.push(full);
  }
  return out;
}

function normalizeClientPath(raw) {
  if (!raw || raw.includes('${') || raw.includes('`')) return null;
  let route = raw.trim();
  route = route.replace(/\$params\b/g, '');
  route = route.replace(/\$[A-Za-z_][A-Za-z0-9_]*/g, ':param');
  route = route.split('?')[0];
  if (!route.startsWith('/')) route = `/${route}`;
  if (!route.startsWith('/api/')) route = `/api${route}`;
  route = route.replace(/^\/api\/student(\/|$)/, '/api/students$1');
  return route;
}

function toRegex(route) {
  const parts = route.split('/').map((part) => {
    if (part.startsWith(':')) return '[^/]+';
    return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  });
  return new RegExp(`^${parts.join('/')}/?$`);
}

function extractServerRoutes() {
  const routes = [];
  const routesDir = path.join(root, 'backend', 'src', 'routes');

  for (const [file, mount] of Object.entries(routeMounts)) {
    const full = path.join(routesDir, file);
    const source = fs.readFileSync(full, 'utf8');
    const regex = /router\.(get|post|put|patch|delete)\(\s*['"`]([^'"`]+)['"`]/g;
    let match;
    while ((match = regex.exec(source))) {
      routes.push({
        method: match[1].toUpperCase(),
        route: `${mount}${match[2] === '/' ? '' : match[2]}`,
        regex: toRegex(`${mount}${match[2] === '/' ? '' : match[2]}`),
      });
    }

    if (file === 'student.routes.js') {
      for (const route of routes.filter((r) => r.route.startsWith('/api/students'))) {
        routes.push({
          method: route.method,
          route: route.route.replace('/api/students', '/api/student'),
          regex: toRegex(route.route.replace('/api/students', '/api/student')),
        });
      }
    }
  }

  return routes;
}

function extractClientCalls() {
  const files = [
    ...walk(path.join(root, 'frontend', 'src'), ['.js', '.jsx']),
    ...walk(path.join(root, 'mobile', 'lib'), ['.dart']),
  ];
  const calls = [];

  const patterns = [
    /getApiUrl\(\s*['"`]([^'"`]+)['"`]/g,
    /ApiService\.(get|post|put|patch|delete|uploadMultipartFile|getRawBytes)\(\s*['"`]([^'"`]+)['"`]/g,
    /ApiService\.post\(\s*['"`]([^'"`]+)['"`]/g,
  ];

  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(source))) {
        const raw = match[2] || match[1];
        const route = normalizeClientPath(raw);
        if (!route || route === '/api') continue;
        calls.push({
          file: path.relative(root, file),
          route,
        });
      }
    }
  }

  return calls;
}

function main() {
  const serverRoutes = extractServerRoutes();
  const clientCalls = extractClientCalls();
  const unique = new Map();
  for (const call of clientCalls) {
    if (!unique.has(call.route)) unique.set(call.route, call);
  }

  const misses = [...unique.values()]
    .filter((call) => call.route !== '/api/auth')
    .filter((call) => !serverRoutes.some((route) => route.regex.test(call.route)))
    .sort((a, b) => a.route.localeCompare(b.route));

  if (!misses.length) {
    console.log(`All ${unique.size} static client API routes have a matching Express route.`);
    return;
  }

  console.table(misses);
  process.exitCode = 1;
}

main();
