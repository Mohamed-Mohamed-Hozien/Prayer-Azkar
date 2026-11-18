import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function terminalLoggerPlugin() {
  return {
    name: 'terminal-logger-plugin',
    apply: 'serve', // only in dev server
    configureServer(server) {
      console.log('\n\x1b[32m✔ [صلاتي وأذكاري] محرك تسجيل السجلات الحية في الطرفية (Terminal Logger) مُفعّل\x1b[0m');
      console.log('\x1b[90m➜ سيتم عرض جميع طلبات HTTP وسجلات المتصفح (Console Logs) هنا مباشرة في الوقت الفعلي.\x1b[0m\n');

      // 1. HTTP Request Logger Middleware
      server.middlewares.use((req, res, next) => {
        const start = Date.now();
        const url = req.url || '';
        
        // Skip noisy Vite internal requests
        const isInternal = url.startsWith('/@') || url.includes('/node_modules/') || url.includes('?v=') || url === '/__terminal_log';

        const originalEnd = res.end;
        res.end = function (...args) {
          const duration = Date.now() - start;
          const status = res.statusCode || 200;

          if (!isInternal) {
            const timeStr = new Date().toLocaleTimeString('ar-EG', { hour12: false });
            let statusColor = '\x1b[32m'; // green
            if (status >= 400) statusColor = '\x1b[31m'; // red
            else if (status >= 300) statusColor = '\x1b[33m'; // yellow

            const methodColor = req.method === 'GET' ? '\x1b[36m' : '\x1b[35m';
            console.log(
              `\x1b[90m[${timeStr}]\x1b[0m ${methodColor}${req.method}\x1b[0m ${url} ${statusColor}${status}\x1b[0m \x1b[90m(${duration}ms)\x1b[0m`
            );
          }
          return originalEnd.apply(this, args);
        };
        next();
      });

      // 2. Browser Console Log Bridge Endpoint
      server.middlewares.use((req, res, next) => {
        if (req.url === '/__terminal_log' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const timeStr = new Date().toLocaleTimeString('ar-EG', { hour12: false });
              const levelColors = {
                log: '\x1b[32m[LOG]\x1b[0m',
                info: '\x1b[34m[INFO]\x1b[0m',
                warn: '\x1b[33m[WARN]\x1b[0m',
                error: '\x1b[31m[ERROR]\x1b[0m'
              };
              const tag = levelColors[data.level] || '\x1b[32m[LOG]\x1b[0m';
              const formattedArgs = (data.args || []).map(arg => {
                if (typeof arg === 'string') return arg;
                return JSON.stringify(arg);
              }).join(' ');

              console.log(`\x1b[90m[${timeStr}]\x1b[0m ${tag} \x1b[33m🌐\x1b[0m ${formattedArgs}`);
            } catch (e) {}
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/plain');
            res.end('ok');
          });
          return;
        }
        next();
      });
    },

    // Inject client-side logger bridge into index.html
    transformIndexHtml(html) {
      const loggerScript = `
    <!-- Live Browser-to-Terminal Logger Bridge -->
    <script>
      (function() {
        if (typeof window !== 'undefined' && !window.__terminal_logger_injected) {
          window.__terminal_logger_injected = true;
          
          function sendLog(level, args) {
            try {
              var serialized = args.map(function(item) {
                if (item instanceof Error) {
                  return item.stack || item.message;
                }
                if (typeof item === 'object' && item !== null) {
                  try { return JSON.stringify(item); } catch(e) { return String(item); }
                }
                return String(item);
              });

              if (navigator.sendBeacon) {
                var blob = new Blob([JSON.stringify({ level: level, args: serialized })], { type: 'application/json' });
                navigator.sendBeacon('/__terminal_log', blob);
              } else {
                fetch('/__terminal_log', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ level: level, args: serialized })
                }).catch(function() {});
              }
            } catch(e) {}
          }

          ['log', 'info', 'warn', 'error'].forEach(function(level) {
            var original = console[level];
            console[level] = function() {
              original.apply(console, arguments);
              sendLog(level, Array.prototype.slice.call(arguments));
            };
          });

          window.addEventListener('error', function(event) {
            sendLog('error', ['[Uncaught Exception]', event.message, 'at', event.filename + ':' + event.lineno]);
          });

          window.addEventListener('unhandledrejection', function(event) {
            sendLog('error', ['[Unhandled Promise Rejection]', event.reason]);
          });

          console.log('🕌 [صلاتي وأذكاري] تم الاتصال بالمتصفح - محرك السجلات الحية يعمل الآن');
        }
      })();
    </script>
      `;
      return html.replace('</head>', `${loggerScript}\n  </head>`);
    }
  };
}

export default defineConfig({
  plugins: [react(), terminalLoggerPlugin()],
  server: {
    port: 3000,
    open: false,
    host: true
  }
});
