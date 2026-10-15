/** Controls follow the supplied Tone toolbar: ruler, objects, doors and share. */
export function BookcaseToolIcon({kind}:{kind:'ruler'|'decor'|'doors'|'share'}){
 return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
  {kind==='ruler'&&<g transform="rotate(-45 12 12)"><rect x="3" y="7" width="18" height="10" rx=".5"/><path d="M7 7v5m4-5v3m4-3v5m4-5v3"/></g>}
  {kind==='decor'&&<><path d="M3 8h4v13H3zm5-4h4v17H8zm5 17h8M15 11h5l1 8a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2zM16 11V8h3v3M14 7a4 4 0 0 1 8 0z"/></>}
  {kind==='doors'&&<><rect x="4" y="3" width="16" height="18"/><path d="M12 3v18M9 10v4m6-4v4"/></>}
  {kind==='share'&&<><path d="M8 8H4v13h16V8h-4M12 15V2M8 6l4-4 4 4"/></>}
 </svg>;
}
