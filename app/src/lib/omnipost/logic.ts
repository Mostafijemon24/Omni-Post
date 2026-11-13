// @ts-nocheck -- view-model glue ported verbatim from the approved design prototype; typed domain contracts live in src/lib/adapters.
import React from "react";
import { Store } from "./store";
import { aiProviders as aiAdapters, DEFAULT_AI_PROVIDER, CAPTION_LIMITS } from "@/lib/adapters/mock";
import { shortenToLimit, parseHashtags, formatSchedule, STUDIO_TONES, STUDIO_LANGUAGES, STUDIO_MODELS, zonedToIso, isoToZoned } from "./studio";

const ALL_PLATFORMS = ['facebook','instagram','linkedin','x','threads'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type OmniState = Record<string, any>;

export class OmniPostLogic extends Store<OmniState> {
  state: OmniState = { route:'dashboard', theme:'light', activePlatform:'facebook', generating:false, generated:true, intTab:'ai', wizProvider:'openrouter', wizStep:1, wizAuth:0, impStep:0, impMode:'approval', incoming:[] };

  go(route){ return () => this.setState({ route }); }
  componentDidMount(){ this._boot = true; }

  toggleTheme(){ this.setState(s => ({ theme: s.theme==='light' ? 'dark' : 'light' })); }

  // icon helpers
  pIcon(p){ return ({facebook:'ph ph-facebook-logo', instagram:'ph ph-instagram-logo', linkedin:'ph ph-linkedin-logo', x:'ph ph-x-logo', youtube:'ph ph-youtube-logo', pinterest:'ph ph-pinterest-logo', tiktok:'ph ph-tiktok-logo', threads:'ph ph-threads-logo', telegram:'ph ph-telegram-logo', reddit:'ph ph-reddit-logo'})[p]; }
  pColor(p){ return ({facebook:'#2563eb', instagram:'#db2777', linkedin:'#0a66c2', x:'var(--text)', youtube:'#dc2626', pinterest:'#e60023', tiktok:'var(--text)', threads:'var(--text)', telegram:'#229ed9', reddit:'#ff4500'})[p]; }

  renderVals(){
    const dark = this.state.theme === 'dark';
    const route = this.state.route;
    const R = k => route === k;
    const r = {
      dashboard:R('dashboard'), studio:R('studio'), image:R('image'), planner:R('planner'),
      calendar:R('calendar'), posts:['posts','scheduled','published','drafts'].includes(route),
      media:R('media'), accounts:R('accounts'), providers:R('providers'),
      integrations:R('integrations'), automation:R('automation'), logs:R('logs'),
      analytics:R('analytics'), settings:R('settings'), architecture:R('architecture')
    };

    const nav = [
      { title:'Overview', items:[['dashboard','Dashboard','ph ph-squares-four']] },
      { title:'Create', items:[['studio','AI Content Studio','ph ph-sparkle'],['image','AI Image Studio','ph ph-image'],['planner','Content Planner','ph ph-stack']] },
      { title:'Schedule', items:[['calendar','Content Calendar','ph ph-calendar-dots'],['posts','All Posts','ph ph-cards'],['scheduled','Scheduled','ph ph-clock'],['published','Published','ph ph-check-circle'],['drafts','Drafts','ph ph-note-pencil']] },
      { title:'Assets', items:[['media','Media Library','ph ph-images']] },
      { title:'Connections', items:[['accounts','Social Accounts','ph ph-users-three'],['providers','AI Providers','ph ph-brain'],['integrations','Integrations','ph ph-plugs'],['automation','Automation','ph ph-robot']] },
      { title:'Monitor', items:[['logs','Publishing Logs','ph ph-list-checks'],['analytics','Analytics','ph ph-chart-bar']] },
      { title:'System', items:[['settings','Settings','ph ph-gear'],['architecture','Architecture','ph ph-blueprint']] },
    ];
    const badges = { posts:'128', scheduled:'34', drafts:'11', accounts:'6' };
    const badgeTone = { scheduled:true, drafts:true };
    const navSections = nav.map(sec => ({ title:sec.title, items: sec.items.map(([id,label,icon]) => {
      const active = route === id;
      return { label, icon, go:this.go(id),
        bg: active ? 'var(--surface-2)' : 'transparent',
        fg: active ? 'var(--text)' : 'var(--text-2)',
        iconColor: active ? 'var(--accent-ink)' : 'var(--muted)',
        weight: active ? 600 : 450,
        badge: badges[id] || '',
        badgeBg: badgeTone[id] ? 'var(--accent-soft)' : 'var(--surface-3)',
        badgeFg: badgeTone[id] ? 'var(--accent-ink)' : 'var(--muted)' };
    })}));

    const titles = {
      dashboard:['Dashboard','Your publishing command center','', ],
      studio:['AI Content Studio','Generate platform-ready content from any provider','AI'],
      image:['AI Image Studio','Generate, edit & optimize visuals with SEO metadata','AI'],
      planner:['Content Planner','Bulk-generate and schedule weeks ahead',''],
      calendar:['Content Calendar','Every scheduled & published post in one view',''],
      posts:['All Posts','Every content item across platforms',''],
      scheduled:['Scheduled Posts','Queued for publishing',''],
      published:['Published Posts','Successfully delivered',''],
      drafts:['Drafts','Saved, not yet scheduled',''],
      media:['Media Library','Generated & uploaded assets',''],
      accounts:['Social Accounts','Connections, routes & capability matrix',''],
      providers:['AI Providers','Pluggable provider adapters',''],
      integrations:['Integrations','AI providers, MCP, automations, APIs, webhooks & imports','HUB'],
      automation:['Automation','Visual rules & execution monitoring',''],
      logs:['Publishing Logs','Attempts, retries & recovery',''],
      analytics:['Analytics','Real metrics only — never fabricated',''],
      settings:['Settings','Platform configuration',''],
      architecture:['System Architecture','Phase 1 — production-oriented blueprint',''],
    };
    const t = titles[route] || titles.dashboard;

    // dashboard
    const stats = [
      ['Connected accounts','6','+2 this month','ph ph-users-three','var(--blue)','ph ph-arrow-up','var(--accent-ink)'],
      ['Scheduled','34','next in 2h','ph ph-clock','var(--accent)','ph ph-clock','var(--muted)'],
      ['Published (30d)','212','98.1% success','ph ph-check-circle','var(--accent)','ph ph-arrow-up','var(--accent-ink)'],
      ['Pending approval','7','needs review','ph ph-hourglass-medium','var(--amber)','ph ph-dot','var(--amber)'],
      ['Failed (30d)','4','2 recoverable','ph ph-warning','var(--red)','ph ph-arrow-down','var(--red)'],
      ['Drafts','11','3 AI-generated','ph ph-note-pencil','var(--muted)','ph ph-dot','var(--muted)'],
    ].map(([label,value,delta,icon,color,deltaIcon,deltaColor]) => ({label,value,delta,icon,color,deltaIcon,deltaColor}));

    const upcoming = [
      ['The future of AI in WordPress development','facebook','Facebook: Dev Insights · +2','10:00','Jan 15'],
      ['5 automations that save 10 hours a week','linkedin','LinkedIn: Company Page','14:30','Jan 15'],
      ['Quick tip: headless CMS in 2027','x','X: @devinsights','19:00','Jan 15'],
      ['Behind the build — our new design system','instagram','Instagram: @studio','09:00','Jan 16'],
    ].map(([title,p,accounts,time,date]) => ({title,accounts,time,date,icon:this.pIcon(p),color:this.pColor(p)}));

    const activity = [['Mon',70,55],['Tue',88,72],['Wed',45,30],['Thu',100,90],['Fri',62,48],['Sat',38,22],['Sun',75,60]]
      .map(([day,h,fill]) => ({day, h:h+'%', fill:fill+'%'}));

    const quickActions = [
      ['Create post','ph ph-pencil-simple-line','studio'],['Generate AI','ph ph-sparkle','studio'],
      ['Generate image','ph ph-image','image'],['Content plan','ph ph-stack','planner'],
      ['Schedule','ph ph-calendar-plus','calendar'],['Connect','ph ph-plugs','accounts'],
    ].map(([label,icon,go]) => ({label,icon,go:this.go(go)}));

    const healthAccounts = [
      ['facebook','Dev Insights','Meta Graph API','Healthy','var(--accent)'],
      ['instagram','@studio.visuals','Token expires in 3d','Warning','var(--amber)'],
      ['linkedin','Company Page','Direct API','Healthy','var(--accent)'],
      ['x','@devinsights','Rate-limited','Degraded','var(--red)'],
    ].map(([p,name,detail,status,statusColor]) => ({name,detail,status,statusColor,icon:this.pIcon(p),color:this.pColor(p)}));

    // content studio variations
    const varData = {
      facebook:{ name:'Facebook', account:'Dev Insights', limit:'63,206', chars:412,
        headline:'AI is quietly rewriting how we build WordPress sites',
        caption:"Here's what changed in the last 12 months — and why it matters for anyone shipping on WordPress.\n\nAI-assisted scaffolding, content generation, and automated QA are no longer experiments. They're in production. The teams moving fastest treat AI as a teammate, not a toy.\n\nWhat's one task you'd hand off first? 👇",
        cta:'Drop your answer in the comments', alt:'Developer workspace with WordPress dashboard, soft daylight',
        imgSize:'1200 × 630', tags:['#AIWebDev','#WordPress','#WebDevelopment','#DevTools','#Automation'] },
      instagram:{ name:'Instagram', account:'@studio.visuals', limit:'2,200', chars:328,
        headline:'The AI + WordPress shift, in one carousel',
        caption:"Swipe → the 5 ways AI is changing WordPress builds in 2027.\n\nFrom scaffolding to QA, the workflow looks different now. Save this for your next project. ✨",
        cta:'Save & share with your team', alt:'Minimal flatlay of a laptop showing WordPress admin',
        imgSize:'1080 × 1080', tags:['#webdev','#wordpress','#aitools','#buildinpublic','#design'] },
      linkedin:{ name:'LinkedIn', account:'Company Page', limit:'3,000', chars:564,
        headline:'The future of AI in WordPress development',
        caption:"Over the past year, AI moved from novelty to infrastructure in our WordPress workflow.\n\nThree concrete shifts we've measured:\n\n1. Scaffolding time down ~40%\n2. Content drafts generated in minutes, refined by humans\n3. Automated accessibility & QA checks on every PR\n\nThe takeaway isn't \"AI replaces developers.\" It's that teams who build the right guardrails ship more, with higher quality.",
        cta:'How is your team adopting AI? Let\'s compare notes.', alt:'Professional editorial image of a modern dev team',
        imgSize:'1200 × 627', tags:['#AI','#WordPress','#SoftwareEngineering','#WebDevelopment'] },
      x:{ name:'X / Twitter', account:'@devinsights', limit:'280', chars:214,
        headline:'AI × WordPress, 2027',
        caption:"AI in WordPress dev isn't hype anymore:\n\n→ scaffolding -40%\n→ content drafts in minutes\n→ automated a11y + QA on every PR\n\nIt's a teammate, not a toy.",
        cta:'What would you automate first?', alt:'Code editor with AI assistant panel',
        imgSize:'1600 × 900', tags:['#AI','#WordPress','#WebDev'] },
      threads:{ name:'Threads', account:'@devinsights', limit:'500', chars:188,
        headline:'AI is now part of the WordPress stack',
        caption:"Been using AI across our WordPress builds all year. The honest take: it's a force multiplier when you add guardrails, a mess when you don't.\n\nWhere's it actually helping you?",
        cta:'Reply with your workflow', alt:'Casual shot of a developer desk',
        imgSize:'1080 × 1350', tags:['#webdev','#ai','#wordpress'] },
    };
    const st = this.studioVals(varData);
    const { varTabs, activeVar, platformChips, rewriteActions } = st;

    // image studio
    const imgTools = [['Regenerate','ph ph-arrows-clockwise'],['Crop','ph ph-crop'],['Resize','ph ph-arrows-out'],['Compress','ph ph-file-zip'],['Download','ph ph-download-simple']].map(([label,icon])=>({label,icon}));
    const imgPresets = [
      ['Instagram Square','1080×1080','instagram'],['Instagram Portrait','1080×1350','instagram'],['Instagram Story','1080×1920','instagram'],
      ['Facebook Feed','1200×630','facebook'],['LinkedIn Feed','1200×627','linkedin'],['X Feed','1600×900','x'],
      ['Pinterest','1000×1500','pinterest'],['YouTube Thumb','1280×720','youtube'],
    ].map(([name,dims,p],i) => ({name,dims,icon:this.pIcon(p),color:this.pColor(p), border: i===0?'var(--accent-border)':'var(--border)', bg: i===0?'var(--accent-soft)':'var(--surface-2)'}));
    const imgMeta = [
      ['SEO FILENAME','ai-wordpress-development-2027.webp'],['IMAGE TITLE','AI in WordPress Development'],
      ['ALT TEXT','Developer workspace with WordPress dashboard in soft daylight'],
      ['FOCUS KEYWORD','AI web development'],['FORMAT / SIZE','WebP · 1080×1080 · 184 KB'],['PROVIDER','OpenAI DALL·E 3'],
    ].map(([label,value])=>({label,value}));

    // planner
    const horizons = ['30 Days','60 Days','90 Days','6 Months','1 Year','Custom'].map((label,i)=>({label, go:()=>{}, border:i===0?'var(--accent-border)':'var(--border)', bg:i===0?'var(--accent-soft)':'var(--surface-2)', fg:i===0?'var(--accent-ink)':'var(--text-2)', weight:i===0?600:450}));
    const weekDays = ['M','T','W','T','F','S','S'].map((label,i)=>({label, border:i<5?'var(--accent-border)':'var(--border)', bg:i<5?'var(--accent-soft)':'var(--surface-2)', fg:i<5?'var(--accent-ink)':'var(--muted)'}));
    const plannerItems = [
      ['01','Why headless WordPress wins in 2027','Education','FB · LI · X','Jan 15 · 09:00','Ready'],
      ['02','5 AI tools every WP developer needs','Listicle','IG · FB · Threads','Jan 16 · 09:00','Ready'],
      ['03','Case study: 40% faster builds with AI','Case study','LI · X','Jan 17 · 14:30','Ready'],
      ['04','Quick tip: automate your deploys','Tip','X · Threads','Jan 18 · 19:00','Ready'],
      ['05','The anatomy of a great CMS','Education','FB · LI','Jan 19 · 09:00','Review'],
      ['06','Behind the scenes: our stack','BTS','IG · Threads','Jan 20 · 09:00','Ready'],
      ['07','Poll: AI in your workflow?','Engagement','X · FB','Jan 21 · 12:00','Ready'],
    ].map(([num,title,category,platforms,when,status]) => ({num,title,category,platforms,when,status, statusBg: status==='Review'?'var(--amber-soft)':'var(--accent-soft)', statusFg: status==='Review'?'var(--amber)':'var(--accent-ink)'}));

    // calendar
    const calViews = ['Month','Week','Day','List','Timeline'].map((label,i)=>({label, weight:i===0?600:450, bg:i===0?'var(--surface)':'transparent', fg:i===0?'var(--text)':'var(--muted)'}));
    const dayHeaders = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const calEvents = {
      '1':[['x','Tip thread','s']], '3':[['linkedin','Case study','p'],['facebook','Weekly post','s']],
      '6':[['instagram','Carousel','s']], '8':[['facebook','AI post','p'],['x','Quick tip','p']],
      '10':[['linkedin','Authority','pending']], '13':[['instagram','Story','s']],
      '15':[['facebook','Feature','s'],['linkedin','Long-form','s'],['x','Thread','s']],
      '16':[['instagram','BTS','s']], '18':[['x','Deploy tip','s']],
      '20':[['instagram','Stack post','pending']], '22':[['linkedin','Poll','s']],
      '24':[['facebook','Recap','p']], '27':[['x','Hot take','s']], '29':[['instagram','Teaser','s']],
    };
    (this.state.studioPosts||[]).filter(x => x.status==='scheduled' && /^2027-01-\d\d$/.test(x.date)).forEach(x => {
      const d = String(Number(x.date.slice(8))); calEvents[d] = (calEvents[d]||[]).concat([[x.platforms[0], x.label+' · new', 's']]); });
    const eColor = { s:['var(--accent-soft)','var(--accent-ink)'], p:['var(--blue-soft)','var(--blue)'], pending:['var(--amber-soft)','var(--amber)'] };
    const calCells = [];
    for(let i=0;i<35;i++){
      const dayNum = i-2; const inMonth = dayNum>=1 && dayNum<=31; const isToday = dayNum===15;
      const evs = (calEvents[String(dayNum)]||[]).map(([p,label,tone])=>({label, icon:this.pIcon(p), bg:eColor[tone][0], fg:eColor[tone][1]}));
      calCells.push({ day: inMonth ? dayNum : (dayNum<1 ? 29+dayNum : dayNum-31), posts:evs,
        bg: isToday ? 'var(--accent-soft)' : (inMonth ? 'var(--surface)' : 'var(--surface-2)'),
        dayColor: inMonth ? (isToday?'var(--accent-ink)':'var(--text)') : 'var(--faint)', dayWeight: isToday?700:500 });
    }

    // posts
    const postStatusMap = { scheduled:['Scheduled','var(--accent-soft)','var(--accent-ink)'], published:['Published','var(--blue-soft)','var(--blue)'], draft:['Draft','var(--surface-3)','var(--muted)'], approval:['Pending','var(--amber-soft)','var(--amber)'], failed:['Failed','var(--red-soft)','var(--red)'] };
    const allPosts = [
      ['The future of AI in WordPress development','AI is quietly rewriting how we build…',['facebook','linkedin','x'],'Dev Insights','Jan 15 · 10:00','scheduled'],
      ['5 automations that save 10 hours a week','A practical breakdown of the workflows…',['linkedin'],'Company Page','Jan 15 · 14:30','scheduled'],
      ['Quick tip: headless CMS in 2027','Why we moved and what we learned…',['x','threads'],'@devinsights','Jan 14 · 19:00','published'],
      ['Behind the build — new design system','A look at the tokens and components…',['instagram'],'@studio.visuals','Jan 13 · 09:00','published'],
      ['Weekly roundup: dev tooling','The five tools we actually kept using…',['facebook','linkedin'],'Dev Insights','—','draft'],
      ['Poll: how do you use AI?','Curious where everyone lands on this…',['x','facebook'],'@devinsights','Jan 16 · 12:00','approval'],
      ['Case study: 40% faster builds','The real numbers behind the claim…',['linkedin','x'],'Company Page','Jan 12 · 14:30','failed'],
      ['Headless WordPress, explained','Everything you need to get started…',['facebook','instagram','linkedin'],'Dev Insights','Jan 17 · 09:00','scheduled'],
    ];
    const postFilterDefs = [['posts','All','128'],['scheduled','Scheduled','34'],['published','Published','83'],['drafts','Drafts','11'],['approval','Pending','7']];
    const postFilters = postFilterDefs.map(([id,label,count]) => {
      const active = route===id || (route==='posts'&&id==='posts');
      return { label, count, border:active?'var(--accent-border)':'var(--border)', bg:active?'var(--accent-soft)':'var(--surface)', fg:active?'var(--accent-ink)':'var(--text-2)', weight:active?600:450 };
    });
    const routeFilter = { scheduled:'scheduled', published:'published', drafts:'draft' }[route];
    const srcList = ['Content Studio','n8n','MCP · Claude','Manual upload','CSV import','REST API','Content Studio','MCP · ChatGPT'];
    const srcIcon = x => x.startsWith('MCP')?'ph ph-plugs-connected':x==='n8n'?'ph ph-share-network':x.includes('import')?'ph ph-file-arrow-up':x==='REST API'?'ph ph-code':x==='Manual upload'?'ph ph-upload-simple':'ph ph-sparkle';
    const studioRows = (this.state.studioPosts||[]).map(x => [x.title, x.excerpt, x.platforms, x.account, x.when, x.status, x.source || 'Content Studio']);
    const incomingPosts = studioRows.concat((this.state.incoming||[]).map(x => [x.title, x.excerpt, x.platforms, x.account, '—', 'draft', x.source+' (mock)']));
    const postRows = incomingPosts.concat(allPosts.map((p,i)=>p.concat([srcList[i]]))).filter(p => !routeFilter || p[5]===routeFilter).map(([title,excerpt,icons,account,when,st,source]) => {
      const sm = postStatusMap[st];
      return { title, excerpt, account, when, source:'via '+source, srcIcon:srcIcon(source), icons:icons.map(p=>({icon:this.pIcon(p),color:this.pColor(p)})), status:sm[0], statusBg:sm[1], statusFg:sm[2] };
    });

    // media
    const mediaFilters = ['All media','Generated','Uploaded','Unused'].map((label,i)=>({label, border:i===0?'var(--accent-border)':'var(--border)', bg:i===0?'var(--accent-soft)':'var(--surface)', fg:i===0?'var(--accent-ink)':'var(--text-2)', weight:i===0?600:450}));
    const mediaItems = [
      ['ai-wordpress-hero.webp','AI','Gen','1080×1080 · 184KB','ph ph-image',true],
      ['automation-flow.webp','AI','Gen','1200×630 · 210KB','ph ph-image',true],
      ['team-photo.jpg','UP','Upload','1600×900 · 420KB','ph ph-image',false],
      ['product-demo.mp4','VID','Video','1080p · 12MB','ph ph-video',true],
      ['design-system.webp','AI','Gen','1080×1350 · 240KB','ph ph-image',false],
      ['headless-cms.webp','AI','Gen','1200×627 · 198KB','ph ph-image',true],
      ['desk-flatlay.jpg','UP','Upload','2000×1333 · 680KB','ph ph-image',false],
      ['logo-mark.png','UP','Upload','512×512 · 24KB','ph ph-image',true],
      ['tutorial-thumb.webp','AI','Gen','1280×720 · 156KB','ph ph-image',false],
      ['stack-diagram.webp','AI','Gen','1600×900 · 288KB','ph ph-image',true],
    ].map(([name,badge,type,meta,icon,used]) => ({name,meta,icon,used, badge, badgeBg: badge==='AI'?'var(--accent)':badge==='VID'?'var(--violet)':'var(--surface-3)', badgeFg: badge==='UP'?'var(--muted)':'#fff'}));

    // accounts
    const accounts = [
      ['facebook','Dev Insights','Facebook Page','Healthy','var(--accent)','Direct · Meta Graph','Valid · 58d','2h ago','Reconnect',''],
      ['facebook','Studio Updates','Facebook Page','Healthy','var(--accent)','Publishing Provider','Valid · 58d','1d ago','Reconnect',''],
      ['instagram','@studio.visuals','Instagram Professional','Warning','var(--amber)','Direct · Meta Graph','Expires 3d','5h ago','Reconnect','animation:om-pulse 2s infinite;'],
      ['linkedin','Company Page','LinkedIn Page','Healthy','var(--accent)','Direct · LinkedIn API','Valid · 90d','3h ago','Reconnect',''],
      ['x','@devinsights','X / Twitter','Degraded','var(--red)','Publishing Provider','Rate-limited','1d ago','Review','animation:om-pulse 2s infinite;'],
      ['linkedin','Personal Profile','LinkedIn Profile','Healthy','var(--accent)','Direct · LinkedIn API','Valid · 90d','6h ago','Reconnect',''],
    ].map(([p,name,type,status,statusColor,provider,token,lastPub,action,pulse]) => ({
      name,type,status,statusColor,provider,token,lastPub,action,pulse,
      icon:this.pIcon(p), color:this.pColor(p), iconBg:'var(--surface-2)',
      tokenColor: token.includes('Expires')||token.includes('Rate')?'var(--amber)':'var(--text)' }));

    const yes = { icon:'ph-bold ph-check', color:'var(--accent)' };
    const no = { icon:'ph ph-minus', color:'var(--faint)' };
    const partial = { icon:'ph-bold ph-check', color:'var(--amber)' };
    const capCols = ['Text','Image','Video','Carousel','Schedule','Status'];
    const capRows = [
      ['facebook','Meta Graph',[1,1,1,1,1,1]],['instagram','Meta Graph',[1,1,1,1,1,1]],
      ['linkedin','LinkedIn API',[1,1,1,0,1,1]],['x','Provider',[1,1,1,0,2,2]],
      ['youtube','YouTube API',[0,0,1,0,1,1]],['pinterest','Provider',[1,1,0,0,1,2]],
      ['threads','Meta Graph',[1,1,0,1,1,0]],['tiktok','Provider',[0,0,1,0,2,2]],
    ].map(([p,routeName,caps]) => ({ name:this.pName(p), route:'· '+routeName, icon:this.pIcon(p), color:this.pColor(p),
      caps: caps.map(c => c===1?yes:c===2?partial:no) }));

    // ai providers
    const aiProviders = [
      ['OpenAI','ph ph-circle-half','#10a37f','api.openai.com/v1','GPT-4o','sk-••••7a2f','Connected','var(--accent)',true,[['Text','ph ph-text-aa'],['Images','ph ph-image'],['Structured','ph ph-brackets-curly']]],
      ['Anthropic Claude','ph ph-asterisk','#d97757','api.anthropic.com','Sonnet 4.5','sk-ant-••••9c','Connected','var(--accent)',false,[['Text','ph ph-text-aa'],['Structured','ph ph-brackets-curly'],['Long context','ph ph-arrows-out-line-horizontal']]],
      ['Google Gemini','ph ph-diamond','#4285f4','generativelanguage…','Gemini 2.0','AIza••••4b','Connected','var(--accent)',false,[['Text','ph ph-text-aa'],['Images','ph ph-image'],['Multimodal','ph ph-stack']]],
      ['Custom Endpoint','ph ph-plug','var(--muted)','self-hosted · OpenAI-compat','llama-3.1-70b','—','Not tested','var(--muted)',false,[['Text','ph ph-text-aa']]],
    ].map(([name,icon,color,endpoint,model,key,status,statusColor,def,caps]) => ({
      name,icon,color,endpoint,model,key,status,statusColor,default:def,
      cardBorder: def ? 'var(--accent-border)' : 'var(--border)',
      caps: caps.map(([label,ci]) => ({label, icon:ci, bg:'var(--surface-2)', fg:'var(--text-2)', border:'var(--border)'})) }));

    // integrations
    const apiKeys = [
      ['Production ingestion key','opk_live_••••••••3f7a','content:write'],
      ['n8n service key','opk_n8n_••••••••9c2e','content:write, publish'],
      ['Read-only status key','opk_ro_••••••••1b44','status:read'],
    ].map(([label,key,scope])=>({label,key,scope}));
    const webhookEvents = [
      ['content.created','var(--accent)',true],['content.updated','var(--accent)',true],['content.approved','var(--accent)',true],
      ['content.scheduled','var(--accent)',true],['content.published','var(--blue)',true],['content.failed','var(--red)',true],
      ['image.generated','var(--violet)',false],['account.disconnected','var(--amber)',true],
    ].map(([name,color,on]) => ({ name, color, toggleBg: on?'var(--accent)':'var(--surface-3)', knob: on?'right':'left', knobLeft: on?'19px':'2px' }));

    // automation
    const autoStats = [['Active automations','4'],['Executions (7d)','38'],['Success rate','97.4%']].map(([label,value])=>({label,value}));
    const automations = [
      ['Weekly content engine','ph ph-calendar-check','var(--accent-soft)','var(--accent-ink)','Every Monday · 09:00','Running','var(--accent)',true,
        [['Generate idea','ph ph-lightbulb','var(--amber)',1],['Platform posts','ph ph-copy','var(--blue)',1],['Images','ph ph-image','var(--violet)',1],['Save drafts','ph ph-note','var(--muted)',1],['Await approval','ph ph-hourglass','var(--amber)',0]]],
      ['n8n → OmniPost intake','ph ph-share-network','var(--violet-soft)','var(--violet)','Webhook · on receive','Running','var(--accent)',true,
        [['Validate payload','ph ph-shield-check','var(--accent)',1],['Create content','ph ph-plus-circle','var(--blue)',1],['Schedule','ph ph-calendar-plus','var(--accent-ink)',0]]],
      ['Daily publish queue','ph ph-paper-plane-tilt','var(--blue-soft)','var(--blue)','Every day · continuous','Paused','var(--muted)',false,
        [['Fetch due','ph ph-clock','var(--muted)',1],['Validate account','ph ph-user-check','var(--accent)',1],['Publish','ph ph-paper-plane-right','var(--blue)',1],['Record','ph ph-list-checks','var(--muted)',0]]],
    ].map(([name,icon,iconBg,color,trigger,status,statusColor,on,steps]) => ({
      name,icon,iconBg,color,trigger,status,statusColor, toggleBg: on?'var(--accent)':'var(--surface-3)', knob: on?'right':'left', knobLeft: on?'19px':'2px',
      steps: steps.map(([label,si,sc,hasArrow],idx) => ({label, icon:si, color:sc, arrow: idx < steps.length-1})) }));

    // logs
    const logFilters = ['All','Published','Failed','Retried','Scheduled'].map((label,i)=>({label, border:i===0?'var(--accent-border)':'var(--border)', bg:i===0?'var(--accent-soft)':'var(--surface)', fg:i===0?'var(--accent-ink)':'var(--text-2)', weight:i===0?600:450}));
    const logs = [
      ['Published to LinkedIn','— Company Page','ph-bold ph-check','var(--accent-soft)','var(--accent)','job_9f3a2c','','linkedin.com/posts/…','Published','var(--accent-soft)','var(--accent-ink)','2m ago'],
      ['Published to Facebook','— Dev Insights','ph-bold ph-check','var(--accent-soft)','var(--accent)','job_9f3a2b','','fb.com/devinsights/…','Published','var(--accent-soft)','var(--accent-ink)','8m ago'],
      ['Retry succeeded on X','— @devinsights, attempt 2','ph ph-arrows-clockwise','var(--blue-soft)','var(--blue)','job_8e1d44','exponential backoff +32s','x.com/devinsights/…','Recovered','var(--blue-soft)','var(--blue)','31m ago'],
      ['Publishing failed on Instagram','— token expired','ph-bold ph-x','var(--red-soft)','var(--red)','job_8d9a01','moved to dead-letter queue','','Failed','var(--red-soft)','var(--red)','1h ago'],
      ['Rate limit hit on X','— waiting for window','ph ph-clock-countdown','var(--amber-soft)','var(--amber)','job_8c22f0','retry scheduled 14:05','','Deferred','var(--amber-soft)','var(--amber)','1h ago'],
      ['Content ingested from n8n','— idempotency ok','ph ph-download-simple','var(--violet-soft)','var(--violet)','evt_7f3a9c','source: n8n','','Queued','var(--surface-3)','var(--muted)','2h ago'],
      ['Scheduled 3 platform posts','— from content idea #128','ph ph-calendar-plus','var(--surface-3)','var(--muted)','job_8b7e12','','','Scheduled','var(--accent-soft)','var(--accent-ink)','3h ago'],
      ['Image generated','— DALL·E 3, 1080×1080','ph ph-image','var(--violet-soft)','var(--violet)','img_6a2b11','','','Done','var(--surface-3)','var(--muted)','3h ago'],
      ['Published to Facebook','— Studio Updates','ph-bold ph-check','var(--accent-soft)','var(--accent)','job_8a01cd','','fb.com/studio/…','Published','var(--accent-soft)','var(--accent-ink)','5h ago'],
      ['Partial publish','— 2/3 platforms, X deferred','ph ph-warning','var(--amber-soft)','var(--amber)','job_89f2a0','per-platform isolation held','','Partial','var(--amber-soft)','var(--amber)','6h ago'],
    ].map(([title,detail,icon,iconBg,color,id,attempt,url,status,badgeBg,badgeFg,time]) => ({title,detail,icon,iconBg,color,id,attempt,url,status,badgeBg,badgeFg,time}));

    // analytics
    const analyticsStats = [
      ['Total published','1,284','all time'],['Success rate','98.1%','last 30 days'],
      ['Failed jobs','4','2 recovered'],['Avg / week','47','across 6 accounts'],
    ].map(([label,value,sub])=>({label,value,sub}));
    const platformBars = [
      ['facebook','Facebook','412','92%'],['linkedin','LinkedIn','368','82%'],['x','X / Twitter','284','63%'],
      ['instagram','Instagram','142','32%'],['threads','Threads','54','12%'],['pinterest','Pinterest','24','6%'],
    ].map(([p,name,count,pct]) => ({name,count,pct, icon:this.pIcon(p), color:this.pColor(p)}));
    const publishedUrls = [
      ['linkedin','Case study: 40% faster builds','linkedin.com/posts/company-page_case…'],
      ['facebook','Headless WordPress, explained','facebook.com/devinsights/posts/9f3a…'],
      ['x','Quick tip: headless CMS in 2027','x.com/devinsights/status/18234…'],
      ['instagram','Behind the build — design system','instagram.com/p/C9fА2bX…'],
      ['linkedin','5 automations that save 10 hours','linkedin.com/posts/company-page_auto…'],
    ].map(([p,title,url]) => ({title,url, icon:this.pIcon(p), color:this.pColor(p)}));

    // settings
    const settingGroups = [
      ['ph ph-user-circle','Account & Security',[
        ['Single-user authentication','Session-based, protected routes','Enabled',false,'',''],
        ['Two-factor authentication','TOTP for admin login','', true,'var(--accent)','right'],
        ['Encrypted credential vault','Provider keys encrypted at rest','AES-256',false,'',''],
      ]],
      ['ph ph-palette','Appearance',[
        ['Theme',' Light or dark interface', dark?'Dark':'Light',false,'',''],
        ['Density','Comfortable spacing','Balanced',false,'',''],
      ]],
      ['ph ph-bell','Notifications',[
        ['Publishing results','In-app on success & failure','',true,'var(--accent)','right'],
        ['Token expiry warnings','Alert 3 days before expiry','',true,'var(--accent)','right'],
        ['Automation failures','Notify on failed executions','',true,'var(--accent)','right'],
      ]],
      ['ph ph-hard-drives','Infrastructure',[
        ['PostgreSQL','Primary datastore','Connected',false,'',''],
        ['Redis + BullMQ','Persistent job queue','Connected',false,'',''],
        ['S3 object storage','Media assets','Connected',false,'',''],
      ]],
    ].map(([icon,title,rows]) => ({ icon, title, rows: rows.map(([label,desc,value,toggle,toggleBg,knob]) => ({label,desc,value,toggle, toggleBg: toggleBg||'var(--accent)', knob: knob||'right', knobLeft:(knob||'right')==='right'?'19px':'2px'})) }));

    // architecture
    const archFlow = [
      ['Sources',[['OpenAI','ph ph-circle-half','#10a37f'],['Claude','ph ph-asterisk','#d97757'],['Gemini','ph ph-diamond','#4285f4'],['n8n','ph ph-share-network','var(--violet)'],['REST / Webhook','ph ph-webhooks-logo','var(--blue)']]],
      ['Ingestion',[['API Gateway','ph ph-key','var(--blue)'],['Validation (Zod)','ph ph-shield-check','var(--accent)'],['Idempotency','ph ph-fingerprint','var(--muted)']]],
      ['Processing',[['Content engine','ph ph-cpu','var(--accent-ink)'],['Variation engine','ph ph-copy','var(--blue)'],['Image studio','ph ph-image','var(--violet)']]],
      ['Scheduling',[['PostgreSQL','ph ph-database','var(--accent-ink)'],['BullMQ queue','ph ph-queue','var(--amber)'],['Workers','ph ph-gear-six','var(--muted)']]],
      ['Connectors',[['Meta','ph ph-facebook-logo','#2563eb'],['LinkedIn','ph ph-linkedin-logo','#0a66c2'],['X · Provider','ph ph-x-logo','var(--text)'],['+ registry','ph ph-plug','var(--accent-ink)']]],
    ].map(([stage,nodes],i) => ({ stage, nodes:nodes.map(([label,icon,color])=>({label,icon,color})), arrow: i<4, border:'var(--border)', bg:'var(--surface-2)' }));
    const stackLayers = [
      ['FE','Next.js · React · TypeScript (strict) · Tailwind · shadcn/ui · TanStack Query · RHF + Zod'],
      ['API','Node.js services · REST · modular service layer · versioned endpoints'],
      ['DB','PostgreSQL · Prisma ORM · migrations & versioning'],
      ['QUEUE','Redis · BullMQ · persistent jobs · controlled concurrency'],
      ['MEDIA','Sharp · FFmpeg · S3-compatible object storage'],
      ['SEC','Encrypted credentials · OAuth state · CSRF · webhook signatures · rate limiting'],
    ].map(([tag,detail])=>({tag,detail}));
    const reliabilityPoints = [
      'Idempotent publishing with distributed job locking',
      'Retry with exponential backoff + dead-letter queue',
      'Per-platform failure isolation — one failure never blocks others',
      'Status check before retrying uncertain operations (no double-posts)',
      'Worker restart recovery — schedules persist in PostgreSQL',
      'Capability registry hides unsupported actions per connector',
    ];
    const entities = ['ContentItems','PlatformPosts','MediaAssets','MediaVariants','PublishingJobs','PublishingAttempts','SocialAccounts','SocialConnectors','AIProviders','PublishingProviders','WebhookEndpoints','APIKeys','AutomationConfigs','Notifications']
      .map((name,i) => ({ name, bg: i<2?'var(--accent-soft)':'var(--surface-2)', fg: i<2?'var(--accent-ink)':'var(--text-2)', border: i<2?'var(--accent-border)':'var(--border)' }));

    return {
      rootClass: dark ? 'om-dark' : '',
      themeIcon: dark ? 'ph ph-sun' : 'ph ph-moon',
      navSections, r,
      backendIssue: (this.state.backend && this.state.backend.dbIssue) || '',
      pageTitle:t[0], pageSub:t[1], pageTag:t[2],
      toggleTheme:()=>this.toggleTheme(),
      goStudio:this.go('studio'), goSettings:this.go('settings'), goLogs:this.go('logs'),
      goScheduled:this.go('scheduled'), goAccounts:this.go('accounts'), goCalendar:this.go('calendar'),
      goAutomation:this.go('automation'), goIntegrations:this.go('integrations'),
      stats, upcoming, activity, quickActions, healthAccounts,
      ...st,
      genIcon: this.state.generating ? 'ph ph-circle-notch' : 'ph ph-sparkle',
      genSpin: this.state.generating ? 'animation:om-spin 0.8s linear infinite;' : '',
      genLabel: this.state.generating ? 'Generating…' : 'Regenerate all variations',
      imgTools, imgPresets, imgMeta,
      horizons, weekDays, plannerItems,
      calViews, dayHeaders, calCells,
      postFilters, postRows,
      mediaFilters, mediaItems,
      accounts, capCols, capRows,
      aiProviders, apiKeys, webhookEvents,
      autoStats, automations,
      logFilters, logs,
      analyticsStats, platformBars, publishedUrls,
      settingGroups, ...this.hubVals(),
      archFlow, stackLayers, reliabilityPoints, entities,
    };
  }


  componentWillUnmount(){ clearInterval(this._impT); clearTimeout(this._cpT); }
  rnd(n){ try { return Array.from(crypto.getRandomValues(new Uint8Array(n))).map(b=>b.toString(16).padStart(2,'0')).join(''); } catch(e){ return Math.random().toString(16).slice(2, 2+n*2); } }
  download(name, mime, text){ const b = new Blob([text], {type:mime}); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(u), 1500); }
  csv(rows){ return rows.map(r => r.map(v => { v = String(v==null?'':v); return /[",\n]/.test(v) ? '"'+v.replace(/"/g,'""')+'"' : v; }).join(',')).join('\n'); }
  xls(rows){ const esc = v => String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); return '<?xml version="1.0"?>\n<?mso-application progid="Excel.Sheet"?>\n<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Posts"><Table>' + rows.map(r => '<Row>' + r.map(c => '<Cell><Data ss:Type="String">'+esc(c)+'</Data></Cell>').join('') + '</Row>').join('') + '</Table></Worksheet></Workbook>'; }
  parseCSV(text){ const rows=[]; let row=[], f='', q=false; for (let i=0;i<text.length;i++){ const c=text[i]; if(q){ if(c==='"'){ if(text[i+1]==='"'){ f+='"'; i++; } else q=false; } else f+=c; } else { if(c==='"') q=true; else if(c===','){ row.push(f); f=''; } else if(c==='\n'||c==='\r'){ if(c==='\r'&&text[i+1]==='\n') i++; row.push(f); rows.push(row); row=[]; f=''; } else f+=c; } } if(f!==''||row.length){ row.push(f); rows.push(row); } return rows.filter(r => r.some(x => String(x).trim()!=='')); }
  matchField(h){ const x = String(h||'').toLowerCase().trim(); const has = (...a) => a.some(k => x.includes(k));
    if (has('timezone') || x==='tz') return 'Timezone';
    if (has('date','day')) return 'Scheduled date';
    if (has('time','hour')) return 'Scheduled time';
    if (has('alt')) return 'Image alt text';
    if (has('image','media','photo','url','video')) return 'Media URL';
    if (has('hashtag','tags')) return 'Hashtags';
    if (has('account','page','profile')) return 'Target accounts';
    if (has('platform','network','channel')) return 'Platform';
    if (has('facebook') || /^fb\b/.test(x)) return 'Facebook caption';
    if (has('linkedin')) return 'LinkedIn caption';
    if (has('tweet','twitter') || x==='x' || /^x[ _-]/.test(x)) return 'X caption';
    if (has('instagram','insta') || /^ig\b/.test(x)) return 'Instagram caption';
    if (has('pinterest')) return 'Pinterest caption';
    if (has('thread')) return 'Threads caption';
    if (has('content','caption','copy','text','post','body','message')) return 'Base caption';
    return '— Ignore —'; }
  sampleImport(){
    const headers = ['Post Date','Time','General Copy','FB Text','LinkedIn','Tweet','IG Caption','Image','Tags','Accounts','Notes'];
    const topics = ['AI in WordPress development','Headless CMS in 2027','Automations that save 10 hours','Core Web Vitals checklist','Design systems that scale','Shipping faster with CI/CD','Accessibility quick wins','Choosing a hosting stack','Content strategy for developers','Security hardening basics','Image optimization tips','Why we moved to TypeScript'];
    const rows = [];
    for (let d=0; d<365; d++){ const dt = new Date(2027,0,1+d); const ds = dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0')+'-'+String(dt.getDate()).padStart(2,'0'); const t = topics[d%topics.length]; const base = t+' (part '+(Math.floor(d/topics.length)+1)+')';
      rows.push([ds, ['09:00','14:30','19:00'][d%3], base+': what changed and why it matters.', d%2 ? base+'. What would you try first?' : '', d%3===0 ? base+'. Three lessons from shipping it in production.' : '', d%4===1 ? base+' →' : '', d%5===2 ? base+'. Save this for later.' : '', 'https://cdn.example.com/plan/'+(d+1)+'.webp', '#WebDev #AI', 'Dev Insights; Company Page', '']); }
    rows[13][0] = '2027-02-31';
    [2,3,4,5,6].forEach(i => rows[36][i] = '');
    rows[53][5] = 'A long thread opener about everything we learned moving to headless WordPress this year: hosting, caching, previews, editorial workflow, image pipelines, search, translations and the long tail of plugins we had to replace along the way. Thread below, with the numbers.';
    rows[87][3] = rows[61][3];
    rows[150][1] = '25:00';
    rows[200][0] = '';
    return { name:'content-plan-2027.xlsx', size:184320, ext:'xlsx', sample:true, headers, rows };
  }
  validateImport(imp, map, structure){
    const key = imp.name+'|'+imp.rows.length+'|'+map.join(',')+'|'+structure+'|'+(this.state.impRev||0);
    if (this._vc && this._vc.key===key) return this._vc.val;
    const idx = f => map.indexOf(f);
    const di=idx('Scheduled date'), ti=idx('Scheduled time'), bi=idx('Base caption'), pi=idx('Platform');
    const PL=[['Facebook caption','facebook'],['Instagram caption','instagram'],['LinkedIn caption','linkedin'],['X caption','x'],['Pinterest caption','pinterest'],['Threads caption','threads']];
    const LIM={facebook:63206,instagram:2200,linkedin:3000,x:280,pinterest:500,threads:500,youtube:5000,tiktok:2200};
    const norm = v => { const x=String(v||'').trim().toLowerCase(); const m={facebook:'facebook',fb:'facebook',instagram:'instagram',ig:'instagram',insta:'instagram',linkedin:'linkedin',li:'linkedin',x:'x',twitter:'x','x/twitter':'x',pinterest:'pinterest',threads:'threads',youtube:'youtube',tiktok:'tiktok'}; return m[x]||null; };
    const realDate = d => { const s=String(d||'').trim(); const m=/^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s); if(m){ const dt=new Date(+m[1],+m[2]-1,+m[3]); return dt.getMonth()===+m[2]-1 && dt.getDate()===+m[3]; } return s!=='' && !isNaN(Date.parse(s)); };
    const realTime = t => { const m=/^(\d{1,2}):(\d{2})/.exec(String(t||'').trim()); return !!m && +m[1]<24 && +m[2]<60; };
    const issues=[], posts=[]; const seen=new Map(); let invalidRows=0, warnings=0, dups=0, detected=0; const dates=[];
    imp.rows.forEach((row,r) => { const n=r+2; const ri=[]; const date=di>=0?row[di]:'', time=ti>=0?row[ti]:'';
      if (di<0 || !realDate(date)) ri.push({sev:'error', type:'Invalid date', msg: di<0 ? 'No column is mapped to Scheduled date' : (String(date||'').trim() ? '"'+date+'" is not a real date' : 'Scheduled date is empty'), col:di});
      if (ti>=0 && String(time||'').trim() && !realTime(time)) ri.push({sev:'error', type:'Invalid time', msg:'"'+time+'" is not a valid time', col:ti});
      const rp=[];
      if (structure==='B'){ const p = pi>=0 ? norm(row[pi]) : null; const c = bi>=0 ? row[bi] : ''; if (pi>=0 && !p) ri.push({sev:'error', type:'Unsupported platform', msg:'"'+(row[pi]||'')+'" is not a supported platform', col:pi}); if (p && String(c||'').trim()) rp.push({p, c, col:bi}); }
      else { PL.forEach(([f,p]) => { const i=idx(f); if (i>=0 && String(row[i]||'').trim()) rp.push({p, c:row[i], col:i}); }); if (!rp.length && bi>=0 && String(row[bi]||'').trim()) rp.push({p:'all', c:row[bi], col:bi}); }
      if (!rp.length && !ri.some(x=>x.type==='Unsupported platform')) ri.push({sev:'error', type:'Missing content', msg:'No caption in any content column', col:bi});
      detected += rp.length;
      const hasErr = ri.some(x=>x.sev==='error'); if (hasErr) invalidRows++;
      rp.forEach(x => { const lim=LIM[x.p]; const len=String(x.c).length; if (lim && len>lim){ ri.push({sev:'warn', type:'Over limit', msg:this.pName(x.p)+' caption is '+len+' / '+lim+' characters', col:x.col}); warnings++; }
        const k = x.p+'|'+String(x.c).trim().toLowerCase(); if (seen.has(k)){ ri.push({sev:'warn', type:'Duplicate', msg:'Same '+(x.p==='all'?'':this.pName(x.p)+' ')+'caption as row '+seen.get(k)+' — excluded', col:x.col}); dups++; x.dup=true; } else seen.set(k, n);
        if (!hasErr && !x.dup){ posts.push({p:x.p, c:x.c, row:n, date, time}); dates.push(String(date)); } });
      ri.forEach(i => issues.push(Object.assign({row:n, r}, i)));
    });
    dates.sort();
    const val = { rows:imp.rows.length, detected, valid:posts.length, invalidRows, warnings, dups, issues, posts, range: dates.length ? dates[0]+' → '+dates[dates.length-1] : '—' };
    this._vc = { key, val }; return val;
  }
  onImportFile(e){ const file = e.target.files && e.target.files[0]; if (!file) return; e.target.value='';
    const ext = file.name.split('.').pop().toLowerCase(); const base = { name:file.name, size:file.size, ext };
    if (ext==='csv' || ext==='json'){ const rd = new FileReader(); rd.onload = () => { try { let headers=[], rows=[]; if (ext==='csv'){ const all=this.parseCSV(String(rd.result)); headers=all[0]||[]; rows=all.slice(1).map(r => headers.map((_,i)=>r[i]==null?'':r[i])); } else { const data=JSON.parse(String(rd.result)); const arr=Array.isArray(data)?data:(data.posts||data.items||[]); headers=Array.from(new Set([].concat(...arr.map(o=>Object.keys(o||{}))))); rows=arr.map(o=>headers.map(h=>o[h]==null?'':(typeof o[h]==='object'?JSON.stringify(o[h]):String(o[h])))); }
        if (!headers.length || !rows.length) throw new Error('no header row or data rows found');
        this.setState({ imp:Object.assign(base,{headers,rows}), impMap:null, impStructure:null, impStep:1, impError:null, impEdit:null }); } catch(err){ this.setState({ impError:'Could not read '+file.name+': '+err.message+'.' }); } };
      rd.readAsText(file); }
    else this.setState({ impError: ext.toUpperCase()+' files are parsed on the server in production (SheetJS for Excel, table extraction for PDF). This browser prototype reads CSV and JSON directly — export your sheet as CSV, or load the sample year plan.' }); }
  startImport(){ clearInterval(this._impT); this.setState({ impStep:4, impProgress:0 }); this._impT = setInterval(() => { const p = Math.min(100, (this.state.impProgress||0)+4); this.setState({ impProgress:p }); if (p>=100) clearInterval(this._impT); }, 60); }
  n8nWorkflow(kind){
    const send = { parameters:{ method:'POST', url:'https://omnipost.mydomain.com/api/v1/content', authentication:'genericCredentialType', genericAuthType:'httpHeaderAuth', sendHeaders:true, headerParameters:{ parameters:[{ name:'Idempotency-Key', value:'={{ $execution.id }}-{{ $itemIndex }}' }] }, sendBody:true, specifyBody:'json', jsonBody:'={ "source": "n8n", "content": { "topic": {{ JSON.stringify($json.topic || "") }}, "base_caption": {{ JSON.stringify($json.caption || "") }}, "image_url": {{ JSON.stringify($json.image_url || null) }} }, "platforms": ["facebook", "linkedin"], "schedule": { "mode": "draft" } }' }, name:'Send to OmniPost', type:'n8n-nodes-base.httpRequest', typeVersion:4.2, position:[320,0], credentials:{ httpHeaderAuth:{ name:'OmniPost API key' } } };
    const triggers = {
      weekly:{ parameters:{ rule:{ interval:[{ field:'weeks', triggerAtDay:[1], triggerAtHour:9 }] } }, name:'Every Monday 09:00', type:'n8n-nodes-base.scheduleTrigger', typeVersion:1.2, position:[0,0] },
      sheet:{ parameters:{ event:'rowAdded', pollTimes:{ item:[{ mode:'everyHour' }] } }, name:'New Google Sheets row', type:'n8n-nodes-base.googleSheetsTrigger', typeVersion:1, position:[0,0] },
      events:{ parameters:{ httpMethod:'POST', path:'omnipost-events', options:{} }, name:'OmniPost event', type:'n8n-nodes-base.webhook', typeVersion:2, position:[0,0] }
    };
    const t = triggers[kind];
    const second = kind==='events' ? { parameters:{ method:'GET', url:'=https://omnipost.mydomain.com/api/v1/posts/{{ $json.body.post_id }}/status', authentication:'genericCredentialType', genericAuthType:'httpHeaderAuth' }, name:'Fetch publishing status', type:'n8n-nodes-base.httpRequest', typeVersion:4.2, position:[320,0], credentials:{ httpHeaderAuth:{ name:'OmniPost API key' } } } : send;
    const names = { weekly:'OmniPost — weekly AI post to draft', sheet:'OmniPost — Google Sheet row to draft', events:'OmniPost — react to publish events' };
    const conn = {}; conn[t.name] = { main:[[{ node:second.name, type:'main', index:0 }]] };
    return JSON.stringify({ name:names[kind], nodes:[t, second], connections:conn, settings:{ executionOrder:'v1' }, meta:{ templateCredsSetupCompleted:false } }, null, 2);
  }

  /** Maps a row from /api/posts to the shape the Posts list and Calendar use. */
  fromDbPost(p){
    const tz = p.timezone || 'Asia/Dhaka';
    const z = p.scheduled_at ? isoToZoned(p.scheduled_at, tz) : null;
    const name = { facebook:'Facebook', instagram:'Instagram', linkedin:'LinkedIn', x:'X', threads:'Threads' }[p.platform] || p.platform;
    return { id:p.id, title:p.title, excerpt:(p.caption||'').slice(0,60)+((p.caption||'').length>60?'…':''), platforms:[p.platform], account:p.account||'—',
      when: z ? formatSchedule(z.date, z.time, tz).split(' · ').slice(0,2).join(' · ') : '—', status:p.status, date: z ? z.date : '', label:name, source:p.source };
  }

  /** Detects the real backend and loads stored posts. Silent no-op in prototype mode. */
  async loadBackend(){
    try {
      const st = await fetch('/api/status', { cache:'no-store' });
      if (!st.ok) return;
      const backend = await st.json();
      this.setState({ backend });
      if (!backend.db) return;
      const r = await fetch('/api/posts', { cache:'no-store' });
      if (r.ok) this.setState({ studioPosts:(await r.json()).posts.map(p => this.fromDbPost(p)) });
    } catch {}
  }

  // ---- AI Content Studio: editable brief, per-platform variations, drafts and scheduling
  studioVals(varData){
    const s = this.state;
    const set = p => this.setState(p);
    const brief = Object.assign({ model:'claude-sonnet-4-5', topic:'The future of AI in WordPress development', tone:'Authoritative', language:'English', keyword:'AI web development', platforms:ALL_PLATFORMS.slice() }, s.sBrief);
    const setBrief = patch => set({ sBrief:Object.assign({}, brief, patch) });
    const sched = Object.assign({ date:'2027-01-15', time:'10:00', tz:'Asia/Dhaka' }, s.sSched);
    const vars = {}; ALL_PLATFORMS.forEach(p => { vars[p] = Object.assign({}, varData[p], (s.sVars||{})[p]); });
    const setVar = (p, patch) => set({ sVars:Object.assign({}, s.sVars, { [p]:Object.assign({}, (s.sVars||{})[p], patch) }) });
    const notify = (text, tone='ok') => { clearTimeout(this._noticeT); set({ sNotice:{ text, tone } }); this._noticeT = setTimeout(()=>this.setState({ sNotice:null }), 5000); };
    const mockNote = 'Prototype mode: this ran through the mock AI adapter. Connect a real API key under AI Providers to get actual AI output.';

    const selected = brief.platforms;
    let ap = s.activePlatform;
    if (!selected.includes(ap) && selected.length) ap = selected[0];
    const av = vars[ap];
    const limitNum = CAPTION_LIMITS[ap];
    const chars = av.caption.length;
    const overLimit = chars > limitNum;

    const varTabs = ALL_PLATFORMS.filter(p => selected.includes(p)).map(p => ({ name:vars[p].name, icon:this.pIcon(p), go:()=>set({ activePlatform:p }),
      border: ap===p ? 'var(--accent-border)':'var(--border)', bg: ap===p ? 'var(--accent-soft)':'var(--surface)',
      fg: ap===p ? 'var(--accent-ink)':'var(--text-2)', weight: ap===p?600:450 }));

    const activeVar = { ...av, platform:ap, color:this.pColor(ap), icon:this.pIcon(ap), chars, tagCount:av.tags.length,
      limit:limitNum.toLocaleString('en-US'), limitColor: overLimit ? 'var(--red)' : 'var(--muted)', overLimit,
      schedule: formatSchedule(sched.date, sched.time, sched.tz), tagText: av.tags.join(' ') };

    const platformChips = ALL_PLATFORMS.map(p => { const on = selected.includes(p); return {
      name:vars[p].name.split(' ')[0], icon:this.pIcon(p), on,
      border: on?'var(--accent-border)':'var(--border)', bg: on?'var(--accent-soft)':'var(--surface)', fg: on?'var(--accent-ink)':'var(--muted)',
      toggle:()=>{ if (on && selected.length===1) return notify('Keep at least one platform selected.','warn');
        setBrief({ platforms: on ? selected.filter(x=>x!==p) : ALL_PLATFORMS.filter(x=>x===p||selected.includes(x)) }); } }; });

    const runMock = (label, apply) => {
      if (s.generating) return;
      set({ generating:true });
      const m = STUDIO_MODELS.find(x=>x.model===brief.model) || STUDIO_MODELS[0];
      const adapter = aiAdapters.has(m.provider) ? aiAdapters.get(m.provider) : aiAdapters.get(DEFAULT_AI_PROVIDER);
      adapter.generateStructuredContent({ topic:brief.topic, focusKeyword:brief.keyword, tone:brief.tone, language:brief.language, platforms:selected }, m.model)
        .then(res => { if (!res.ok) return notify(label+' failed: '+res.error.message, 'warn'); if (apply) apply(res); notify(label+' — '+mockNote, 'info'); })
        .catch(() => notify(label+' failed.', 'warn'))
        .finally(()=>this.setState({ generating:false }));
    };

    const be = s.backend || {};
    const runAI = (label, platforms, apply) => {
      if (s.generating) return;
      const m = STUDIO_MODELS.find(x=>x.model===brief.model) || STUDIO_MODELS[0];
      set({ generating:true });
      fetch('/api/generate', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ topic:brief.topic, platforms, tone:brief.tone, language:brief.language, keyword:brief.keyword, model:m.openrouter }) })
        .then(r => r.json().then(j => ({ ok:r.ok, j })))
        .then(({ ok, j }) => {
          if (!ok) return notify(label+' failed: '+(j.error||'unknown error'), 'warn');
          const patch = {};
          j.variations.forEach(x => { patch[x.platform] = Object.assign({}, (s.sVars||{})[x.platform], { headline:x.headline, caption:x.caption, tags:x.hashtags, cta:x.cta, alt:x.image_alt }); });
          this.setState({ sVars:Object.assign({}, this.state.sVars, patch) });
          if (apply) apply(j);
          notify(label+' with '+j.model+'.');
        })
        .catch(() => notify(label+' failed: network error.', 'warn'))
        .finally(()=>this.setState({ generating:false }));
    };
    const kwTag = '#'+brief.keyword.replace(/[^\p{L}\p{N}]+/gu,'');
    const generate = () => be.ai ? runAI('Generated '+selected.length+' variation(s)', selected) : runMock('Variations refreshed for '+selected.length+' platform(s)', () => {
      const patch = {};
      selected.forEach(p => { const cur = vars[p]; const tags = cur.tags.some(t=>t.toLowerCase()===kwTag.toLowerCase()) || kwTag==='#' ? cur.tags : [kwTag].concat(cur.tags);
        patch[p] = Object.assign({}, (s.sVars||{})[p], { headline: brief.topic, tags }); });
      set({ sVars:Object.assign({}, s.sVars, patch) });
    });

    const rewriteActions = [
      ['Regenerate','ph ph-arrows-clockwise', () => be.ai ? runAI('Regenerated '+av.name, [ap]) : runMock('Regenerated '+av.name, () => setVar(ap, { headline:brief.topic }))],
      ['Shorten to fit','ph ph-arrows-in-line-horizontal', () => { const next = shortenToLimit(av.caption, overLimit ? limitNum : Math.max(40, Math.floor(chars*0.7)));
        setVar(ap, { caption:next }); notify('Caption shortened from '+chars+' to '+next.length+' characters.'); }],
      ['Change tone','ph ph-sliders', () => { const i = STUDIO_TONES.indexOf(brief.tone); const tone = STUDIO_TONES[(i+1)%STUDIO_TONES.length]; setBrief({ tone }); be.ai ? notify('Tone set to '+tone+'. Press Regenerate to rewrite with it.') : runMock('Tone set to '+tone); }],
      ['Translate','ph ph-translate', () => be.ai ? runAI('Rewritten in '+brief.language, [ap]) : runMock('Translate to '+brief.language)],
      [s.sEdit ? 'Done editing' : 'Edit','ph '+(s.sEdit?'ph-check':'ph-pencil-simple'), () => set({ sEdit:!s.sEdit })],
    ].map(([label,icon,run])=>({ label, icon, run, active: label==='Done editing' }));

    const savePost = (status, done) => {
      if (!be.db) { addPost(status); return done(); }
      const body = { platform:ap, title:av.headline || brief.topic, account:av.account, headline:av.headline, caption:av.caption, hashtags:av.tags, cta:av.cta, image_alt:av.alt, status };
      if (status==='scheduled') Object.assign(body, { scheduled_at:zonedToIso(sched.date, sched.time, sched.tz), timezone:sched.tz });
      fetch('/api/posts', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify(body) })
        .then(r => r.json().then(j => ({ ok:r.ok, j })))
        .then(({ ok, j }) => { if (!ok) return notify('Could not save: '+(j.error||'unknown error'), 'warn'); this.setState({ studioPosts:[this.fromDbPost(j.post)].concat(this.state.studioPosts||[]) }); done(); })
        .catch(() => notify('Could not save: network error.', 'warn'));
    };
    const addPost = (status) => {
      const when = status==='draft' ? '—' : formatSchedule(sched.date, sched.time, sched.tz).split(' · ').slice(0,2).join(' · ');
      const post = { id:'st_'+this.rnd(5), title:av.headline || brief.topic, excerpt:av.caption.slice(0,60)+'…', platforms:[ap], account:av.account, when, status, date:sched.date, label:av.name.split(' ')[0] };
      set({ studioPosts:[post].concat(s.studioPosts||[]) });
      return post;
    };
    const saveDraft = () => savePost('draft', () => notify(av.name+' draft saved'+(be.db?' to the database':'')+' — find it under Drafts.'));
    const addToCalendar = () => {
      if (!sched.date || !sched.time) return notify('Pick a date and time first.','warn');
      if (overLimit) return notify('Caption is over the '+av.name+' limit. Use “Shorten to fit” first.','warn');
      savePost('scheduled', () => { notify(av.name+' post scheduled for '+formatSchedule(sched.date, sched.time, sched.tz)+'.'); this.setState({ route:'calendar' }); });
    };

    return {
      varTabs, activeVar, platformChips, rewriteActions,
      generate, saveDraft, addToCalendar,
      brief, sched, studioEditing: !!s.sEdit, studioNotice: s.sNotice,
      aiModeLabel: (be.ai ? 'AI: OpenRouter' : 'AI: mock (no OpenRouter key)')+' · '+(be.db ? 'saved to Supabase' : 'not saved'), aiModeColor: be.ai && be.db ? 'var(--accent-ink)' : 'var(--amber)',
      studioModels: STUDIO_MODELS, studioTones: STUDIO_TONES, studioLanguages: STUDIO_LANGUAGES,
      setBriefField: (k, val) => setBrief({ [k]:val }),
      setSchedField: (k, val) => set({ sSched:Object.assign({}, sched, { [k]:val }) }),
      setVarField: (k, val) => setVar(ap, { [k]: k==='tags' ? parseHashtags(val) : val }),
      editImage: this.go('image'),
      dismissNotice: () => set({ sNotice:null }),
    };
  }

  hubVals(){
    const s = this.state, set = o => this.setState(o);
    const ST = {
      connected:['Connected','var(--accent-ink)','var(--accent-soft)','var(--accent-border)'],
      disconnected:['Disconnected','var(--muted)','var(--surface-2)','var(--border)'],
      error:['Connection Error','var(--red)','var(--red-soft)','rgba(220,38,38,0.25)'],
      auth:['Authentication Required','var(--amber)','var(--amber-soft)','rgba(217,119,6,0.28)'],
      running:['Running · mock','var(--accent-ink)','var(--accent-soft)','var(--accent-border)'],
    };
    const ov = s.connOverride || {}, mk = s.connMock || {};
    const stOf = (id, def) => ov[id] || def;
    const pill = (k, mock) => { const a = ST[k]; return { statusKey:k, statusLabel: (mock && k==='connected') ? a[0]+' · mock' : a[0], statusFg:a[1], statusBg:a[2], statusBorder:a[3] }; };
    const tog = on => ({ toggleBg: on ? 'var(--accent)' : 'var(--surface-3)', knobLeft: on ? '17px' : '2px' });
    const pick = on => ({ border: on?'var(--accent)':'var(--border)', bg: on?'var(--accent-soft)':'var(--surface)', dot: on?'var(--accent)':'transparent', dotBorder: on?'var(--accent)':'var(--border-strong)' });
    const copy = txt => () => { try { navigator.clipboard && navigator.clipboard.writeText(txt); } catch(e){} set({ copied:txt }); clearTimeout(this._cpT); this._cpT = setTimeout(() => this.setState({ copied:null }), 1400); };
    const cl = (txt, label) => s.copied===txt ? 'Copied' : (label || 'Copy');
    const setConn = (id, k, mock) => set({ connOverride:Object.assign({}, ov, {[id]:k}), connMock:Object.assign({}, mk, {[id]:!!mock}) });
    const stepper = (names, cur) => names.map((label,i) => { const done=i<cur, now=i===cur; return { label, num: done?'':String(i+1), icon: done?'ph-bold ph-check':'', bg: done?'var(--accent)':now?'var(--primary)':'var(--surface-2)', fg: done?'#fff':now?'var(--primary-text)':'var(--muted)', border: done?'var(--accent)':now?'var(--primary)':'var(--border)', labelColor: now?'var(--text)':'var(--muted)', weight: now?600:450 }; });
    const T = {}; ['ai','mcp','automation','api','webhooks','imports','apps','activity'].forEach(k => T[k] = (s.intTab||'ai')===k);

    // ---- AI providers
    const PROV = [
      {id:'openai', name:'OpenAI / ChatGPT', icon:'ph ph-circle-half', color:'#10a37f', auth:['API key'], status:'connected', models:'GPT-4.1, GPT-4o, o3, o4-mini · 24 models', help:'platform.openai.com → API keys', endpoint:'https://api.openai.com/v1', caps:['Text','Images','Vision','Tool calling','JSON output'], ph:'sk-proj-…'},
      {id:'anthropic', name:'Anthropic Claude', icon:'ph ph-asterisk', color:'#d97757', auth:['API key'], status:'connected', models:'Claude Sonnet 4.5, Opus 4.1, Haiku 4.5 · 9 models', help:'console.anthropic.com → API keys', endpoint:'https://api.anthropic.com/v1', caps:['Text','Vision','Tool calling','JSON output'], ph:'sk-ant-…'},
      {id:'gemini', name:'Google Gemini', icon:'ph ph-diamond', color:'#4285f4', auth:['API key','Google OAuth (Vertex AI)'], status:'connected', models:'Gemini 2.5 Pro, 2.5 Flash, Imagen · 12 models', help:'aistudio.google.com → Get API key', endpoint:'https://generativelanguage.googleapis.com/v1beta', caps:['Text','Images','Vision','Tool calling','JSON output'], ph:'AIza…'},
      {id:'openrouter', name:'OpenRouter', icon:'ph ph-shuffle', color:'#6366f1', auth:['OAuth (PKCE)','API key'], status:'auth', models:'Claude, GPT, Gemini, Llama, Mistral · 300+ models', help:'openrouter.ai → Keys', endpoint:'https://openrouter.ai/api/v1', caps:['Text','Vision','Tool calling','Per-model routing'], ph:'sk-or-v1-…', err:'Sign-in expired — authorize again'},
      {id:'xai', name:'xAI Grok', icon:'ph ph-lightning-slash', color:'var(--text)', auth:['API key'], status:'disconnected', models:'Grok 4, Grok 3 mini, Grok image', help:'console.x.ai → API keys', endpoint:'https://api.x.ai/v1', caps:['Text','Vision','Images','Tool calling'], ph:'xai-…'},
      {id:'deepseek', name:'DeepSeek', icon:'ph ph-waves', color:'#4d6bfe', auth:['API key'], status:'error', models:'deepseek-chat, deepseek-reasoner', help:'platform.deepseek.com → API keys', endpoint:'https://api.deepseek.com/v1', caps:['Text','Tool calling','JSON output'], ph:'sk-…', err:'Last test: 401 — key revoked at provider'},
      {id:'mistral', name:'Mistral AI', icon:'ph ph-wind', color:'#fa520f', auth:['API key'], status:'disconnected', models:'Mistral Large, Mistral Medium, Pixtral', help:'console.mistral.ai → API keys', endpoint:'https://api.mistral.ai/v1', caps:['Text','Vision','Tool calling','JSON output'], ph:'…'},
      {id:'meta', name:'Meta Llama', icon:'ph ph-infinity', color:'#0668e1', auth:['API key'], status:'disconnected', models:'Llama 4 Maverick, Llama 4 Scout', help:'Llama API console (or route Llama through OpenRouter)', endpoint:'https://api.llama.com/compat/v1', caps:['Text','Vision'], ph:'LLM|…'},
      {id:'qwen', name:'Qwen (Alibaba Cloud)', icon:'ph ph-cloud', color:'#615ced', auth:['API key'], status:'disconnected', models:'Qwen-Max, Qwen-Plus, Qwen-VL', help:'Alibaba Cloud Model Studio → API keys', endpoint:'https://dashscope-intl.aliyuncs.com/compatible-mode/v1', caps:['Text','Vision','Tool calling'], ph:'sk-…'},
      {id:'custom', name:'OpenAI-compatible', icon:'ph ph-plug', color:'var(--muted)', auth:['API key','No auth (local)'], status:'disconnected', models:'Ollama, LM Studio, vLLM, Together, Groq…', help:'your provider’s dashboard', endpoint:'(the base URL you enter)', caps:['Detected from /models on test'], ph:'optional'},
    ];
    PROV.forEach(p => { p.modelList = p.id==='custom' ? ['Detected on test'] : p.models.split(' · ')[0].split(', '); });
    const wp = PROV.find(p => p.id===s.wizProvider) || PROV[3];
    const hubProviders = PROV.map(p => { const k = stOf(p.id, p.status); return Object.assign({}, p, pill(k, mk[p.id]), { err: ov[p.id] ? '' : (p.err||''), authText: p.auth.join(' · '), action: {connected:'Test',auth:'Authorize',error:'Reconnect',disconnected:'Connect'}[k], border: wp.id===p.id ? 'var(--accent)' : 'var(--border)', open: () => set({ wizProvider:p.id, wizStep:1, wizAuth:0, wizTested:false, wizSaved:null, wizModels:null, advOpen:false }) }); });
    const authDesc = { 'OAuth (PKCE)':'Sign in on '+wp.name+' and approve. A scoped key is issued to OmniPost automatically — nothing to copy.', 'Google OAuth (Vertex AI)':'Sign in with Google Cloud. Uses your Vertex AI project billing and quotas.', 'API key':'Paste one key. It is encrypted and stored on the server only.', 'No auth (local)':'For servers on your own network such as Ollama or LM Studio.' };
    const wizAuthOpts = wp.auth.map((a,i) => Object.assign({ label:a, desc:authDesc[a], rec: i===0 && wp.auth.length>1 ? 'Recommended' : '', go:()=>set({ wizAuth:i }) }, pick((s.wizAuth||0)===i)));
    const authSel = wp.auth[s.wizAuth||0] || wp.auth[0];
    const isOAuth = authSel.indexOf('OAuth')>-1;
    const wm = s.wizModels || {};
    const wizModels = wp.modelList.map((m,i) => { const on = wm[m]!==undefined ? wm[m] : i<2; return { name:m, on, box: on?'var(--accent)':'var(--surface)', boxBorder: on?'var(--accent)':'var(--border-strong)', check: on?'ph-bold ph-check':'', toggle:()=>set({ wizModels:Object.assign({}, wm, {[m]:!on}) }) }; });
    wizModels.forEach((m,i) => m.isDefault = m.on && wizModels.findIndex(x=>x.on)===i);
    const step = s.wizStep||0;
    const wz = {}; [0,1,2,3,4].forEach(i => wz['s'+i] = step===i);
    const wiz = { name:wp.name, icon:wp.icon, color:wp.color, help:wp.help, keyPlaceholder:wp.ph, caps:wp.caps, stepNum:step+1,
      isOAuth, isKey: !isOAuth && authSel==='API key', isLocal: authSel==='No auth (local)', isCustom: wp.id==='custom',
      endpointText: wp.endpoint, advOpen: !!s.advOpen, advCaret: s.advOpen ? 'ph ph-caret-down' : 'ph ph-caret-right',
      authorizeLabel: s.wizAuthorizing ? 'Waiting for '+wp.name+'…' : 'Continue with '+wp.name, authIcon: s.wizAuthorizing ? 'ph ph-circle-notch' : 'ph ph-sign-in', authSpin: s.wizAuthorizing ? 'animation:om-spin 0.8s linear infinite;' : '',
      modelCount: wizModels.filter(m=>m.on).length, tested: !!s.wizTested, saved: s.wizSaved===wp.id, latency: 380 + (wp.id.length*37)%240,
      testLabel: s.wizTesting ? 'Testing…' : (s.wizTested ? 'Run test again' : 'Run connection test'), testIcon: s.wizTesting ? 'ph ph-circle-notch' : 'ph ph-plugs-connected', testSpin: s.wizTesting ? 'animation:om-spin 0.8s linear infinite;' : '',
      backOpacity: step===0 ? 0.4 : 1, nextOpacity: step===4 && !s.wizTested ? 0.4 : 1,
      nextLabel: step===4 ? (s.wizSaved===wp.id ? 'Saved' : 'Save connection') : step===0 ? 'Continue' : 'Next' };
    const wizPick = PROV.map(p => Object.assign({ name:p.name, icon:p.icon, color:p.color, go:()=>set({ wizProvider:p.id, wizStep:1, wizAuth:0, wizTested:false, wizSaved:null, wizModels:null }) }, pick(p.id===wp.id)));

    // ---- MCP
    const mcpUrl = (s.backend && s.backend.mcpUrl) || ((s.origin || 'https://post.avonixai.com') + '/mcp');
    const snippet = JSON.stringify({ mcpServers:{ omnipost:{ type:'http', url:mcpUrl } } }, null, 2);
    const off = s.mcpOff || {};
    const TOOLS = [
      ['create_post_draft','Create a draft with caption, platforms, accounts and metadata','write'],
      ['update_post','Edit caption, title, hashtags or platform variations of a draft','write'],
      ['attach_media','Upload an image/video or attach one by URL, with alt text','write'],
      ['list_media','Search the media library','read'],
      ['list_drafts','List drafts and their sources','read'],
      ['list_scheduled_posts','List upcoming scheduled posts','read'],
      ['list_social_accounts','List connected accounts and what each supports','read'],
      ['update_post_metadata','Set SEO filename, alt text, focus keyword','write'],
      ['delete_draft','Delete a draft (published posts can’t be deleted)','write'],
      ['submit_for_approval','Move a draft into Pending Approval','write'],
      ['schedule_approved_post','Schedule a post that is already approved','publish'],
    ];
    const scopeTone = { read:['var(--blue-soft)','var(--blue)'], write:['var(--accent-soft)','var(--accent-ink)'], publish:['var(--amber-soft)','var(--amber)'] };
    const mcpTools = TOOLS.map(([name,desc,scope]) => { const on = !off[name]; return Object.assign({ name, desc, scope, scopeBg:scopeTone[scope][0], scopeFg:scopeTone[scope][1], nameColor: on?'var(--text)':'var(--faint)', toggle:()=>set({ mcpOff:Object.assign({}, off, {[name]:on}) }) }, tog(on)); });
    const openC = s.mcpOpen;
    const CLIENTS = [
      ['claude','Claude','ph ph-asterisk','#d97757','Custom connector · remote MCP','connected',['Settings → Connectors → Add custom connector','Paste the server URL above (leave the OAuth client fields empty)','Sign in with your OmniPost password and click Allow — the tools appear in chat'],'Works on Claude web and desktop. The Free plan allows one custom connector.'],
      ['chatgpt','ChatGPT','ph ph-circle-half','#10a37f','Connector · developer mode','auth',['On chatgpt.com: Settings → Apps & Connectors → Advanced settings → turn on Developer mode','Create a connector, paste the server URL above, choose OAuth','Sign in with your OmniPost password and click Allow'],'Developer mode is a web-only setting and, at the time of writing, not offered on the Free plan.'],
      ['gemini','Gemini CLI','ph ph-diamond','#4285f4','mcpServers in settings.json','disconnected',['Open ~/.gemini/settings.json','Add "omnipost" under mcpServers with httpUrl = server URL','Run /mcp in Gemini CLI to confirm the tools'],'The Gemini web/mobile app doesn’t accept custom MCP servers today — use Gemini CLI or the REST API.'],
      ['ide','Cursor, VS Code & other MCP clients','ph ph-code','var(--text)','Standard MCP client config','disconnected',['Open the client’s MCP settings','Add a server using the JSON config on the left','Sign in to OmniPost in the browser window that opens'],'Any client implementing MCP Streamable HTTP + OAuth works.'],
    ];
    const mcpClients = CLIENTS.map(([id,name,icon,color,method,status,steps,note]) => Object.assign({ name, icon, color, method, note, open: openC===id, caret: openC===id ? 'ph ph-caret-up' : 'ph ph-caret-down', steps: steps.map((t,i)=>({ n:String(i+1).padStart(2,'0'), text:t })), toggle:()=>set({ mcpOpen: openC===id ? null : id }) }, pill(stOf('mcp_'+id, status), mk['mcp_'+id])));
    const mcpReceived = (s.incoming||[]).map(x => Object.assign({}, x, { icons:x.platforms.map(p=>({ icon:this.pIcon(p), color:this.pColor(p) })) }));
    const mcpSimulate = () => { const n=(s.incoming||[]).length; const S=[
        { title:'Why AI won’t replace good developers', excerpt:'Written in Claude, sent via MCP with 1 image + alt text…', platforms:['linkedin'], account:'Company Page', source:'MCP · Claude' },
        { title:'Weekend reading: 5 dev blogs worth your time', excerpt:'Drafted in ChatGPT, image generated and attached…', platforms:['facebook','x'], account:'Dev Insights', source:'MCP · ChatGPT' } ];
      const x = Object.assign({}, S[n%2], { id:'cnt_'+this.rnd(3), at:new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) });
      set({ incoming:[x].concat(s.incoming||[]) }); };
    const mcp = Object.assign({ url:mcpUrl, snippet, copyUrl:copy(mcpUrl), copyUrlLabel:cl(mcpUrl), copySnippet:copy(snippet), copySnippetLabel:cl(snippet,'Copy config'),
      enabledText: mcpTools.filter(t=>t.toggleBg==='var(--accent)').length+' of '+TOOLS.length+' enabled',
      facts:[{label:'TRANSPORT',value:'Streamable HTTP'},{label:'AUTH',value:'OAuth 2.1 + PKCE'},{label:'PERMISSIONS',value:'Per tool, per client'},{label:'RATE LIMIT',value:'60 calls / min / client'}] }, pill('running'));

    // ---- automation platforms
    const n8nKey = s.n8nKey;
    const n8nHook = 'https://n8n.mydomain.com/webhook/omnipost-in';
    const n8n = Object.assign({ webhook:n8nHook, copyWebhook:copy(n8nHook), copyWebhookLabel:cl(n8nHook),
      hasKey: !!n8nKey, key:n8nKey||'', copyKey:copy(n8nKey||''), copyKeyLabel:cl(n8nKey||''), genLabel: n8nKey ? 'Rotate credentials' : 'Generate n8n credentials',
      gen:()=>set({ n8nKey:'opk_n8n_'+this.rnd(12) }),
      tested: !!s.n8nTested, testLabel: s.n8nTesting ? 'Testing…' : 'Test', testIcon: s.n8nTesting ? 'ph ph-circle-notch' : 'ph ph-plugs-connected', testSpin: s.n8nTesting ? 'animation:om-spin 0.8s linear infinite;' : '',
      test:()=>{ set({ n8nTesting:true, n8nTested:false }); setTimeout(()=>this.setState({ n8nTesting:false, n8nTested:true }), 900); } }, pill('connected', true));
    const n8nTemplates = [
      ['weekly','ph ph-calendar-check','Weekly AI post → Draft','Schedule trigger + HTTP request to POST /content'],
      ['sheet','ph ph-table','Google Sheet row → Draft','New row becomes an OmniPost draft'],
      ['events','ph ph-bell-ringing','OmniPost event → status check','Receives content.published and fetches the result'],
    ].map(([k,icon,name,desc]) => ({ icon, name, desc, dl:()=>this.download('omnipost-n8n-'+k+'.json','application/json',this.n8nWorkflow(k)) }));
    const n8nFlows = [
      ['ph ph-arrow-down-left','var(--blue)','var(--blue-soft)','Send posts, images & schedules in','HTTP Request → POST /api/v1/content'],
      ['ph ph-image','var(--violet)','var(--violet-soft)','Attach media by URL or upload','HTTP Request → POST /api/v1/media'],
      ['ph ph-magnifying-glass','var(--accent-ink)','var(--accent-soft)','Read publishing status & results','GET /api/v1/posts/{id}/status'],
      ['ph ph-arrow-up-right','var(--amber)','var(--amber-soft)','Get notified by OmniPost','Webhook node ← content.published · content.failed'],
    ].map(([icon,color,bg,title,detail]) => ({ icon, color, bg, title, detail }));
    const AUTOP = [
      ['make','Make.com','ph ph-circles-three','#6d00cc','Webhook + API token','HTTP module calls the OmniPost REST API; custom webhook receives events.','connected',true],
      ['zapier','Zapier','ph ph-lightning','#ff4f00','Webhook + API token','“Webhooks by Zapier” action posts drafts; catch hook receives events.','disconnected'],
      ['notion','Notion','ph ph-notion-logo','var(--text)','OAuth','Import rows from a Notion database as drafts.','connected',true],
      ['airtable','Airtable','ph ph-table','#18bfff','OAuth','Sync a base into the content queue.','disconnected'],
      ['gsheets','Google Sheets','ph ph-google-logo','#0f9d58','OAuth (Google)','Watch a sheet and import new rows.','auth'],
      ['excel','Microsoft Excel','ph ph-microsoft-excel-logo','#217346','OAuth (Microsoft Graph)','Read workbooks on OneDrive or SharePoint.','disconnected'],
      ['gdrive','Google Drive','ph ph-google-drive-logo','#1fa463','OAuth (Google)','Pull images and videos into the media library.','connected',true],
      ['dropbox','Dropbox','ph ph-dropbox-logo','#0061ff','OAuth','Pull images and videos into the media library.','disconnected'],
    ];
    const autoPlatforms = AUTOP.map(([id,name,icon,color,method,desc,status,mock]) => { const k = stOf(id, status); const m = ov[id] ? mk[id] : !!mock; return Object.assign({ name, icon, color, method, desc, action: {connected:'Disconnect',auth:'Authorize',error:'Reconnect',disconnected:'Connect'}[k], act:()=> k==='connected' ? setConn(id,'disconnected',false) : setConn(id,'connected',true) }, pill(k, m)); });

    // ---- REST
    const extraKeys = (s.extraKeys||[]);
    const realApi = !!(s.backend && s.backend.db && s.backend.auth);
    const genKey = () => {
      if (!realApi) return set({ extraKeys:[{ label:'New key · '+new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}), key:'opk_live_'+this.rnd(14) }].concat(extraKeys) });
      const name = (typeof window !== 'undefined' && window.prompt('Name this key (e.g. n8n):', 'n8n')) || '';
      if (!name) return;
      fetch('/api/tokens', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ name }) })
        .then(r => r.json().then(j => ({ ok:r.ok, j })))
        .then(({ ok, j }) => this.setState({ extraKeys:[ ok ? { label:j.name+' · copy it now, it won’t be shown again', key:j.token, badge:'live · shown once' } : { label:'Could not create key', key:j.error||'error', badge:'error' } ].concat(this.state.extraKeys||[]) }))
        .catch(() => this.setState({ extraKeys:[{ label:'Could not create key', key:'network error', badge:'error' }].concat(this.state.extraKeys||[]) }));
    };
    const MT = { GET:['var(--blue-soft)','var(--blue)'], POST:['var(--accent-soft)','var(--accent-ink)'], PATCH:['var(--amber-soft)','var(--amber)'], DELETE:['var(--red-soft)','var(--red)'] };
    const endpoints = (realApi ? [
      ['GET','/api/v1/posts','List posts (?status=draft|scheduled|published, ?limit=)','token'],
      ['GET','/api/v1/posts/due','Scheduled posts whose time has come — for n8n to publish','token'],
      ['POST','/api/v1/posts','Create a draft or scheduled post','token'],
      ['PATCH','/api/v1/posts/{id}','Mark published (with URL) or failed, reschedule, edit','token'],
      ['POST','/api/v1/generate','Write per-platform posts with OpenRouter; optionally save them','token'],
      ['GET','/api/v1/openapi.json','Machine-readable schema for tools & GPT Actions','public'],
    ] : [
      ['POST','/content','Create a draft (text, platforms, schedule, media URLs)','content:write'],
      ['PATCH','/content/{id}','Update a draft or a platform variation','content:write'],
      ['GET','/content/{id}','Retrieve content with all variations','content:read'],
      ['DELETE','/content/{id}','Delete a draft — never a published post','content:write'],
      ['POST','/media','Upload media (multipart) or import by URL','media:write'],
      ['POST','/content/{id}/approve','Approve for scheduling','content:approve'],
      ['POST','/content/{id}/schedule','Schedule approved posts','publish'],
      ['POST','/content/{id}/publish','Publish an approved post now','publish'],
      ['GET','/posts/{id}/status','Per-platform publishing status & URLs','status:read'],
      ['POST','/imports','Start a file import job (CSV/XLSX/JSON/PDF)','import:write'],
      ['GET','/openapi.json','Machine-readable schema for tools & GPT Actions','public'],
    ]).map(([method,path,desc,scope]) => ({ method, path, desc, scope, bg:MT[method][0], fg:MT[method][1] }));
    const apiLimits = [['ph ph-gauge','120 req/min per key'],['ph ph-fingerprint','Idempotency-Key header'],['ph ph-shield-check','Zod-validated, versioned'],['ph ph-file','25 MB body · larger media via upload URL'],['ph ph-arrows-clockwise','Key rotation & revocation']].map(([icon,label])=>({icon,label}));
    const schemaUrl = (s.origin || 'https://post.avonixai.com') + '/api/v1/openapi.json';
    const gpt = { schema:schemaUrl, copy:copy(schemaUrl), copyLabel:cl(schemaUrl) };

    // ---- webhooks
    const rot = s.rotated || {};
    const whIn = [
      ['n8n','n8n intake','https://omnipost.mydomain.com/hooks/in/n8n_7f3a','HMAC-SHA256','connected','last 2m ago'],
      ['make','Make.com scenario','https://omnipost.mydomain.com/hooks/in/make_2b91','HMAC-SHA256','connected','last 1h ago'],
      ['site','Website contact form','https://omnipost.mydomain.com/hooks/in/site_91cd','Bearer token','error','signature mismatch · 3h ago'],
    ].concat((s.extraHooks||[])).map(([id,name,url,auth,status,last]) => Object.assign({ name, url, auth, last, secret: rot[id] ? 'whsec_'+rot[id]+' (mock)' : 'whsec_••••'+id.slice(0,2), rotateLabel: rot[id] ? 'Rotated' : 'Rotate secret', rotate:()=>set({ rotated:Object.assign({}, rot, {[id]:this.rnd(6)}) }) }, pill(status, status==='connected')));
    const whOut = [
      ['n8n · publish results','https://n8n.mydomain.com/webhook/op-published',['content.published','content.failed'],'connected','200 · 8m ago','var(--accent-ink)'],
      ['Slack alerts (via Make)','https://hook.eu1.make.com/…',['content.failed','account.disconnected'],'connected','200 · 1h ago','var(--accent-ink)'],
      ['Zapier catch hook','https://hooks.zapier.com/hooks/catch/…',['content.approved'],'error','410 Gone · retry 3/5','var(--red)'],
    ].map(([name,url,events,status,last,lastColor]) => Object.assign({ name, url, events, last, lastColor }, pill(status, status==='connected')));
    const evOff = s.evOff || { 'image.generated':true };
    const webhookEvents = [
      ['content.created','var(--accent)'],['content.updated','var(--accent)'],['content.approved','var(--accent)'],['content.scheduled','var(--accent)'],
      ['content.published','var(--blue)'],['content.failed','var(--red)'],['image.generated','var(--violet)'],['account.disconnected','var(--amber)'],
      ['import.completed','var(--blue)'],['integration.error','var(--red)'],
    ].map(([name,color]) => { const on = !evOff[name]; return { name, color, toggleBg: on?'var(--accent)':'var(--surface-3)', knobLeft: on?'15px':'2px', toggle:()=>set({ evOff:Object.assign({}, evOff, {[name]:on}) }) }; });
    const newWebhook = () => set({ intTab:'apps', appMethod:'webhook' });

    // ---- imports
    const imp = s.imp;
    const iStep = s.impStep||0;
    const FIELDS = ['Scheduled date','Scheduled time','Timezone','Base caption','Facebook caption','Instagram caption','LinkedIn caption','X caption','Pinterest caption','Threads caption','Platform','Target accounts','Hashtags','Media URL','Image alt text','— Ignore —'];
    const map = imp ? (s.impMap || imp.headers.map(h => this.matchField(h))) : [];
    const autoStruct = map.indexOf('Platform')>-1 ? 'B' : 'A';
    const struct = s.impStructure || autoStruct;
    const V = imp ? this.validateImport(imp, map, struct) : null;
    const fmt = n => Number(n).toLocaleString();
    const impSteps = stepper(['Upload','Map columns','Validate','Preview & mode','Import'], iStep);
    const impMapping = imp ? imp.headers.map((h,i) => { const f = map[i]; const sample = (imp.rows.find(r=>String(r[i]||'').trim())||[])[i] || '—'; const auto = this.matchField(h)===f; const ign = f==='— Ignore —';
      return { header: h || '(column '+(i+1)+')', sample:String(sample).slice(0,80), conf: ign ? 'ignored' : (auto ? 'auto-matched' : 'set by you'), confIcon: ign ? 'ph ph-minus-circle' : (auto ? 'ph ph-magic-wand' : 'ph ph-hand-pointing'), confColor: ign ? 'var(--faint)' : (auto ? 'var(--accent-ink)' : 'var(--blue)'),
        select: React.createElement('select', { value:f, onChange:e => { const m = map.slice(); m[i] = e.target.value; set({ impMap:m }); }, style:{ width:'100%', fontFamily:'Geist, sans-serif', fontSize:12.5, padding:'7px 9px', borderRadius:7, border:'1px solid var(--border)', background:'var(--surface-2)', color:'var(--text)', cursor:'pointer' } }, FIELDS.map(o => React.createElement('option', { key:o, value:o }, o))) }; }) : [];
    const sevTone = { error:['var(--red-soft)','var(--red)'], warn:['var(--amber-soft)','var(--amber)'] };
    const ed = s.impEdit;
    const impIssues = V ? V.issues.slice(0,12).map(x => { const k = x.row+'|'+x.type+'|'+x.col; const editing = ed===k;
      return { row:x.row, type:x.type, msg:x.msg, bg:sevTone[x.sev][0], fg:sevTone[x.sev][1], canEdit: x.col>=0 && !editing, editing, colName: (imp.headers[x.col]||'').toUpperCase(),
        editVal: editing ? (s.impEditVal==null ? '' : s.impEditVal) : '',
        startEdit:()=>set({ impEdit:k, impEditVal:String(imp.rows[x.r][x.col]||'') }),
        onChange:e=>set({ impEditVal:e.target.value }), cancel:()=>set({ impEdit:null }),
        save:()=>{ const rows = imp.rows.map(r=>r.slice()); rows[x.r][x.col] = s.impEditVal||''; set({ imp:Object.assign({}, imp, { rows }), impEdit:null, impRev:(s.impRev||0)+1 }); } }; }) : [];
    const impStats = V ? [['Rows detected',fmt(V.rows),'var(--text)'],['Posts detected',fmt(V.detected),'var(--text)'],['Valid posts',fmt(V.valid),'var(--accent-ink)'],['Warnings',fmt(V.warnings),'var(--amber)'],['Invalid rows',fmt(V.invalidRows),'var(--red)'],['Duplicates',fmt(V.dups),'var(--amber)']].map(([label,value,color])=>({label,value,color})) : [];
    const impPreview = V ? V.posts.slice(0,8).map(p => ({ date:p.date, time:p.time||'—', icon: p.p==='all'?'ph ph-globe':this.pIcon(p.p), color: p.p==='all'?'var(--muted)':this.pColor(p.p), platform: p.p==='all'?'All selected accounts':this.pName(p.p), caption:String(p.c), row:'row '+p.row })) : [];
    const mode = s.impMode || 'approval';
    const MODES = [['draft','Drafts','Land in Drafts for editing. Nothing is scheduled.'],['approval','Pending approval','Keeps the scheduled times; each post waits for your approval.'],['scheduled','Scheduled','Queued for publishing at each row’s date and time.']];
    const impModes = MODES.map(([id,label,desc]) => Object.assign({ label, desc, rec: id==='approval' ? 'Recommended' : '', go:()=>set({ impMode:id }) }, pick(mode===id)));
    const prog = s.impProgress||0;
    const impVals = { s0:iStep===0, s1:iStep===1, s2:iStep===2, s3:iStep===3, s4:iStep===4,
      fileName: imp ? imp.name+(imp.sample?' · sample':'') : '', fileMeta: imp ? fmt(imp.rows.length)+' rows · '+Math.max(1,Math.round((imp.size||0)/1024))+' KB' : '',
      error: s.impError || '', structureText: struct==='A' ? 'ONE ROW PER DATE' : 'ONE ROW PER PLATFORM',
      mappedText: map.filter(f=>f!=='— Ignore —').length+' of '+map.length+' columns mapped',
      sourceNote: imp && imp.sample ? 'Sample file generated in your browser so you can try the full flow. Real CSV and JSON files are parsed for real; Excel and PDF go through the server parser in production.' : 'Columns were read from your file and matched automatically. Change any match with the dropdown.',
      issueCount: V ? fmt(V.issues.length) : '0', moreIssues: V && V.issues.length>12 ? '+ '+fmt(V.issues.length-12)+' more issues — download the full report after import.' : '', noIssues: V && !V.issues.length,
      validText: V ? fmt(V.valid) : '0', invalidText: V ? fmt(V.invalidRows)+' rows' : '—', dupText: V ? fmt(V.dups) : '—', range: V ? V.range : '—',
      modeLabel: MODES.find(m=>m[0]===mode)[1].toLowerCase(), progressPct: prog+'%', progressText: V ? fmt(Math.round(V.valid*prog/100))+' / '+fmt(V.valid) : '', running: iStep===4 && prog<100, done: iStep===4 && prog>=100,
      showNav: iStep>=1 && iStep<=3, nextLabel: iStep===3 ? 'Confirm import' : iStep===2 ? 'Continue to preview' : 'Validate rows', nextOpacity: iStep===3 && V && !V.valid ? 0.4 : 1 };
    const impNext = () => { if (iStep===3){ if (V && V.valid) this.startImport(); return; } set({ impStep:iStep+1, impEdit:null }); };
    const impBack = () => set({ impStep:Math.max(0, iStep-1), impEdit:null });
    const impCancel = () => { clearInterval(this._impT); set({ imp:null, impMap:null, impStructure:null, impStep:0, impProgress:0, impError:null, impEdit:null }); };
    const useSample = () => set({ imp:this.sampleImport(), impMap:null, impStructure:null, impStep:1, impError:null, impEdit:null, impProgress:0 });
    const impStructOpts = [['A','One row per date','Separate columns per platform — Facebook, X, LinkedIn, Instagram…'],['B','One row per platform post','A “platform” column decides where each row goes']].map(([id,label,desc]) => Object.assign({ label, desc, rec: imp && autoStruct===id ? 'Detected' : '', go:()=>set({ impStructure:id }) }, pick(struct===id)));
    const tplA = [['scheduled_date','scheduled_time','timezone','general_content','facebook_content','x_content','linkedin_content','instagram_content','pinterest_content','threads_content','hashtags','media_url','image_alt_text','accounts'],
      ['2027-01-15','10:00','Asia/Dhaka','The future of AI in WordPress development','AI is quietly rewriting how we build WordPress sites. What would you hand off first?','AI in WordPress dev isn’t hype anymore →','Over the past year, AI moved from novelty to infrastructure in our WordPress workflow.','Swipe → 5 ways AI is changing WordPress builds.','','','#AI #WordPress','https://example.com/image.png','Developer workspace with WordPress dashboard','Dev Insights; Company Page'],
      ['2027-01-16','09:00','Asia/Dhaka','Headless CMS in 2027','','Headless CMS: worth it in 2027?','','','Headless CMS guide for 2027','Anyone else moved to headless this year?','#WebDev','https://example.com/headless.png','Diagram of a headless CMS','@devinsights']];
    const tplB = [['scheduled_date','scheduled_time','timezone','platform','account','content','hashtags','media_url','image_alt_text'],
      ['2027-01-15','10:00','Asia/Dhaka','facebook','Dev Insights','AI is quietly rewriting how we build WordPress sites.','#AI #WordPress','https://example.com/image.png','Developer workspace'],
      ['2027-01-15','10:00','Asia/Dhaka','linkedin','Company Page','Over the past year, AI moved from novelty to infrastructure.','#AI','https://example.com/image.png','Developer workspace'],
      ['2027-01-15','10:00','Asia/Dhaka','x','@devinsights','AI in WordPress dev isn’t hype anymore →','#AI','https://example.com/image.png','Developer workspace']];
    const impTemplates = [
      ['ph ph-file-csv','CSV · one row per date','Platform columns side by side', ()=>this.download('omnipost-template-by-date.csv','text/csv',this.csv(tplA))],
      ['ph ph-file-csv','CSV · one row per platform','A platform column per row', ()=>this.download('omnipost-template-by-platform.csv','text/csv',this.csv(tplB))],
      ['ph ph-file-xls','Excel template (.xls)','Opens in Excel, Sheets, Numbers', ()=>this.download('omnipost-template.xls','application/vnd.ms-excel',this.xls(tplA))],
    ].map(([icon,name,desc,dl]) => ({ icon, name, desc, dl }));
    const impFormats = [['CSV','· in browser',1],['JSON','· in browser',1],['XLSX','· server',0],['XLS','· server',0],['PDF','· tables only, server',0]].map(([label,note,ok]) => ({ label, note, bg: ok?'var(--accent-soft)':'var(--surface-2)', border: ok?'var(--accent-border)':'var(--border)', fg: ok?'var(--accent-ink)':'var(--muted)' }));
    const impHistory = [['content-plan-2026.xlsx','1,204 imported · 9 skipped','Dec 02','ph ph-file-xls'],['q4-linkedin.csv','84 imported','Oct 12','ph ph-file-csv'],['brand-calendar.pdf','41 extracted · reviewed by hand','Sep 30','ph ph-file-pdf']].map(([name,result,date,icon]) => ({ name, result, date, icon }));

    // ---- connected apps
    const rev = s.revoked || {}, so = s.scopeOff || {}, ao = s.appOpen;
    const APPS = [
      ['claude','Claude (MCP)','ph ph-asterisk','#d97757','OAuth 2.1 · MCP',['drafts:write','media:write','accounts:read'],'4m ago'],
      ['chatgpt','ChatGPT connector','ph ph-circle-half','#10a37f','OAuth 2.1 · MCP',['drafts:write','media:write'],'1d ago'],
      ['n8n','n8n','ph ph-share-network','var(--violet)','API token',['content:write','publish','status:read'],'2m ago'],
      ['make','Make.com','ph ph-circles-three','#6d00cc','API token',['content:write','status:read'],'1h ago'],
      ['notion','Notion','ph ph-notion-logo','var(--text)','OAuth',['import:read'],'3d ago'],
      ['site','Personal website','ph ph-globe','var(--blue)','Webhook secret',['content:write'],'3h ago'],
    ].concat(s.extraApps||[]);
    const SCOPE_DESC = { 'drafts:write':'create & edit drafts', 'media:write':'upload media', 'accounts:read':'see connected accounts', 'content:write':'create content', 'publish':'schedule approved posts', 'status:read':'read publishing status', 'import:read':'read source data', 'content:read':'read content' };
    const hubApps = APPS.map(([id,name,icon,color,auth,scopes,last]) => { const revoked = !!rev[id]; const sOff = so[id] || {};
      return Object.assign({ name, icon, color, auth, last, open: ao===id,
        scopeChips: scopes.map(x => ({ name:x, fg: sOff[x]||revoked ? 'var(--faint)' : 'var(--text-2)', deco: sOff[x]||revoked ? 'line-through' : 'none' })),
        scopeRows: scopes.map(x => Object.assign({ name:x, desc:SCOPE_DESC[x]||'', toggle:()=>set({ scopeOff:Object.assign({}, so, {[id]:Object.assign({}, sOff, {[x]:!sOff[x]})}) }) }, tog(!sOff[x]))),
        togglePerms:()=>set({ appOpen: ao===id ? null : id }), viewActivity:()=>set({ intTab:'activity' }),
        revoke:()=>set({ revoked:Object.assign({}, rev, {[id]:!revoked}) }), revokeLabel: revoked ? 'Reconnect' : 'Revoke access', revokeIcon: revoked ? 'ph ph-arrows-clockwise' : 'ph ph-prohibit', revokeColor: revoked ? 'var(--accent-ink)' : 'var(--red)' }, pill(revoked ? 'disconnected' : 'connected')); });
    const am = s.appMethod || 'rest';
    const METHODS = [['mcp','MCP client','An AI assistant or agent that speaks MCP'],['rest','REST API token','Scripts, websites, Make, Zapier, custom apps'],['webhook','Incoming webhook','The other tool only knows how to POST to a URL'],['oauth','OAuth app','A third-party app acting on your behalf']];
    const appMethods = METHODS.map(([id,label,desc]) => Object.assign({ label, desc, rec:'', go:()=>set({ appMethod:id, newCreds:null }) }, pick(am===id)));
    const nc = s.newCreds;
    const appName = s.appName==null ? '' : s.appName;
    const ncCopy = v => ({ copy:copy(v), copyLabel:cl(v) });
    const newApp = { name:appName, onName:e=>set({ appName:e.target.value }), has: !!nc, title: nc ? nc.title : '', creds: nc ? nc.creds.map(c => Object.assign({ label:c[0], value:c[1] }, ncCopy(c[1]))) : [], steps: nc ? nc.steps.map((t,i)=>({ n:String(i+1).padStart(2,'0'), text:t })) : [],
      tested: !!s.appTested, testLabel: s.appTesting ? 'Waiting for a request…' : 'Test connection', testIcon: s.appTesting ? 'ph ph-circle-notch' : 'ph ph-plugs-connected', testSpin: s.appTesting ? 'animation:om-spin 0.8s linear infinite;' : '',
      test:()=>{ set({ appTesting:true, appTested:false }); setTimeout(()=>this.setState({ appTesting:false, appTested:true }), 1000); },
      generate:()=>{ const nm = appName.trim() || 'Untitled app'; const slug = nm.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'').slice(0,12) || 'app'; let c;
        if (am==='mcp') c = { title:'MCP CLIENT', creds:[['Server URL',mcpUrl],['Client ID','op_mcp_'+this.rnd(6)]], steps:['Add the server URL in the client’s MCP settings','Sign in to OmniPost when the browser opens','Pick which tools this client may use under MCP Connections'] };
        else if (am==='webhook') c = { title:'INCOMING WEBHOOK', creds:[['Endpoint URL','https://omnipost.mydomain.com/hooks/in/'+slug+'_'+this.rnd(2)],['Signing secret','whsec_'+this.rnd(12)]], steps:['Paste the URL into the other tool as the POST target','Sign each body: X-OmniPost-Signature: sha256=HMAC(secret, timestamp.body)','Send the content JSON — it lands in Drafts'] };
        else if (am==='oauth') c = { title:'OAUTH APP', creds:[['Client ID','op_client_'+this.rnd(6)],['Client secret','op_secret_'+this.rnd(14)],['Authorize URL','https://omnipost.mydomain.com/oauth/authorize']], steps:['Register your redirect URI under Advanced','Use authorization code + PKCE','Request only the scopes the app needs'] };
        else c = { title:'REST API TOKEN', creds:[['API key','opk_live_'+this.rnd(14)],['Base URL','https://omnipost.mydomain.com/api/v1']], steps:['Send header Authorization: Bearer <key>','POST /content with an Idempotency-Key header','Poll GET /posts/{id}/status, or subscribe to webhooks'] };
        const extra = (s.extraApps||[]).concat([[ 'new_'+this.rnd(3), nm, {mcp:'ph ph-plugs-connected',webhook:'ph ph-webhooks-logo',oauth:'ph ph-key',rest:'ph ph-code'}[am], 'var(--accent-ink)', {mcp:'OAuth 2.1 · MCP',webhook:'Webhook secret',oauth:'OAuth app',rest:'API token'}[am], am==='mcp'?['drafts:write','media:write']:['content:write'], 'never' ]]);
        const hooks = am==='webhook' ? (s.extraHooks||[]).concat([[ 'new_'+this.rnd(2), nm, c.creds[0][1], 'HMAC-SHA256', 'auth', 'awaiting first request' ]]) : (s.extraHooks||[]);
        set({ newCreds:c, appTested:false, extraApps:extra, extraHooks:hooks }); } };

    // ---- activity
    const af = s.actFilter || 'all';
    const ACT = [
      ['14:02:11','in','MCP · Claude','create_post_draft','201 Created · draft','cnt_9f3a'],
      ['14:01:40','out','Webhook → n8n','content.published','200 OK','dlv_77a1'],
      ['13:58:03','in','REST · n8n key','POST /api/v1/content','201 Created','req_3c19'],
      ['13:40:22','in','Webhook · website','POST /hooks/in/site_91cd','401 Signature mismatch','req_3b02'],
      ['13:12:09','in','File import','content-plan-2026.xlsx','1,204 rows queued','imp_0012'],
      ['12:55:47','out','Webhook → Zapier','content.approved','410 Gone · retry 3/5','dlv_76f0'],
      ['12:30:00','in','REST · Make','POST /api/v1/media','413 Payload too large','req_3a88'],
      ['11:04:51','in','MCP · ChatGPT','list_social_accounts','200 OK','req_39d1'],
      ['10:47:19','in','AI · DeepSeek','validateConnection','401 Unauthorized','req_38c0'],
      ['09:00:02','in','n8n schedule','POST /api/v1/content ×3','201 Created · idempotent','req_3712'],
    ];
    const resC = r => /^2/.test(r) || /queued/.test(r) ? 'var(--accent-ink)' : /retry/.test(r) ? 'var(--amber)' : 'var(--red)';
    const actRows = ACT.filter(a => af==='all' || (af==='errors' ? resC(a[4])!=='var(--accent-ink)' : a[1]===af)).map(([time,dir,source,event,result,req]) => ({ time, dir: dir==='in'?'In':'Out', dirIcon: dir==='in'?'ph ph-arrow-down-left':'ph ph-arrow-up-right', dirColor: dir==='in'?'var(--blue)':'var(--accent-ink)', source, event, result, resColor:resC(result), req }));
    const actFilters = [['all','All'],['in','Incoming'],['out','Outgoing'],['errors','Errors & retries']].map(([id,label]) => { const a = af===id; return { label, go:()=>set({ actFilter:id }), border:a?'var(--accent-border)':'var(--border)', bg:a?'var(--accent-soft)':'var(--surface)', fg:a?'var(--accent-ink)':'var(--text-2)', weight:a?600:450 }; });

    // ---- summary + tabs
    const keys = [].concat(hubProviders, mcpClients, autoPlatforms, whIn, whOut, hubApps).map(x => x.statusKey);
    const cnt = k => keys.filter(x=>x===k).length;
    const hubSummary = [['connected','Connected'],['auth','Need sign-in'],['error','Errors'],['disconnected','Not connected']].map(([k,label]) => ({ count:cnt(k), label, fg:ST[k][1], bg:ST[k][2], border:ST[k][3] }));
    const hubPipeline = [['ph ph-plugs','External source'],['ph ph-shield-check','Integration'],['ph ph-note-pencil','Draft'],['ph ph-eye','Review'],['ph ph-check-square','Approval'],['ph ph-users-three','Accounts'],['ph ph-calendar-dots','Schedule'],['ph ph-paper-plane-tilt','Publish'],['ph ph-list-checks','History']]
      .map(([icon,label],i,a) => ({ icon, label, arrow: i<a.length-1, bg: i===0?'var(--accent-soft)':'var(--surface-2)', border: i===0?'var(--accent-border)':'var(--border)', fg: i===0?'var(--accent-ink)':'var(--text-2)' }));
    const errs = list => list.filter(x => x.statusKey==='error' || x.statusKey==='auth').length;
    const tabDefs = [
      ['ai','AI Providers','ph ph-brain', hubProviders.filter(p=>p.statusKey==='connected').length+'/'+hubProviders.length, errs(hubProviders)],
      ['mcp','MCP Connections','ph ph-plugs-connected', String(mcpClients.length), errs(mcpClients)],
      ['automation','Automation Platforms','ph ph-share-network', String(autoPlatforms.length+1), errs(autoPlatforms)],
      ['api','REST API','ph ph-code','v1',0],
      ['webhooks','Webhooks','ph ph-webhooks-logo', String(whIn.length+whOut.length), errs(whIn)+errs(whOut)],
      ['imports','File Imports','ph ph-file-arrow-up','',0],
      ['apps','Connected Apps','ph ph-app-window', String(hubApps.filter(a=>a.statusKey==='connected').length),0],
      ['activity','Activity & Logs','ph ph-pulse','',0],
    ];
    const intTabs = tabDefs.map(([id,label,icon,count,e]) => { const a = T[id]; return { label, icon, count, go:()=>set({ intTab:id }), bg:a?'var(--surface)':'transparent', fg:a?'var(--text)':'var(--muted)', weight:a?600:450, shadow:a?'var(--shadow-sm)':'none', iconColor:a?'var(--accent-ink)':'var(--faint)', countBg: e?'var(--amber-soft)':'var(--surface-3)', countFg: e?'var(--amber)':'var(--muted)' }; });

    return {
      it:T, hubSummary, hubPipeline, intTabs,
      hubProviders, wiz, wz, wizSteps:stepper(['Provider','Sign in','Credentials','Models','Test & save'], step), wizPick, wizAuthOpts, wizModels,
      wizBack:()=>set({ wizStep:Math.max(0, step-1), wizTested:false }),
      wizNext:()=>{ if (step===4){ if (!s.wizTested) return; setConn(wp.id,'connected',true); set({ wizSaved:wp.id }); return; } set({ wizStep:step+1 }); },
      wizTest:()=>{
        set({ wizTesting:true, wizTested:false });
        const adapter = aiAdapters.has(wp.id) ? aiAdapters.get(wp.id) : aiAdapters.get(DEFAULT_AI_PROVIDER);
        adapter.validateConnection().then(res => this.setState({ wizTesting:false, wizTested:res.ok }));
      },
      wizAuthorize:()=>{ set({ wizAuthorizing:true }); setTimeout(()=>this.setState({ wizAuthorizing:false, wizStep:3 }), 1000); },
      toggleAdv:()=>set({ advOpen:!s.advOpen }),
      mcp, mcpClients, mcpTools, mcpReceived, mcpHasReceived: mcpReceived.length>0, mcpSimulate, goDraftsHub:()=>set({ route:'drafts' }),
      n8n, n8nTemplates, n8nFlows, autoPlatforms,
      extraKeys, genKey, endpoints, apiLimits, gpt,
      whIn, whOut, webhookEvents, newWebhook,
      imp:impVals, impSteps, impMapping, impIssues, impStats, impPreview, impModes, impStructOpts, impTemplates, impFormats, impHistory,
      onImportFile:e=>this.onImportFile(e), useSample, impNext, impBack, impCancel,
      hubApps, appMethods, newApp,
      actRows, actFilters,
    };
  }

  pName(p){ return ({facebook:'Facebook',instagram:'Instagram',linkedin:'LinkedIn',x:'X / Twitter',youtube:'YouTube',pinterest:'Pinterest',threads:'Threads',tiktok:'TikTok',telegram:'Telegram',reddit:'Reddit'})[p]; }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ViewModel = Record<string, any>;
