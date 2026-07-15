const fs = require('fs');
let content = fs.readFileSync('src/app/(main)/page.tsx', 'utf8');
content = content.replace('</Link>\n              </div>\n            </div>', '</button>\n              </div>\n            </div>');
fs.writeFileSync('src/app/(main)/page.tsx', content);
