export async function onRequest(context) {
  // Supabase proje bilgileriniz (Supabase panelinden alabilirsiniz)
const SUPABASE_URL = 'https://vchslwakepazewhujbmy.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_4VlT4TkKQGtQdvorccjvtQ_yV4kSOjz';

  try {
    // Supabase'den tüm blogların page_url ve created_at bilgilerini çekiyoruz
    const response = await fetch(`${SUPABASE_URL}/rest/v1/blogs?select=page_url,created_at`, {
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    const blogs = await response.json();

    // XML formatını oluşturmaya başlıyoruz
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    
    // Ana sayfa ve blog listesi sabit olarak ekleniyor
    xml += `  <url>\n    <loc>https://tsutabi.com/</loc>\n    <priority>1.0</priority>\n  </url>\n`;
    xml += `  <url>\n    <loc>https://tsutabi.com/blog</loc>\n    <priority>0.9</priority>\n  </url>\n`;

    // Supabase'den gelen bloglar döngüye sokulup sitemap'e ekleniyor
    if (Array.isArray(blogs)) {
      blogs.forEach(blog => {
        const date = blog.created_at ? blog.created_at.split('T')[0] : '';
        xml += `  <url>\n`;
        xml += `    <loc>https://tsutabi.com/blog/${blog.page_url}</loc>\n`;
        if (date) xml += `    <lastmod>${date}</lastmod>\n`;
        xml += `    <priority>0.8</priority>\n`;
        xml += `  </url>\n`;
      });
    }

    xml += `</urlset>`;

    // Ürettiğimiz XML'i arama motorlarına uygun başlıkla (application/xml) geri döndürüyoruz
    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=UTF-8",
        "Cache-Control": "public, max-age=3600" // 1 saat önbellekte tutar, sunucuyu yormaz
      }
    });

  } catch (err) {
    return new Response("Sitemap oluşturulamadı.", { status: 500 });
  }
}