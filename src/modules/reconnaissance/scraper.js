const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function scrapeWebsite(url) {
  // Launch browser with robust flags for containerized/headless environments
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  // Set a realistic user agent to avoid immediate bot blocks
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  console.log(`[*] Connecting to target: ${url}`);
  
  // Navigate to target and wait until network is idle
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

  // Get the fully rendered HTML content
  const html = await page.content();

  // Get all CSS stylesheet URLs
  const cssLinks = await page.$$eval('link[rel="stylesheet"]', (links) => 
    links.map(link => link.href).filter(Boolean)
  );

  // Get all script src attributes
  const scriptTags = await page.$$eval('script', (scripts) => 
    scripts.map(script => script.src).filter(Boolean)
  );

  // Filter out external security telemetry, analytics, and tracking scripts
  const filteredScripts = scriptTags.filter(script => {
    const lower = script.toLowerCase();
    return !lower.includes('telemetry') && 
           !lower.includes('tracking') && 
           !lower.includes('analytics') && 
           !lower.includes('gtag') && 
           !lower.includes('hotjar') &&
           !lower.includes('sentry');
  });

  // Format extracted CSS links into link tags
  const cssInclusion = cssLinks.map(href => `<link rel="stylesheet" href="${href}">`).join('\n    ');

  // Format filtered scripts into script tags
  const scriptInclusion = filteredScripts.map(src => `<script src="${src}"></script>`).join('\n    ');

  // Construct the clean, compiled output structure
  const assembledOutput = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cloned Target Interface</title>
    ${cssInclusion}
</head>
<body>
    ${html}
    ${scriptInclusion}
</body>
</html>`;

  await browser.close();
  return assembledOutput;
}

async function main() {
  const targetUrl = process.argv[2] || 'https://example.com'; // Accept CLI argument or fallback
  
  try {
    const cleanedContent = await scrapeWebsite(targetUrl);

    // Ensure the dist directory exists
    const distDir = path.join(__dirname, 'dist');
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }

    // Write the cleaned content to dist/index.html
    const outputPath = path.join(distDir, 'index.html');
    fs.writeFileSync(outputPath, cleanedContent, 'utf8');

    console.log(`[+] Success! Target scraped, cleaned, and saved to: ${outputPath}`);
  } catch (error) {
    console.error('[-] An error occurred during execution:', error);
    process.exit(1);
  }
}

main();
