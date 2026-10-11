import { test, expect } from '@playwright/test';
const login=async(page:any)=>{
  await page.goto('/login');
  await page.getByPlaceholder('Seu e-mail cadastrado').fill('cashier@example.test');
  await page.getByPlaceholder('Sua senha').fill('Ficticia-2026!');
  const result=page.waitForResponse((r:any)=>r.url().endsWith('/api/v1/auth/login') && r.request().method()==='POST');
  await page.getByRole('button',{name:'Entrar',exact:true}).click();
  const response=await result;expect(response.status()).toBe(201);await page.waitForURL('/');return response;
};
test('SIG-01/02: protected real cookie, no bearer storage/response, SSR reload and logout replay',async({page,context})=>{
  await page.addInitScript(()=>{localStorage.setItem('auth_token','legacy-token');localStorage.setItem('auth_user','{}');});
  const response=await login(page);const body=await response.json();expect(body.data.access_token).toBeUndefined();
  const cookies=await context.cookies();const cookie=cookies.find((c)=>c.name==='__Host-sigmavet_session')!;
  expect(cookie).toBeDefined();expect(cookie.httpOnly).toBe(true);expect(cookie.secure).toBe(true);expect(cookie.sameSite).toBe('Lax');
  const storage=await page.evaluate(()=>({local:localStorage.getItem('auth_token'),session:sessionStorage.getItem('auth_token'),cookie:document.cookie,html:document.documentElement.innerHTML}));
  expect(storage.local).toBeNull();expect(storage.session).toBeNull();expect(storage.cookie).not.toContain(cookie.value);expect(storage.html).not.toContain(cookie.value);
  await page.goto('/403');await page.reload();await expect(page).toHaveURL('/403');
  const me=await page.request.get('/api/v1/auth/me');expect(me.status()).toBe(200);const csrf=(await me.json()).data.csrfToken;
  const logout=await page.request.post('/api/v1/auth/logout',{headers:{Origin:'https://localhost:3443','X-Sigmavet-Request':'1','X-CSRF-Token':csrf}});expect(logout.status()).toBe(201);
  const replay=await page.request.get('/api/v1/auth/me',{headers:{Cookie:`${cookie.name}=${cookie.value}`}});expect(replay.status()).toBe(401);
});
test('SIG-03/04/05: HSTS, nonce CSP, scripts run and foreign iframe is blocked',async({page,browser})=>{
  const violations:string[]=[];page.on('console',(m)=>{if(m.type()==='error' && /Content Security Policy|Refused to execute/.test(m.text())) violations.push(m.text());});
  const response=await page.goto('/login');const headers=response!.headers();expect(headers['x-powered-by']).toBeUndefined();expect(headers['strict-transport-security']).toBe('max-age=300');expect(headers['x-frame-options']).toBe('DENY');
  expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");expect(headers['content-security-policy']).not.toContain("'unsafe-eval'");expect(headers['x-content-type-options']).toBe('nosniff');
  const nonce=headers['content-security-policy'].match(/'nonce-([^']+)'/)![1];
  expect(await page.locator('script:not([src]):not([type="application/json"])').evaluateAll((scripts,n)=>scripts.every((s)=>(s as HTMLScriptElement).nonce===n),nonce)).toBe(true);
  await login(page);expect(violations).toEqual([]);
  const ctx=await browser.newContext({ignoreHTTPSErrors:true});const foreign=await ctx.newPage();await foreign.route('https://foreign.test/',route=>route.fulfill({contentType:'text/html',body:'<iframe src="https://localhost:3443/login"></iframe>'}));
  await foreign.goto('https://foreign.test/');await foreign.waitForTimeout(1000);
  expect(await foreign.locator('iframe').contentFrame().getByText('Acesso ao Sigma Vet').count()).toBe(0);await ctx.close();
});
test('SIG-08/09: CASHIER denied on direct administrative and financial requests',async({page})=>{
  await login(page);for(const path of ['/api/v1/users','/api/v1/users/1','/api/v1/accounts-payable/dashboard']) expect((await page.request.get(path)).status()).toBe(403);
  const lookup=await page.request.get('/api/v1/users/lookup');expect(lookup.status()).toBe(200);expect(await lookup.json()).toEqual({data:[{id:5,name:'Veterinário'}]});
});
test('O-01/02: cross-site mutations rejected and identity responses cannot be cached',async({page})=>{
  await login(page);const me=await page.request.get('/api/v1/auth/me');expect(me.headers()['cache-control']).toBe('no-store');
  const result=await page.request.post('/api/v1/auth/logout',{headers:{Origin:'https://evil.test','X-Sigmavet-Request':'1','X-CSRF-Token':(await me.json()).data.csrfToken}});expect(result.status()).toBe(403);
  expect((await page.request.get('/api/v1/auth/me')).status()).toBe(200);
});
