const fs = require("fs");
const path = require("path");

const files = [
  "src/app/contact/page.tsx",
  "src/app/about/page.tsx",
  "src/app/blog/page.tsx",
  "src/components/sections/HealthCheck.tsx",
  "src/app/cek-kesehatan/page.tsx"
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    console.log("File not found:", filePath);
    return;
  }
  let content = fs.readFileSync(filePath, "utf-8");
  
  // Replace colors
  content = content.replace(/bg-\[\#0a192f\]/g, "bg-primary");
  content = content.replace(/from-\[\#0a192f\]/g, "from-primary");
  content = content.replace(/to-\[\#0b1a30\]/g, "to-emerald-950");
  content = content.replace(/via-\[\#0b1a30\]/g, "via-emerald-900");
  
  content = content.replace(/bg-\[\#d4af37\]/g, "bg-accent");
  content = content.replace(/text-\[\#d4af37\]/g, "text-accent");
  content = content.replace(/fill-\[\#d4af37\]/g, "fill-accent");
  content = content.replace(/border-\[\#d4af37\]/g, "border-accent");
  content = content.replace(/from-\[\#d4af37\]/g, "from-accent");
  content = content.replace(/to-\[\#d4af37\]/g, "to-accent");
  
  // Replace RGB strings for the old gold (212,175,55) to the new accent (251,191,36)
  content = content.replace(/212,175,55/g, "251,191,36");
  
  // Replace Radja Bekam with Navara Reflexology
  content = content.replace(/Radja Bekam/g, "Navara Reflexology");
  content = content.replace(/radja bekam/gi, "Navara Reflexology");
  
  fs.writeFileSync(filePath, content, "utf-8");
  console.log("Updated", file);
});
