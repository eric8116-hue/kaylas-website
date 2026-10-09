export async function onRequestGet({request,env}){
  if(!env.DB)return Response.json({error:'Reviews are unavailable.'},{status:503});
  const origin=request.headers.get('Origin');
  const allowed=env.PUBLIC_SPA_ORIGIN&&origin===env.PUBLIC_SPA_ORIGIN;
  const headers={'Cache-Control':'public, max-age=300','Vary':'Origin'};
  if(allowed)headers['Access-Control-Allow-Origin']=origin;
  const rows=await env.DB.prepare(`SELECT rating,reviewer_name,comment,update_time
    FROM google_reviews WHERE rating>=4 AND synced_at>=datetime('now','-30 days') ORDER BY update_time DESC LIMIT 12`).all();
  return Response.json({label:'Featured Google reviews',reviews:rows.results},{headers});
}
