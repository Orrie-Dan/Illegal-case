const CFG = { PORTAL: 'https://gh.space.gov.rw/portal/', WEBMAP: '71f7636be6f14ed287abd35e857569ca', LAYER: 'https://gh.space.gov.rw/server/rest/services/case_inspection/FeatureServer/3', API_BASE_URL: 'http://192.168.1.116:8000' };
const F = { caseid:'caseid', upi:'upi', source:'source_data', visitStatus:'visit_status', inspector:'inspector1', inspectingDate:'inspecting_date', description:'case_description', actionTaken:'action_taken', globalid:'globalid', verificationStatus:'committeeverification_status', sector:'sector', cell:'cell', village:'village', committeeAction:'committee_action', field_suggested_actions:'field_suggested_actions', fine_amount:'fine_amount' };
const S = { cases:[], filtered:[], selectedId:null, srcMap:{}, statMap:{}, gl:null, view:null, dec:null };
let pieInst=null, lineInst=null, sectorInst=null, timeMode='week';
let sectorMode='sector', sectorVerFilter='', sectorActFilter='';
let timeVerFilter='verified', timeActFilter='';

const esc = s => s==null?'':String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const fd = ts => ts ? new Date(ts).toLocaleDateString('en-RW',{year:'numeric',month:'short',day:'numeric'}) : '—';
function normVer(v) {
    if(v==null||v==='') return 'not_verified';
    const s=String(v).toLowerCase().replace(/[\s\-_]+/g,'_');
    if(s.includes('verif')&&!s.includes('not')&&!s.includes('un')) return 'verified';
    if(s.includes('not')||s==='0'||s==='false') return 'not_verified';
    if(s.includes('review')||s.includes('progress')||s==='2') return 'under_review';
    if(s==='1'||s==='true') return 'verified';
    return 'not_verified';
}
function normActs(v) {
    if(!v) return [];
    return String(v).split(',').map(s=>s.trim()).map(s=>{
        const lc=s.toLowerCase();
        if(lc.includes('fine')||lc.includes('penalt')) return 'Fine';
        if(lc.includes('demol')) return 'Demolish';
        if(lc.includes('new')&&lc.includes('permit')) return 'New Permit';
        if(lc.includes('renew')||lc.includes('renewal')) return 'Renew Permit';
        return s;
    }).filter(Boolean);
}
function isNC(c) {
    const v=String(c.rawVS||'').toLowerCase(), lbl=(S.statMap[c.rawVS]||'').toLowerCase();
    return v.includes('illegal')||lbl.includes('illegal')||v==='2'||lbl.includes('non');
}
function pillClass(a) { return {Fine:'pill-fine',Demolish:'pill-demolish','New Permit':'pill-newpermit','Renew Permit':'pill-renewpermit'}[a]||'pill-pending'; }
function toCommitteeActionString(acts) {
    if(!acts || !acts.length) return null;
    return acts.map(a=>a==='Fine'?'Fines':a).join(', ');
}
function animVal(id,target) {
    const el=document.getElementById(id); if(!el) return;
    const start=parseInt(el.textContent.replace(/,/g,''))||0, dur=700, t0=performance.now();
    function step(now) { const p=Math.min((now-t0)/dur,1),e=1-Math.pow(1-p,3); el.textContent=Math.round(start+(target-start)*e).toLocaleString(); if(p<1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
}

require([
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/FeatureLayer",
    "esri/layers/GraphicsLayer",
    "esri/Graphic",
    "esri/rest/support/Query",
    "esri/widgets/Search",
    "esri/widgets/BasemapGallery",
    "esri/widgets/Expand",
    "esri/widgets/LayerList"
],
function(Map,MapView,FeatureLayer,GraphicsLayer,Graphic,Query,Search,BasemapGallery,Expand,LayerList) {
    // Use Map + public basemap instead of portal WebMap so the app works on Vercel (no portal credentials)
    const map = new Map({ basemap: "streets-navigation-vector" });
    const gl = new GraphicsLayer({ listMode:'hide' }); S.gl=gl; map.add(gl);
    const fl = new FeatureLayer({ url: CFG.LAYER, outFields: ['*'] });
    map.add(fl);
    const view = new MapView({ container:'mapView', map, ui:{components:['zoom']}, popup:{autoOpenEnabled:false} }); S.view=view;
    view.when().then(()=>{
        const searchWidget=new Search({ view });
        view.ui.add(searchWidget,"top-right");
        const basemapGallery=new BasemapGallery({ view });
        const basemapExpand=new Expand({ view, content:basemapGallery, group:"top-right", expanded:false });
        view.ui.add(basemapExpand,"top-right");
        const layerList=new LayerList({ view });
        const layerExpand=new Expand({ view, content:layerList, group:"top-right", expanded:false });
        view.ui.add(layerExpand,"top-right");
        return fl.load();
    }).then(()=>{
        fl.fields.forEach(f=>{
            if(f.name===F.source&&f.domain?.codedValues) f.domain.codedValues.forEach(cv=>{S.srcMap[cv.code]=cv.name;});
            if(f.name===F.visitStatus&&f.domain?.codedValues) f.domain.codedValues.forEach(cv=>{S.statMap[cv.code]=cv.name;});
        });
        if(!Object.keys(S.statMap).length) S.statMap={0:'Not Visited',1:'Visited Legal',2:'Visited Illegal'};
        // Ensure source options: Citizen, Satellite, Field Visit (fallback if layer domain is empty)
        if(!Object.keys(S.srcMap).length){
            S.srcMap={'1':'Citizen','2':'Satellite','3':'Field Visit'};
        }
        const srcSel=document.getElementById('filter-source');
        Object.entries(S.srcMap).forEach(([code,label])=>{ const o=document.createElement('option'); o.value=String(code); o.textContent=label; srcSel.appendChild(o); });
        const q=new Query(); q.where='1=1'; q.outFields=['*']; q.returnGeometry=true; q.num=2000;
        const baseUrl=(CFG.API_BASE_URL||'').replace(/\/+$/,'');
        const casesPromise=baseUrl?fetch(baseUrl+'/cases').then(r=>r.ok?r.json():[]).catch(()=>[]):Promise.resolve([]);
        const layerPromise=fl.queryFeatures(q);
        return Promise.all([casesPromise,layerPromise]);
    }).then(async ([apiCases,arcResults])=>{
        if(!Array.isArray(apiCases)) apiCases=[];
        const arcFeatures=arcResults&&arcResults.features?arcResults.features:[];
        const geoByOid=new Map();
        const geoByGlobalId=new Map();
        arcFeatures.forEach(f=>{
            const a=f.attributes||{};
            const oid=a['OBJECTID']!=null?a['OBJECTID']:a['objectid'];
            const gid=a[F.globalid]||a['globalid'];
            if(oid!=null&&Number.isFinite(Number(oid))) geoByOid.set(Number(oid),f.geometry);
            if(gid) geoByGlobalId.set(String(gid).replace(/[{}]/g,'').toLowerCase(),f.geometry);
        });

        if(!Array.isArray(apiCases)||apiCases.length===0){
            apiCases=arcFeatures.map(f=>{
                const a=f.attributes||{};
                const oid=a['OBJECTID']!=null?a['OBJECTID']:a['objectid'];
                return {
                    objectid:oid!=null?Number(oid):null,
                    globalid:a[F.globalid]||a['globalid']||'',
                    caseid:a[F.caseid]||String(oid||''),
                    upi:a[F.upi]||'',
                    visit_status:S.statMap[a[F.visitStatus]]||String(a[F.visitStatus]||''),
                    committeeverification_status:a[F.verificationStatus],
                    field_suggested_actions:a[F.field_suggested_actions]||'',
                    committee_action:a[F.committeeAction],
                    fine_amount:a[F.fine_amount]!=null?a[F.fine_amount]:null,
                    sector:a[F.sector]||'',
                    cell:a[F.cell]||'',
                    village:a[F.village]||'',
                    inspection_from_data:a[F.inspectingDate]
                };
            });
        }

        const codeForLabel={};
        Object.entries(S.statMap).forEach(([code,label])=>{ codeForLabel[String(label).toLowerCase()]=code; codeForLabel[String(label)]=code; });

        S.cases=apiCases.map(row=>{
            const oid=row.objectid!=null?Number(row.objectid):null;
            const id=row.caseid||String(oid||'');
            const rawVS=codeForLabel[String(row.visit_status||'').toLowerCase()]||codeForLabel[row.visit_status]||row.visit_status;
            const geo=oid!=null&&geoByOid.has(oid)?geoByOid.get(oid):(row.globalid?geoByGlobalId.get(String(row.globalid).replace(/[{}]/g,'').toLowerCase()):null)||null;
            return {
                id,
                backendObjectId:oid,
                upi:row.upi||'',
                source:row.source_data!=null?row.source_data:null,
                srcLabel:row.source_data!=null?(S.srcMap[row.source_data]||String(row.source_data)):'',
                rawVS,
                vsLabel:row.visit_status||'',
                inspector:row.inspector||'',
                inspDate:row.inspection_from_data||row.inspecting_date||null,
                description:row.description||row.case_description||'',
                actionTaken:row.actionTaken||row.action_taken||'',
                globalid:row.globalid||'',
                rawVer:row.committeeverification_status,
                verNorm:normVer(row.committeeverification_status),
                sector:row.sector||'',
                cell:row.cell||'',
                village:row.village||'',
                fieldSuggestedActions:row.field_suggested_actions||'',
                acts:normActs(row.committee_action),
                fineAmt:row.fine_amount!=null&&!isNaN(Number(row.fine_amount))?Number(row.fine_amount):null,
                geo
            };
        });

        const sectors=[...new Set(S.cases.map(c=>c.sector).filter(Boolean))].sort();
        const sectSel=document.getElementById('filter-sector');
        sectors.forEach(s=>{ const o=document.createElement('option'); o.value=s; o.textContent=s; sectSel.appendChild(o); });

        const cells=[...new Set(S.cases.map(c=>c.cell).filter(Boolean))].sort();
        const cellSel=document.getElementById('filter-cell');
        if(cellSel){
            cells.forEach(cn=>{ const o=document.createElement('option'); o.value=cn; o.textContent=cn; cellSel.appendChild(o); });
        }

        const vsSel=document.getElementById('filter-visitstatus');
        if(vsSel){
            Object.entries(S.statMap).forEach(([code,label])=>{ const o=document.createElement('option'); o.value=code; o.textContent=label; vsSel.appendChild(o); });
        }

        const actSel=document.getElementById('filter-action');
        if(actSel){
            ['Fine','Demolish','New Permit','Renew Permit'].forEach(a=>{ const o=document.createElement('option'); o.value=a; o.textContent=a; actSel.appendChild(o); });
        }
        animVal('total-num',S.cases.length);
        APP.applyFilters();
        APP.toast('Data loaded — '+S.cases.length+' records','success');
    }).catch(err=>{ console.error(err); document.getElementById('case-list').innerHTML='<div class="empty-state"><svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/></svg><div>Connection Error — check portal access</div></div>'; APP.toast('Error loading data','error'); });

    view.on('click',event=>{ view.hitTest(event,{include:gl}).then(r=>{ const hit=r.results.find(r=>r.graphic?.attributes?.cid); if(hit) APP.selectCase(hit.graphic.attributes.cid); }); });

    window.APP = {
        applyFilters() {
            const search=document.getElementById('global-search').value.trim().toLowerCase();
            const src=document.getElementById('filter-source').value;
            const ver=document.getElementById('filter-verification').value;
            const sec=document.getElementById('filter-sector').value;
            const cell=document.getElementById('filter-cell')?.value||'';
            const vs=document.getElementById('filter-visitstatus')?.value||'';
            const act=document.getElementById('filter-action')?.value||'';
            const fromVal=document.getElementById('filter-from')?.value||'';
            const toVal=document.getElementById('filter-to')?.value||'';
            const fromDate=fromVal?new Date(fromVal):null;
            const toDate=toVal?new Date(toVal):null;
            S.filtered=S.cases.filter(c=>{
                if(!isNC(c)) return false;
                if(src!==''){
                    const srcMatch=String(c.source)===String(src)||c.srcLabel===src||(S.srcMap[src]&&c.srcLabel===S.srcMap[src]);
                    if(!srcMatch) return false;
                }
                if(ver!==''&&c.verNorm!==ver) return false;
                if(sec!==''&&c.sector!==sec) return false;
                if(cell!==''&&c.cell!==cell) return false;
                if(vs!==''&&String(c.rawVS)!==vs) return false;
                if(act!==''&&!c.acts.includes(act)) return false;
                if(fromDate||toDate){
                    if(!c.inspDate) return false;
                    const d=new Date(c.inspDate);
                    if(fromDate&&d<fromDate) return false;
                    if(toDate&&d>toDate) return false;
                }
                if(search&&![c.id,c.upi,c.sector,c.cell,c.village,c.description].join(' ').toLowerCase().includes(search)) return false;
                return true;
            });
            this.kpis(); this.renderMap(); this.renderList(); this.renderCharts();
            this.updateSourceCards();
            this.chips({
                Source:src?S.srcMap[src]||src:'',
                Verification:ver,
                Sector:sec,
                Cell:cell,
                VisitStatus:vs?S.statMap[vs]||vs:'',
                Action:act,
                From:fromVal,
                To:toVal,
                Search:search
            });
        },
        updateSourceCards() {
            const nc=S.cases.filter(c=>isNC(c));
            const byLabel={};
            nc.forEach(c=>{ const L=c.srcLabel||'(Other)'; byLabel[L]=(byLabel[L]||0)+1; });
            const citizenEl=document.getElementById('source-count-citizen');
            const satelliteEl=document.getElementById('source-count-satellite');
            const fieldEl=document.getElementById('source-count-field');
            if(citizenEl) citizenEl.textContent=String(byLabel['Citizen']||0);
            if(satelliteEl) satelliteEl.textContent=String(byLabel['Satellite']||0);
            if(fieldEl) fieldEl.textContent=String(byLabel['Field Visit']||0);
            const src=document.getElementById('filter-source')?.value||'';
            const activeLabel=src?S.srcMap[src]||'':'';
            document.querySelectorAll('.source-card').forEach(card=>{
                card.classList.toggle('active',(card.getAttribute('data-source')||'')===activeLabel);
            });
        },
        setSourceFilter(labelOrCode) {
            const sel=document.getElementById('filter-source');
            if(!sel) return;
            if(labelOrCode===''||labelOrCode==null){ sel.value=''; this.applyFilters(); return; }
            const code=typeof labelOrCode==='string'&&isNaN(Number(labelOrCode))?
                Object.entries(S.srcMap).find(([c,l])=>String(l).toLowerCase()===String(labelOrCode).toLowerCase())?.[0]:
                labelOrCode;
            if(code!==undefined) sel.value=String(code);
            this.applyFilters();
        },
        kpis() {
            // Base set: filtered illegal cases when filters are active, otherwise all illegal cases
            const ncCases = S.cases.filter(c=>isNC(c));
            const base = S.filtered.length ? S.filtered : ncCases;

            let v=0,nv=0,ur=0,fi=0,dm=0,np=0,rp=0;
            base.forEach(c=>{
                if(c.verNorm==='verified') v++;
                else if(c.verNorm==='under_review') ur++;
                else nv++;
                c.acts.forEach(a=>{
                    if(a==='Fine') fi++;
                    else if(a==='Demolish') dm++;
                    else if(a==='New Permit') np++;
                    else if(a==='Renew Permit') rp++;
                });
            });

            // All cards reflect the current filtered view
            animVal('kpi-total-cases', base.length);
            animVal('kpi-verified', v);
            animVal('kpi-unverified', nv);
            animVal('kpi-under-review', ur);
            animVal('kpi-fine', fi);
            animVal('kpi-demolished', dm);
            animVal('kpi-newpermit', np);
            animVal('kpi-renewed', rp);
        },
        renderMap() {
            if(!S.gl) return; S.gl.removeAll();
            let plotted=0;
            S.filtered.forEach(c=>{ if(!c.geo) return; const isSel=c.id===S.selectedId; S.gl.add(new Graphic({ geometry:c.geo, symbol:{type:'simple-marker',size:isSel?12:9,color:isSel?'#4f46e5':'#ef4444',outline:{width:isSel?2:1.5,color:isSel?'#312e81':'rgba(255,255,255,0.8)'}}, attributes:{cid:c.id} })); plotted++; });
            const mb=document.getElementById('map-count');
            if(plotted>0){mb.textContent=plotted+' cases';mb.style.display='block';}else mb.style.display='none';
            document.getElementById('legend-sel').style.display=S.selectedId?'flex':'none';
        },
        renderList() {
            const tbody=document.getElementById('cases-tbody');
            const total=S.filtered.length;
            const badge=document.getElementById('table-count');
            if(badge) badge.textContent=total;
            if(!tbody){ return; }
            if(!total){
                tbody.innerHTML='<tr><td colspan="5" style="padding:16px;text-align:center;font-size:12px;color:var(--text-muted)">No cases match current filters</td></tr>';
                return;
            }
            const sortBy=(document.getElementById('table-sort-by')||{}).value||'date_asc';
            const verOrder={verified:0,under_review:1,not_verified:2};
            const sorted=[...S.filtered].sort((a,b)=>{
                const da=a.inspDate?new Date(a.inspDate).getTime():Infinity;
                const db=b.inspDate?new Date(b.inspDate).getTime():Infinity;
                const idA=String(a.id||'').toLowerCase();
                const idB=String(b.id||'').toLowerCase();
                const secA=String(a.sector||'').toLowerCase();
                const secB=String(b.sector||'').toLowerCase();
                const upiA=String(a.upi||'').toLowerCase();
                const upiB=String(b.upi||'').toLowerCase();
                const vsA=String(a.vsLabel||'').toLowerCase();
                const vsB=String(b.vsLabel||'').toLowerCase();
                let cmp=0;
                if(sortBy==='date_asc'||sortBy==='date'){ cmp=da-db; }
                else if(sortBy==='date_desc'){ cmp=db-da; }
                else if(sortBy==='state'){
                    const va=verOrder[a.verNorm]!=null?verOrder[a.verNorm]:3;
                    const vb=verOrder[b.verNorm]!=null?verOrder[b.verNorm]:3;
                    cmp=va!==vb?va-vb:da-db;
                }
                else if(sortBy==='id_asc'){ cmp=idA.localeCompare(idB)||da-db; }
                else if(sortBy==='id_desc'){ cmp=idB.localeCompare(idA)||da-db; }
                else if(sortBy==='sector'){ cmp=secA.localeCompare(secB)||da-db; }
                else if(sortBy==='upi'){ cmp=upiA.localeCompare(upiB)||da-db; }
                else if(sortBy==='visitstatus'){ cmp=vsA.localeCompare(vsB)||da-db; }
                else { cmp=da-db; }
                return cmp;
            });
            const rows=sorted.slice(0,10);
            tbody.innerHTML=rows.map(c=>{
                const statusClass=c.verNorm==='verified'?'case-status-verified':c.verNorm==='under_review'?'case-status-review':'case-status-unverified';
                const statusLabel=c.verNorm==='verified'?'Verified':c.verNorm==='under_review'?'Under Review':'Unverified';
                return `<tr id="row-${esc(c.id)}" class="${c.id===S.selectedId?'case-row-selected':''}">
                    <td class="mono">${esc(c.id||'—')}</td>
                    <td class="mono">${esc(c.upi||'—')}</td>
                    <td>${esc(c.vsLabel||'—')}</td>
                    <td>
                        <span class="case-status-badge ${statusClass}">${statusLabel}</span>
                    </td>
                    <td>
                        <button type="button" class="view-details-btn" onclick="APP.openView('${esc(c.id)}')" title="View details"><span class="icon icon-sm"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg></span></button>
                    </td>
                </tr>`;
            }).join('');
        },
        selectCase(id) {
            S.selectedId=id===S.selectedId?null:id;
            this.renderMap();
            this.renderList();
            if(S.selectedId){
                const el=document.getElementById('row-'+S.selectedId);
                if(el) el.scrollIntoView({behavior:'smooth',block:'nearest'});
            }
        },
        updateRowStatus(id, value) {
            const c=S.cases.find(x=>x.id===id);
            if(!c) return;
            if(!value) return;
            c.verNorm=value;
            c._mod=true;
            this.kpis();
            this.renderMap();
            this.renderList();
            this.renderCharts();
        },
        openView(id) {
            const c=S.cases.find(x=>x.id===id); if(!c) return;
            S.selectedId=id; this.renderMap(); this.renderList();
            const vc={'verified':'pill-verified','not_verified':'pill-notverified','under_review':'pill-underreview'}[c.verNorm]||'';
            const vl={'verified':'Verified','not_verified':'Unverified','under_review':'Under Review'}[c.verNorm]||'—';
            const ap=c.acts.length?c.acts.map(a=>`<span class="pill ${pillClass(a)}" style="margin:2px">${esc(a)}</span>`).join(''):'<span style="color:var(--text-muted)">None recorded</span>';
            const location=[c.sector,c.cell,c.village].filter(Boolean).join(' • ')||'—';
            document.getElementById('view-body').innerHTML=`
                <div class="case-detail-header">
                    <div class="case-detail-main">
                        <div class="case-detail-id">${esc(c.id||'—')}</div>
                        <div class="case-detail-sub">
                            <span>${esc(c.upi||'No UPI')}</span>
                            <span>• ${esc(location)}</span>
                        </div>
                    </div>
                    <div class="case-detail-status">
                        <span class="pill ${vc}">${vl}</span>
                        <span class="pill pill-illegal">${esc(c.vsLabel||'—')}</span>
                    </div>
                </div>
                <div class="case-detail-body">
                    <div class="detail-grid">
                        <div class="detail-item"><div class="detail-label">Sector</div><div class="detail-value">${esc(c.sector||'—')}</div></div>
                        <div class="detail-item"><div class="detail-label">Cell</div><div class="detail-value">${esc(c.cell||'—')}</div></div>
                        <div class="detail-item"><div class="detail-label">Village</div><div class="detail-value">${esc(c.village||'—')}</div></div>
                        <div class="detail-item"><div class="detail-label">Inspector</div><div class="detail-value">${esc(c.inspector||'—')}</div></div>
                        <div class="detail-item"><div class="detail-label">Inspecting Date</div><div class="detail-value">${fd(c.inspDate)}</div></div>
                        <div class="detail-item"><div class="detail-label">Source</div><div class="detail-value">${esc(c.srcLabel||'—')}</div></div>
                        <div class="detail-item"><div class="detail-label">Action Taken</div><div class="detail-value">${esc(c.actionTaken||'—')}</div></div>
                        <div class="detail-divider"></div>
                        <div class="detail-item"><div class="detail-label">Verification</div><div class="detail-value"><span class="pill ${vc}">${vl}</span></div></div>
                        <div class="detail-item"><div class="detail-label">Committee Actions</div><div class="detail-value" style="display:flex;flex-wrap:wrap;gap:4px">${ap}</div></div>
                        ${c.fineAmt?`<div class="detail-item"><div class="detail-label">Fine Amount</div><div class="detail-value"><span class="rwf-badge">RWF</span> <span class="mono">${Number(c.fineAmt).toLocaleString()}</span></div></div>`:''}
                        <div class="detail-full"><div class="detail-label" style="margin-bottom:5px">Case Description</div><div class="detail-desc">${esc(c.description||'No description.')}</div></div>
                    </div>
                </div>`;
            document.getElementById('view-cmt-btn').onclick=()=>{ this.closeModal('view-modal'); this.openCmt(id); };
            document.getElementById('view-modal').classList.add('open');
        },
        openCmt(id) {
            const c=S.cases.find(x=>x.id===id); if(!c) return;
            S.selectedId=id; S.dec=null;
            const suggested=c.fieldSuggestedActions||'';
            document.getElementById('cmt-case-info').innerHTML=
                `<div class="detail-label" style="margin-bottom:4px">Suggested actions from inspection</div>`+
                `<div class="detail-desc">${esc(suggested||'No suggested actions recorded.')}</div>`;
            ['c','nc','rv'].forEach(d=>{ document.getElementById('dlbl-'+d).className='dec-label'; document.getElementById('dradio-'+d).className='dec-radio'; });
            document.getElementById('action-panel').style.display='none';
            document.getElementById('ver-group').style.display='block';
            document.getElementById('auto-note').style.display='none';
            ['fine','demo','new','renew'].forEach(a=>{ const el=document.getElementById('chk-'+a); if(el){el.checked=false;} document.getElementById('ach-'+a).classList.remove('on'); });
            const fineWrap=document.getElementById('fine-amount-wrap');
            const fineInput=document.getElementById('fine-amount');
            if(fineWrap&&fineInput){ fineWrap.style.display='none'; fineInput.value=''; }
            document.getElementById('cmt-notes').value='';
            document.getElementById('cmt-ver').value=c.verNorm||'';
            document.getElementById('cmt-modal').classList.add('open');
        },
        pickDec(d) {
            S.dec=d;
            const selMap={c:'sel-c',nc:'sel-nc',rv:'sel-rv'};
            ['c','nc','rv'].forEach(k=>{ document.getElementById('dlbl-'+k).className='dec-label'+(k===d?' '+selMap[k]:''); const r=document.getElementById('dradio-'+k); r.className='dec-radio'+(k===d?' on':''); });
            document.getElementById('action-panel').style.display=d==='nc'?'block':'none';
            document.getElementById('auto-note').style.display=d==='nc'?'flex':'none';
            document.getElementById('ver-group').style.display=d==='nc'?'none':'block';
        },
        toggleAct(key, el) {
            const chk=document.getElementById('chk-'+key); chk.checked=!chk.checked; el.classList.toggle('on',chk.checked);
            if(key==='fine'){
                const fineWrap=document.getElementById('fine-amount-wrap');
                const fineInput=document.getElementById('fine-amount');
                if(fineWrap&&fineInput){
                    if(chk.checked){
                        const cur=S.cases.find(x=>x.id===S.selectedId);
                        const amt=cur&&cur.fineAmt!=null?Number(cur.fineAmt):NaN;
                        if(Number.isFinite(amt)&&amt>0){
                            fineWrap.style.display='block';
                            fineInput.value=amt.toLocaleString();
                        }else{
                            fineWrap.style.display='block';
                            fineInput.value='—';
                        }
                    } else {
                        fineWrap.style.display='none';
                        fineInput.value='';
                    }
                }
            }
        },
        async saveDecision() {
            const id=S.selectedId, c=S.cases.find(x=>x.id===id); if(!c) return;
            if(!S.dec){ this.toast('Please choose a decision','error'); return; }
            let ver;
            let acts=[];
            let fine=null;
            const notesInput=document.getElementById('cmt-notes');
            const comment=(notesInput?.value||'').trim();
            let committeeVerificationStatus=null;
            let committeeCompliantStatus=null;
            if(S.dec==='nc'){
                const chks=['fine','demo','new','renew'];
                acts=chks.filter(a=>document.getElementById('chk-'+a).checked).map(a=>({fine:'Fine',demo:'Demolish',new:'New Permit',renew:'Renew Permit'}[a]));
                if(!acts.length){ this.toast('Select at least one enforcement action','error'); return; }
                if(acts.includes('Fine')){
                    const amt=c.fineAmt!=null?Number(c.fineAmt):null;
                    if(!amt||isNaN(amt)||amt<=0){
                        this.toast('Fine amount is missing or invalid for this case (RWF)','error');
                        return;
                    }
                    fine=amt;
                }
                ver='verified';
                committeeVerificationStatus='Verified';
                committeeCompliantStatus='Non Compliant';
            } else if(S.dec==='c'){
                ver='verified';
                acts=[];
                fine=null;
                committeeVerificationStatus='Verified';
                committeeCompliantStatus='Compliant';
            } else {
                // Review path — verification forced to "under_review" with required comment
                ver='under_review';
                if(!comment){ this.toast('Please add notes for review decision','error'); return; }
                committeeVerificationStatus='Review';
                committeeCompliantStatus='';
            }

            const committeeActionStr=toCommitteeActionString(acts);
            let caseIdentifier=null;
            if(c.backendObjectId!=null){
                const n=Number(c.backendObjectId);
                if(Number.isFinite(n)&&n>0) caseIdentifier=n;
            }
            if(caseIdentifier==null&&c.id!=null){
                const n=parseInt(String(c.id),10);
                if(Number.isFinite(n)&&n>0) caseIdentifier=n;
            }
            if(caseIdentifier==null){
                this.toast('Case OBJECTID is missing or invalid — cannot save decision','error');
                return;
            }
            const baseUrl=(CFG.API_BASE_URL||'').replace(/\/+$/,'');
            if(!baseUrl){ this.toast('API base URL is not configured','error'); return; }
            const url=baseUrl+'/decision-enforcement/from-case/'+encodeURIComponent(caseIdentifier);
            const payload={
                committee_action:committeeActionStr,
                committeeverification_status:committeeVerificationStatus||null,
                committeecompliantstatus:committeeCompliantStatus||null,
                fine_amount:fine!=null?fine:null,
                comment:committeeVerificationStatus==='Review'?(comment||null):null
            };

            const saveBtn=document.getElementById('save-committee-btn');
            if(saveBtn) saveBtn.disabled=true;
            try{
                this.toast('Saving decision to server…','info');
                const res=await fetch(url,{
                    method:'POST',
                    headers:{'Content-Type':'application/json'},
                    body:JSON.stringify(payload)
                });
                if(!res.ok){ throw new Error('Failed with status '+res.status); }
                await fetch(url,{method:'POST'});

                c.verNorm=ver;
                c.acts=acts;
                c.fineAmt=fine;
                c._mod=true;

                this.closeModal('cmt-modal');
                this.kpis(); this.renderMap(); this.renderList(); this.renderCharts();
                const vl={verified:'Verified',not_verified:'Unverified',under_review:'Under Review'}[ver];
                this.toast('Case '+id+': '+vl+(c.acts.length?' · '+c.acts.join(', '):''),'success');
            }catch(err){
                console.error(err);
                this.toast('Error saving decision to server','error');
            }finally{
                if(saveBtn) saveBtn.disabled=false;
            }
        },
        saveCommitteeAction() {
            return this.saveDecision();
        },
        renderCharts() { this.renderPie(); this.renderSector(); this.renderLine(); },
        renderPie() {
            const nc=(S.filtered.length?S.filtered:S.cases.filter(c=>isNC(c)));
            let fi=0,dm=0,np=0,rp=0,none=0;
            nc.forEach(c=>{ if(!c.acts.length){none++;return;} c.acts.forEach(a=>{if(a==='Fine')fi++;else if(a==='Demolish')dm++;else if(a==='New Permit')np++;else if(a==='Renew Permit')rp++;})});
            const data=[fi,dm,np,rp,none], labels=['Fine','Demolish','New Permit','Renew Permit','No Action'], colors=['#3b82f6','#ef4444','#f59e0b','#22c55e','#9ba2b8'];
            const ctx=document.getElementById('pieChart').getContext('2d');
            if(pieInst){ pieInst.data.datasets[0].data=data; pieInst.update('active'); return; }
            pieInst=new Chart(ctx,{
                type:'doughnut',
                data:{labels,datasets:[{data,backgroundColor:colors,borderWidth:2,borderColor:'#fff',hoverOffset:10}]},
                options:{
                    responsive:true,
                    maintainAspectRatio:false,
                    cutout:'60%',
                    animation:{animateRotate:true,duration:900},
                    plugins:{
                        legend:{position:'bottom'},
                        tooltip:{callbacks:{label:c=>' '+c.label+': '+c.raw}}
                    }
                }
            });
        },
        renderSector() {
            const base=(S.filtered.length?S.filtered:S.cases.filter(c=>isNC(c)));
            const nc=base.filter(c=>{
                if(sectorVerFilter && c.verNorm!==sectorVerFilter) return false;
                if(sectorActFilter){
                    if(sectorActFilter==='__none') return !c.acts.length;
                    return c.acts.includes(sectorActFilter);
                }
                return true;
            });
            const map={};
            nc.forEach(c=>{
                const key=sectorMode==='cell'?(c.cell||'(Unknown)'):(c.sector||'(Unknown)');
                if(!map[key]) map[key]={v:0,nv:0,r:0,t:0};
                map[key].t++;
                if(c.verNorm==='verified') map[key].v++;
                else if(c.verNorm==='under_review') map[key].r++;
                else map[key].nv++;
            });
            const rows=Object.entries(map).sort((a,b)=>b[1].t-a[1].t);
            const labels=rows.map(([s])=>s);
            const vData=rows.map(([,d])=>d.v);
            const nvData=rows.map(([,d])=>d.nv);
            const rData=rows.map(([,d])=>d.r);
            const ctx=document.getElementById('sectorChart').getContext('2d');
            const data={
                labels,
                datasets:[
                    { label:'Verified', data:vData, backgroundColor:'#16a34a' },
                    { label:'Unverified', data:nvData, backgroundColor:'#b91c1c' },
                    { label:'Under Review', data:rData, backgroundColor:'#b45309' }
                ]
            };
            const options={
                responsive:true,
                maintainAspectRatio:false,
                plugins:{
                    legend:{ position:'bottom', labels:{ boxWidth:12, boxHeight:12, padding:10 } },
                    tooltip:{ enabled:true }
                },
                scales:{
                    x:{ stacked:false, title:{ display:true, text:sectorMode==='cell'?'Cell':'Sector' }, grid:{ display:false } },
                    y:{ beginAtZero:true, title:{ display:true, text:'Number of cases' }, grid:{ color:'#eef1f7' } }
                }
            };
            if(sectorInst){
                sectorInst.data=data;
                sectorInst.options=options;
                sectorInst.update();
            } else {
                sectorInst=new Chart(ctx,{ type:'bar', data, options });
            }
        },
        setTimeMode(mode,btn) { timeMode=mode; document.querySelectorAll('.ctab').forEach(t=>t.classList.remove('active')); btn.classList.add('active'); this.renderLine(); },
        renderLine() {
            const base=(S.filtered.length?S.filtered:S.cases.filter(c=>isNC(c)));
            const seriesCases=base.filter(c=>{
                if(!c.inspDate) return false;
                if(timeVerFilter==='verified' && c.verNorm!=='verified') return false;
                if(timeActFilter){
                    if(timeActFilter==='__none') return !c.acts.length;
                    return c.acts.includes(timeActFilter);
                }
                return true;
            });
            const now=new Date(), buckets={};
            const monthNames=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            seriesCases.forEach(c=>{ const d=new Date(c.inspDate); let key;
                if(timeMode==='week'){ const diff=Math.floor((now-d)/(7*24*3600*1000)); if(diff>11) return; key='W'+diff; }
                else { const m=d.getMonth(); key=monthNames[m]; buckets[key]=(buckets[key]||0)+1; return; }
                buckets[key]=(buckets[key]||0)+1;
            });
            let labels,data;
            if(timeMode==='week'){ const ws=Array.from({length:12},(_,i)=>i).reverse(); labels=ws.map(i=>i===0?'This week':i+'w ago'); data=ws.map(i=>buckets['W'+i]||0); }
            else { labels=[...monthNames]; data=labels.map(m=>buckets[m]||0); }
            const xTitle=timeMode==='week'?'Weeks (last 12)':'Months (Jan–Dec)';
            const ctx=document.getElementById('lineChart').getContext('2d');
            if(lineInst){
                lineInst.data.labels=labels;
                lineInst.data.datasets[0].data=data;
                lineInst.options.scales.x.title.text=xTitle;
                lineInst.update();
                return;
            }
            lineInst=new Chart(ctx,{
                type:'bar',
                data:{labels,datasets:[{label:'Verified cases',data,backgroundColor:'rgba(15,113,115,0.18)',borderColor:'#0F7173',borderWidth:2,borderRadius:5,hoverBackgroundColor:'rgba(15,113,115,0.32)'}]},
                options:{
                    responsive:true,
                    maintainAspectRatio:false,
                    animation:{duration:800},
                    plugins:{
                        legend:{position:'bottom'},
                        tooltip:{callbacks:{label:c=>' '+c.raw+' cases'}}
                    },
                    scales:{
                        x:{
                            grid:{display:false},
                            ticks:{font:{size:10},color:'#9ba2b8'},
                            title:{display:true,text:xTitle}
                        },
                        y:{
                            grid:{color:'#eef1f7'},
                            ticks:{font:{size:10},color:'#9ba2b8',stepSize:1},
                            beginAtZero:true,
                            title:{display:true,text:'Number of verified cases'}
                        }
                    }
                }
            });
        },
        closeModal(id){ document.getElementById(id).classList.remove('open'); },
        chips(f){
            const el=document.getElementById('active-chips'); el.innerHTML='';
            Object.entries(f).forEach(([k,v])=>{ if(!v) return; const s=document.createElement('span'); s.className='chip'; s.innerHTML=`${k}: ${esc(v)} <span class="chip-x" onclick="APP.clearChip('${k}')">&times;</span>`; el.appendChild(s); });
        },
        clearChip(k){ const m={Source:'filter-source',Verification:'filter-verification',Sector:'filter-sector',Search:'global-search'}; if(m[k]) document.getElementById(m[k]).value=''; this.applyFilters(); },
        resetDashboard(){
            ['filter-source','filter-verification','filter-sector'].forEach(id=>document.getElementById(id).value='');
            document.getElementById('global-search').value=''; S.selectedId=null; this.applyFilters();
            if(S.view) S.view.goTo({center:[30.0619,-1.9441],zoom:11},{duration:600});
        },
        toast(msg,type='info'){
            const stack=document.getElementById('toast-stack'), el=document.createElement('div');
            el.className='toast '+(type==='success'?'toast-success':type==='error'?'toast-error':'');
            el.innerHTML=`<span style="font-size:13px">${type==='success'?'✓':type==='error'?'✗':'ℹ'}</span><span>${esc(msg)}</span>`;
            stack.appendChild(el);
            setTimeout(()=>{ el.style.animation='toastOut 0.3s ease forwards'; setTimeout(()=>el.remove(),300); },4500);
        }
    };

    document.getElementById('global-search').addEventListener('keydown',e=>{ if(e.key==='Enter') APP.applyFilters(); });
    document.querySelectorAll('.modal-overlay').forEach(o=>{ o.addEventListener('click',e=>{ if(e.target===o) APP.closeModal(o.id); }); });

    const locModeSel=document.getElementById('chart-loc-mode');
    if(locModeSel){
        locModeSel.addEventListener('change',e=>{ sectorMode=e.target.value||'sector'; APP.renderSector(); });
    }
    const locVerSel=document.getElementById('chart-loc-ver');
    if(locVerSel){
        locVerSel.addEventListener('change',e=>{ sectorVerFilter=e.target.value||''; APP.renderSector(); });
    }
    const locActSel=document.getElementById('chart-loc-act');
    if(locActSel){
        locActSel.addEventListener('change',e=>{ sectorActFilter=e.target.value||''; APP.renderSector(); });
    }

    const timeVerSel=document.getElementById('chart-time-ver');
    if(timeVerSel){
        timeVerSel.addEventListener('change',e=>{ timeVerFilter=e.target.value||''; APP.renderLine(); });
    }
    const timeActSel=document.getElementById('chart-time-act');
    if(timeActSel){
        timeActSel.addEventListener('change',e=>{ timeActFilter=e.target.value||''; APP.renderLine(); });
    }

    document.querySelectorAll('.source-card').forEach(card=>{
        card.addEventListener('click',()=>{
            const src=card.getAttribute('data-source');
            if(window.APP) APP.setSourceFilter(src||'');
        });
    });
});

