export function createRunner(code, onOutput = ()=>{}, onInput = ()=>{}){
  // Very small interpreter: supports PRINT and LET <var> = <number>
  const lines = code.split(/\r?\n/).map(l=>l.trim()).filter(l=>l.length)
  const env = {}
  let stopped = false

  function evalExpr(expr){
    expr = expr.trim()
    if(/^".*"$/.test(expr)) return expr.slice(1,-1)
    if(/^[0-9.]+$/.test(expr)) return Number(expr)
    return env[expr] ?? 0
  }

  async function run(){
    for(let i=0;i<lines.length;i++){
      if(stopped) break
      const line = lines[i]
      if(line.toUpperCase().startsWith('PRINT ')){
        const rest = line.slice(6).trim()
        const out = evalExpr(rest)
        onOutput(String(out))
        await new Promise(r=>setTimeout(r,0))
      } else if(line.toUpperCase().startsWith('LET ')){
        const rhs = line.slice(4)
        const m = rhs.match(/^([A-Za-z][A-Za-z0-9_]*)\s*=\s*(.+)$/)
        if(m){
          const [,name,expr] = m
          env[name] = evalExpr(expr)
        }
      } else if(line.toUpperCase() === 'END'){
        break
      } else {
        onOutput('UNRECOGNIZED: '+line)
      }
    }
    onOutput('\n[Program finished]')
  }

  return {
    start(){ stopped = false; run() },
    stop(){ stopped = true }
  }
}
