// Prints name + updated_at of every Netlify site (used to prove deploys leave other sites untouched).
const res = await fetch('https://api.netlify.com/api/v1/sites?filter=all&per_page=100', {
  headers: { Authorization: `Bearer ${process.env.NETLIFY_AUTH_TOKEN}` },
});
const sites = await res.json();
console.log(JSON.stringify(sites.map((s) => [s.name, s.updated_at]).sort()));
