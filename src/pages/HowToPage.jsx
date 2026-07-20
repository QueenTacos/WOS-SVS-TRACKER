import { SampleItemRow } from '../components/SampleItemRow.jsx';
import { ScheduleBlock } from '../components/ScheduleBlock.jsx';
import { StepCard } from '../components/StepCard.jsx';
import { DEFAULT_SITE_CONTENT } from '../lib/siteContent.js';
import { ACCENT, BORDER, CARD, GOLD, GREEN, MUTED, ORANGE, TEXT } from '../lib/theme.js';

export function HowToPage({setPage,phase,siteContent}){
  const c={...DEFAULT_SITE_CONTENT,...(siteContent||{})};
  const rules=Array.isArray(c.rules)?c.rules:DEFAULT_SITE_CONTENT.rules;
  return(
    <div className="fade" style={{maxWidth:700,margin:"0 auto"}}>
      <h2 style={{fontSize:24,fontWeight:700,color:TEXT,marginBottom:4}}>📋 How to Submit Your Bag</h2>
      <p style={{color:MUTED,fontSize:14,marginBottom:28}}>{c.howto_intro||"Everything you need to know about tracking your bag for SVS prep."}</p>

      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        <StepCard num="1" title={c.step1_title||"Create Your Account"} color={ACCENT}>
          <p style={{whiteSpace:"pre-wrap"}}>{c.step1_text||`Click Player Login in the nav. Choose Create Account and fill in your Player Name, Gamer ID, Alliance Tag, and a 4-digit PIN.

⚠️ Remember your PIN — there's no recovery if you forget it. Contact an admin.`}</p>
        </StepCard>

        <StepCard num="2" title={c.step2_title||"Submit Your Bag"} color={GREEN}>
          <p style={{whiteSpace:"pre-wrap"}}>{c.step2_text||`Once logged in, go to Submit Bag. Upload a screenshot and/or manually enter quantities for each item.

⭐ Items marked with a gold star are SVS priority items — fill these in accurately as they count toward your growth score.`}</p>
        </StepCard>

        <StepCard num="3" title={c.step3_title||"Submission Windows"} color={ORANGE}>
          <p style={{whiteSpace:"pre-wrap",marginBottom:10}}>{c.step3_text||`Baseline window: Submit your starting bag.
Vanity period: Keep updating to climb the leaderboard.
Final window: Submit your ending bag for the contest.`}</p>
          <ScheduleBlock/>
        </StepCard>

        <StepCard num="4" title={c.step4_title||"Leaderboard & Winning"} color={GOLD}>
          <p style={{whiteSpace:"pre-wrap"}}>{c.step4_text||`The Leaderboard shows players ranked by overall bag growth %.

🥇🥈 Top 2 players by growth % win Frost Stars.
Alliance standings are also tracked.
Only name and alliance tag are visible on the public leaderboard.`}</p>
        </StepCard>
      </div>

      {/* Sample form preview */}
      <div style={{marginTop:32,background:CARD,border:`1px solid ${BORDER}`,borderRadius:12,padding:20}}>
        <h3 style={{fontSize:16,fontWeight:700,color:ACCENT,marginBottom:4}}>📝 Sample — Bag Entry Form</h3>
        <p style={{color:MUTED,fontSize:12,marginBottom:16}}>This is what the form looks like. SVS priority items are highlighted in gold.</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:8}}>
          {["Fire Crystal","Refined Fire Crystal","Advanced Wild Mark","Mythic General Hero Shard","Kathy Sigil","Common Wild Mark","Mithril","Essence Stones","Book of Knowledge","Pet Food"].map(item=>(
            <SampleItemRow key={item} name={item} />
          ))}
        </div>
        <p style={{color:MUTED,fontSize:11,marginTop:12,textAlign:"center"}}>Log in and go to Submit Bag to fill in your full bag.</p>
        <div style={{textAlign:"center",marginTop:12}}>
          <button className="bp" onClick={()=>setPage("login")}>Log In to Submit →</button>
        </div>
      </div>
    </div>
  );
}
